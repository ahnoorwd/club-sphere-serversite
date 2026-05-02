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
    const eventsCollection = db.collection("events");
    const eventRegistrationsCollection = db.collection("eventRegistrations");

    app.get("/users", async (req, res) => {
      try {
        const result = await usersCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

    app.patch("/users/role/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { role } = req.body;

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              role,
              updatedAt: new Date(),
            },
          },
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update user role" });
      }
    });

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
    //  18||04||26

    app.get("/events", async (req, res) => {
      try {
        const result = await eventsCollection
          .find()
          .sort({ eventDate: 1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch events" });
      }
    });

    app.get("/events/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await eventsCollection.findOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch event details" });
      }
    });

    app.get("/event-registrations/check", async (req, res) => {
      try {
        const { email, eventId } = req.query;

        const existingRegistration = await eventRegistrationsCollection.findOne(
          {
            userEmail: email,
            eventId: eventId,
          },
        );

        res.send({ registered: !!existingRegistration });
      } catch (error) {
        res.status(500).send({ error: "Failed to check event registration" });
      }
    });

    //  here i checked the capacity of the event if any it will be deleted 29 04 26

    app.get("/events/:id/capacity", async (req, res) => {
      try {
        const id = req.params.id;

        const event = await eventsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!event) {
          return res.status(404).send({ error: "Event not found" });
        }

        const registeredCount =
          await eventRegistrationsCollection.countDocuments({
            eventId: id,
          });

        const maxAttendees = Number(event.maxAttendees) || 0;
        const availableSeats = maxAttendees - registeredCount;
        const isFull = maxAttendees > 0 && registeredCount >= maxAttendees;

        res.send({
          maxAttendees,
          registeredCount,
          availableSeats: availableSeats < 0 ? 0 : availableSeats,
          isFull,
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to check event capacity" });
      }
    });

    // here i upgraded with confusion 29 04 26 if have ant issues the prevous functinality uncoment it

    // app.post("/event-registrations", async (req, res) => {
    //   try {
    //     const registration = req.body;

    //     const existingRegistration = await eventRegistrationsCollection.findOne(
    //       {
    //         userEmail: registration.userEmail,
    //         eventId: registration.eventId,
    //       },
    //     );

    //     if (existingRegistration) {
    //       return res.send({
    //         message: "Already registered",
    //         insertedId: null,
    //       });
    //     }

    //     const newRegistration = {
    //       ...registration,
    //       status: "registered",
    //       registeredAt: new Date(),
    //     };

    //     const result =
    //       await eventRegistrationsCollection.insertOne(newRegistration);
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to register event" });
    //   }
    // });

    app.post("/event-registrations", async (req, res) => {
      try {
        const registration = req.body;

        const existingRegistration = await eventRegistrationsCollection.findOne(
          {
            userEmail: registration.userEmail,
            eventId: registration.eventId,
          },
        );

        if (existingRegistration) {
          return res.send({
            message: "Already registered",
            insertedId: null,
          });
        }

        const event = await eventsCollection.findOne({
          _id: new ObjectId(registration.eventId),
        });

        if (!event) {
          return res.status(404).send({ message: "Event not found" });
        }

        const registeredCount =
          await eventRegistrationsCollection.countDocuments({
            eventId: registration.eventId,
          });

        const maxAttendees = Number(event.maxAttendees) || 0;

        if (maxAttendees > 0 && registeredCount >= maxAttendees) {
          return res.send({
            insertedId: null,
            message: "Event is already full",
            full: true,
          });
        }

        const newRegistration = {
          ...registration,
          status: "registered",
          registeredAt: new Date(),
        };

        const result =
          await eventRegistrationsCollection.insertOne(newRegistration);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to register event" });
      }
    });

    app.get("/event-registrations/user/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const registrations = await eventRegistrationsCollection
          .find({ userEmail: email })
          .sort({ registeredAt: -1 })
          .toArray();

        const eventIds = registrations.map((registration) => {
          return new ObjectId(registration.eventId);
        });

        const events = await eventsCollection
          .find({ _id: { $in: eventIds } })
          .toArray();

        const registeredEvents = registrations.map((registration) => {
          const event = events.find(
            (event) => event._id.toString() === registration.eventId,
          );

          return {
            ...registration,
            event,
          };
        });

        res.send(registeredEvents);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch registered events" });
      }
    });

    //  here i upgraded the eventpayment if have any problem in my funvtinality delete it

    // app.post("/event-payments", async (req, res) => {
    //   try {
    //     const payment = req.body;

    //     const existingRegistration = await eventRegistrationsCollection.findOne(
    //       {
    //         userEmail: payment.userEmail,
    //         eventId: payment.eventId,
    //       },
    //     );

    //     if (existingRegistration) {
    //       return res.send({
    //         inserted: false,
    //         message: "User already registered for this event",
    //       });
    //     }

    //     const paymentDoc = {
    //       userEmail: payment.userEmail,
    //       amount: payment.amount,
    //       type: "event",
    //       eventId: payment.eventId,
    //       eventTitle: payment.eventTitle,
    //       clubId: payment.clubId,
    //       stripePaymentIntentId: payment.stripePaymentIntentId,
    //       status: "paid",
    //       createdAt: new Date(),
    //     };

    //     const paymentResult = await paymentsCollection.insertOne(paymentDoc);

    //     const registrationDoc = {
    //       userEmail: payment.userEmail,
    //       eventId: payment.eventId,
    //       clubId: payment.clubId,
    //       status: "registered",
    //       paymentId: payment.stripePaymentIntentId,
    //       registeredAt: new Date(),
    //     };

    //     const registrationResult =
    //       await eventRegistrationsCollection.insertOne(registrationDoc);

    //     res.send({
    //       inserted: true,
    //       paymentResult,
    //       registrationResult,
    //     });
    //   } catch (error) {
    //     res.status(500).send({
    //       error: "Failed to save event payment and registration",
    //     });
    //   }

    // });

    app.post("/event-payments", async (req, res) => {
      try {
        const payment = req.body;

        const existingRegistration = await eventRegistrationsCollection.findOne(
          {
            userEmail: payment.userEmail,
            eventId: payment.eventId,
          },
        );

        if (existingRegistration) {
          return res.send({
            inserted: false,
            message: "User already registered for this event",
          });
        }

        // Capacity check
        const event = await eventsCollection.findOne({
          _id: new ObjectId(payment.eventId),
        });

        if (!event) {
          return res.status(404).send({
            inserted: false,
            message: "Event not found",
          });
        }

        const registeredCount =
          await eventRegistrationsCollection.countDocuments({
            eventId: payment.eventId,
          });

        const maxAttendees = Number(event.maxAttendees) || 0;

        if (maxAttendees > 0 && registeredCount >= maxAttendees) {
          return res.send({
            inserted: false,
            full: true,
            message: "Event is already full",
          });
        }

        const paymentDoc = {
          userEmail: payment.userEmail,
          amount: Number(payment.amount) || 0,
          type: "event",
          eventId: payment.eventId,
          eventTitle: payment.eventTitle,
          clubId: payment.clubId,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          status: "paid",
          createdAt: new Date(),
        };

        const paymentResult = await paymentsCollection.insertOne(paymentDoc);

        const registrationDoc = {
          userEmail: payment.userEmail,
          eventId: payment.eventId,
          clubId: payment.clubId,
          status: "registered",
          paymentId: payment.stripePaymentIntentId,
          registeredAt: new Date(),
        };

        const registrationResult =
          await eventRegistrationsCollection.insertOne(registrationDoc);

        res.send({
          inserted: true,
          paymentResult,
          registrationResult,
        });
      } catch (error) {
        res.status(500).send({
          error: "Failed to save event payment and registration",
        });
      }
    });

    // 4||22||26

    app.get("/manager/approved-clubs/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const result = await clubsCollection
          .find({
            managerEmail: email,
            status: "approved",
          })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch approved clubs" });
      }
    });

    // 04||24||26

    app.get("/events/manager/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const managedClubs = await clubsCollection
          .find({ managerEmail: email })
          .project({ _id: 1 })
          .toArray();

        const clubIds = managedClubs.map((club) => club._id.toString());

        const result = await eventsCollection
          .find({ clubId: { $in: clubIds } })
          .sort({ eventDate: 1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch manager events" });
      }
    });

    app.patch("/events/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const eventData = req.body;

        const updatedEvent = {
          title: eventData.title,
          description: eventData.description,
          eventDate: eventData.eventDate,
          location: eventData.location,
          eventImage: eventData.eventImage,
          isPaid: eventData.isPaid === true || eventData.isPaid === "true",
          eventFee: Number(eventData.eventFee) || 0,
          maxAttendees: Number(eventData.maxAttendees) || 0,
          updatedAt: new Date(),
        };

        const result = await eventsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedEvent },
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update event" });
      }
    });

    app.delete("/events/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await eventsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete event" });
      }
    });

    app.post("/events", async (req, res) => {
      try {
        const eventData = req.body;

        const newEvent = {
          ...eventData,
          isPaid: eventData.isPaid === true || eventData.isPaid === "true",
          eventFee: Number(eventData.eventFee) || 0,
          maxAttendees: Number(eventData.maxAttendees) || 0,
          createdAt: new Date(),
        };

        const result = await eventsCollection.insertOne(newEvent);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create event" });
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
          },
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

    //  29||04||26 profile bases status update

    app.get("/profile-stats/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }

        const role = user.role || "member";

        let stats = {
          role,
        };

        if (role === "member") {
          const joinedClubs = await membershipsCollection.countDocuments({
            userEmail: email,
          });

          const registeredEvents =
            await eventRegistrationsCollection.countDocuments({
              userEmail: email,
            });

          const payments = await paymentsCollection.countDocuments({
            userEmail: email,
          });

          stats = {
            role,
            joinedClubs,
            registeredEvents,
            payments,
          };
        }

        if (role === "clubManager") {
          const createdClubs = await clubsCollection.countDocuments({
            managerEmail: email,
          });

          const managedClubs = await clubsCollection
            .find({ managerEmail: email })
            .project({ _id: 1 })
            .toArray();

          const clubIds = managedClubs.map((club) => club._id.toString());

          const createdEvents = await eventsCollection.countDocuments({
            clubId: { $in: clubIds },
          });

          stats = {
            role,
            createdClubs,
            createdEvents,
          };
        }

        if (role === "admin") {
          const totalUsers = await usersCollection.countDocuments();
          const totalClubs = await clubsCollection.countDocuments();
          const totalPayments = await paymentsCollection.countDocuments();

          stats = {
            role,
            totalUsers,
            totalClubs,
            totalPayments,
          };
        }

        res.send(stats);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch profile stats" });
      }
    });

    //  29||04||26 admin analatics update

    app.get("/admin/analytics", async (req, res) => {
      try {
        const totalUsers = await usersCollection.countDocuments();
        const totalClubs = await clubsCollection.countDocuments();
        const totalEvents = await eventsCollection.countDocuments();
        const totalPayments = await paymentsCollection.countDocuments();

        const payments = await paymentsCollection.find().toArray();

        const totalRevenue = payments.reduce((sum, payment) => {
          return sum + Number(payment.amount || 0);
        }, 0);

        const approvedClubs = await clubsCollection.countDocuments({
          status: "approved",
        });

        const pendingClubs = await clubsCollection.countDocuments({
          status: "pending",
        });

        const rejectedClubs = await clubsCollection.countDocuments({
          status: "rejected",
        });

        const members = await usersCollection.countDocuments({
          role: "member",
        });

        const managers = await usersCollection.countDocuments({
          role: "clubManager",
        });

        const admins = await usersCollection.countDocuments({
          role: "admin",
        });

        const membershipPayments = await paymentsCollection.countDocuments({
          type: "membership",
        });

        const eventPayments = await paymentsCollection.countDocuments({
          type: "event",
        });

        res.send({
          overview: {
            totalUsers,
            totalClubs,
            totalEvents,
            totalPayments,
            totalRevenue,
          },
          clubStatus: [
            { name: "Approved", value: approvedClubs },
            { name: "Pending", value: pendingClubs },
            { name: "Rejected", value: rejectedClubs },
          ],
          userRoles: [
            { name: "Members", value: members },
            { name: "Managers", value: managers },
            { name: "Admins", value: admins },
          ],
          paymentTypes: [
            { name: "Membership", value: membershipPayments },
            { name: "Event", value: eventPayments },
          ],
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch analytics" });
      }
    });

    // 29||04||26 member in stats update

    app.get("/member/dashboard-stats/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const joinedClubs = await membershipsCollection.countDocuments({
          userEmail: email,
        });

        const registeredEvents = await eventRegistrationsCollection
          .find({ userEmail: email })
          .toArray();

        const totalPayments = await paymentsCollection.countDocuments({
          userEmail: email,
        });

        const eventIds = registeredEvents.map((registration) => {
          return new ObjectId(registration.eventId);
        });

        const events = await eventsCollection
          .find({ _id: { $in: eventIds } })
          .sort({ eventDate: 1 })
          .toArray();

        const today = new Date();

        const upcomingEvents = events.filter((event) => {
          return new Date(event.eventDate) >= today;
        });

        res.send({
          joinedClubs,
          registeredEvents: registeredEvents.length,
          totalPayments,
          upcomingEventsCount: upcomingEvents.length,
          upcomingEvents: upcomingEvents.slice(0, 3),
        });
      } catch (error) {
        res
          .status(500)
          .send({ error: "Failed to fetch member dashboard stats" });
      }
    });

    // 29||04||26 mabmership leave funnctinality

    app.delete("/memberships/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await membershipsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to leave club" });
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

    // app.get("/memberships/user/:email", async (req, res) => {
    //   try {
    //     const email = req.params.email;

    //     const result = await membershipsCollection
    //       .find({ userEmail: email })
    //       .sort({ joinedAt: -1 })
    //       .toArray();

    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to fetch user memberships" });
    //   }
    // });

    //  01||05||26

    app.get("/memberships/user/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const memberships = await membershipsCollection
          .find({ userEmail: email })
          .sort({ joinedAt: -1 })
          .toArray();

        const clubIds = memberships.map((membership) => {
          return new ObjectId(membership.clubId);
        });

        const clubs = await clubsCollection
          .find({ _id: { $in: clubIds } })
          .toArray();

        const result = memberships.map((membership) => {
          const club = clubs.find(
            (club) => club._id.toString() === membership.clubId,
          );

          return {
            ...membership,
            clubInfo: club || null,
          };
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch user memberships",
        });
      }
    });

    //  01||05||26

    app.get("/community-leaders", async (req, res) => {
      try {
        const leaders = await usersCollection
          .find({
            role: { $in: ["admin", "clubManager"] },
          })
          .sort({ role: 1, createdAt: -1 })
          .toArray();

        res.send(leaders);
      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch community leaders",
        });
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
module.exports = app;

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;