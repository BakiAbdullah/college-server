const express = require("express");
const cors = require("cors");
require("dotenv").config();
const morgan = require("morgan");
// var jwt = require("jsonwebtoken");
const app = express();

const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ap9yj43.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // My database collections
    const usersCollection = client.db("CollegeDB").collection("users");
    const collegeCollection = client.db("CollegeDB").collection("collegesData");

    //TODO: Users Related API Starts

    // Save USER Email and ROLE in DB and avoid duplication of users in DB By the Put(Upsert) Method
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      // Check if the user already exists
      const exist = await usersCollection.findOne(query);
      if (exist) {
        return;
      }
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Get all Users Api
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // get a user from database by user email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //TODO: Users Related API ENDS

    // << Class Related Routes Starts >>>
    app.get("/allcolleges", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      let query = {};
      const options = {
        sort: { collegeRating: -1 },
      };
      const result = await collegeCollection
        .find(query, options)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    // Get a Single College Data
    app.get("/allcolleges/:id", async (req, res) => {
      const id = req.params.id;
      const result = await collegeCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

     // Search College by College name
    app.get("/searchCollege/:text", async (req, res) => {
      const queryText = req.params.text;
      if (!queryText) {
        return res.status(400).json({ error: "Query text is required" });
      }
      const result = await collegeCollection
        .find({ collegeName: { $regex: queryText, $options: "i" } })
        .toArray();
      res.send(result);
    });


    // << Class Related Routes Ends >>>

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("College server is Running Successfully");
});

app.listen(port, () => {
  console.log(`College Server is Running on Port: ${port}`);
});
