require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

    // 👉 HERE is my all  collections
    const clubsCollection = db.collection("clubs");
    const usersCollection = db.collection("users");
    const membershipsCollection = db.collection("memberships");
    const paymentsCollection = db.collection("payments");

    app.get("/clubs/featured", async (req, res) => {
      const result = await clubsCollection
        .find({ status: "approved" })
        .sort({ createdAt: -1 }) // latest first
        .limit(6)
        .toArray();

      res.send(result);
    });

    // app.get("/clubs", async (req, res) => {
    //   try {
    //     const result = await clubsCollection.find().toArray();
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to fetch clubs" });
    //   }
    // });

    // 04|10|26 

//   app.get("/clubs", async (req, res) => {
//   try {
//     const email = req.query.email;

//     let query = {};
//     if (email) {
//       query = { managerEmail: email };
//     }

//     const result = await clubsCollection.find(query).toArray();
//     res.send(result);
//   } catch (error) {
//     res.status(500).send({ error: "Failed to fetch clubs" });
//   }
// });


  //  11||04||26

      app.get("/clubs", async (req, res) => {
  try {
    const email = req.query.email;
    const status = req.query.status;

    let query = {};

    if (email) {
      query.managerEmail = email;
    }

    if (status) {
      query.status = status;
    }

    const result = await clubsCollection.find(query).toArray();
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

  //  11|04|26

    app.patch("/clubs/status/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const result = await clubsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to update club status" });
  }
});
    

    app.get("/users/role/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        res.send({ role: user.role });
      } catch (error) {
        res.status(500).send({ error: "Failed to get user role" });
      }
    });

// 4|10|26 
    
    app.post("/clubs", async (req, res) => {
  try {
    const club = req.body;

    const newClub = {
      ...club,
      membershipFee: Number(club.membershipFee) || 0,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await clubsCollection.insertOne(newClub);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to create club" });
  }
});





    app.post("/users", async (req, res) => {
      try {
        const user = req.body;

        const existingUser = await usersCollection.findOne({
          email: user.email,
        });

        if (existingUser) {
          return res.send({
            message: "User already exists",
            inserted: false,
          });
        }

        const newUser = {
          name: user.name || "",
          email: user.email,
          photoURL: user.photoURL || "",
          role: "member",
          createdAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to save user" });
      }
    });

    // check if a user already joined a club
    app.get("/memberships/check", async (req, res) => {
      try {
        const { email, clubId } = req.query;

        const existingMembership = await membershipsCollection.findOne({
          userEmail: email,
          clubId: clubId,
        });

        res.send({ joined: !!existingMembership });
      } catch (error) {
        res.status(500).send({ error: "Failed to check membership" });
      }
    });

    // create membership for free club join
    app.post("/memberships", async (req, res) => {
      try {
        const membership = req.body;

        const existingMembership = await membershipsCollection.findOne({
          userEmail: membership.userEmail,
          clubId: membership.clubId,
        });

        if (existingMembership) {
          return res.send({
            inserted: false,
            message: "You already joined this club",
          });
        }

        const newMembership = {
          userEmail: membership.userEmail,
          clubId: membership.clubId,
          clubName: membership.clubName || "",
          status: "active",
          joinedAt: new Date(),
        };

        const result = await membershipsCollection.insertOne(newMembership);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create membership" });
      }
    });

    // stripe activity

    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;

        const amountInCents = parseInt(amount * 100);

        if (!amount || amountInCents < 1) {
          return res.status(400).send({ error: "Invalid amount" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to create payment intent" });
      }
    });

    // Add payment save route

    app.post("/payments", async (req, res) => {
      try {
        const payment = req.body;

        const existingMembership = await membershipsCollection.findOne({
          userEmail: payment.userEmail,
          clubId: payment.clubId,
        });

        if (existingMembership) {
          return res.send({
            inserted: false,
            message: "User already joined this club",
          });
        }

        const paymentDoc = {
          userEmail: payment.userEmail,
          amount: payment.amount,
          type: "membership",
          clubId: payment.clubId,
          clubName: payment.clubName,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          status: "paid",
          createdAt: new Date(),
        };

        const paymentResult = await paymentsCollection.insertOne(paymentDoc);

        const membershipDoc = {
          userEmail: payment.userEmail,
          clubId: payment.clubId,
          clubName: payment.clubName,
          status: "active",
          paymentId: payment.stripePaymentIntentId,
          joinedAt: new Date(),
        };

        const membershipResult =
          await membershipsCollection.insertOne(membershipDoc);

        res.send({
          inserted: true,
          paymentResult,
          membershipResult,
        });
      } catch (error) {
        res
          .status(500)
          .send({ error: "Failed to save payment and membership" });
      }
    });

    app.get("/memberships/user/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const result = await membershipsCollection
          .find({ userEmail: email })
          .sort({ joinedAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch user memberships" });
      }
    });

    app.get("/payments/user/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const result = await paymentsCollection
          .find({ userEmail: email })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch payment history" });
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
