require("dotenv").config();
const { MongoClient, ServerApiVersion , ObjectId  } = require("mongodb");
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB connection

const uri =
  "mongodb+srv://clubsphere300web:bjz7opMaF4X78DHz@cluster0.u05ii.mongodb.net/?appName=Cluster0";

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("clubSphereDB");

    // 👉 HERE you define collections
    const clubsCollection = db.collection("clubs");
    const usersCollection = db.collection("users");

    app.get("/clubs/featured", async (req, res) => {
      const result = await clubsCollection
        .find({ status: "approved" })
        .sort({ createdAt: -1 }) // latest first
        .limit(6)
        .toArray();

      res.send(result);
    });

    app.get("/clubs", async (req, res) => {
  try {
    const result = await clubsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch clubs" });
  }
});

    app.get("/clubs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await clubsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch club details" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// test route
app.get("/", (req, res) => {
  res.send("ClubSphere Server Running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
