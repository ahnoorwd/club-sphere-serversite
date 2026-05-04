# ClubSphere Server

ClubSphere Server is the backend API for the ClubSphere web application. This server manages users, clubs, memberships, events, event registrations, payments, Stripe payment intent, role based dashboard data, and admin analytics.

---

## Server Status

```bash
GET /
```

Response:

```json
"ClubSphere Server Running"
```

---

## Live Client

```bash
https://clubsphereee.netlify.app/
```

---

## Main Features

- User registration
- User role management
- Admin, club manager, and member role system
- Club creation and approval system
- Featured approved clubs
- Free club joining system
- Paid club membership with Stripe
- Event creation, update, delete, and listing
- Free event registration
- Paid event registration with Stripe
- Event capacity checking
- Member dashboard statistics
- Club manager event management
- Admin analytics
- Payment history
- Community leaders listing

---

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Stripe
- CORS
- dotenv
- Vercel deployment support

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Required Packages

```bash
npm install express cors mongodb stripe dotenv
```

For development:

```bash
npm install -D nodemon
```

---

## Environment Variables

Create a `.env` file in the root folder and add the following variables:

```env
PORT=5000
STRIPE_SECRET_KEY=your_stripe_secret_key
NODE_ENV=development
```

Recommended for security:

```env
MONGODB_URI=your_mongodb_connection_string
```

> Important: Never share your MongoDB password, database URI, or Stripe secret key publicly.

---

## Run Locally

```bash
npm start
```

Or, if you use nodemon:

```bash
npm run dev
```

Local server URL:

```bash
http://localhost:5000
```

---

## Suggested package.json Scripts

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

---

## Database Information

Database name:

```bash
clubSphereDB
```

Collections used:

```bash
clubs
users
memberships
payments
events
eventRegistrations
```

---

# API Documentation

## Root API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check server running status |

---

## User APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | Get all users |
| POST | `/users` | Save a new user |
| GET | `/users/role/:email` | Get user role by email |
| PATCH | `/users/role/:id` | Update user role |

### Create User Example

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "photoURL": "https://example.com/photo.jpg"
}
```

Default user role:

```json
{
  "role": "member"
}
```

---

## Club APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/clubs` | Get all clubs |
| GET | `/clubs?email=user@example.com` | Get clubs by manager email |
| GET | `/clubs?status=approved` | Get clubs by status |
| GET | `/clubs/featured` | Get latest 6 approved clubs |
| GET | `/clubs/:id` | Get single club details |
| POST | `/clubs` | Create a new club |
| PATCH | `/clubs/status/:id` | Update club status |

### Create Club Example

```json
{
  "clubName": "Programming Club",
  "description": "A club for programming lovers",
  "clubImage": "https://example.com/club.jpg",
  "category": "Technology",
  "location": "Sylhet",
  "membershipFee": 20,
  "managerName": "John Doe",
  "managerEmail": "john@example.com"
}
```

New club default status:

```json
{
  "status": "pending"
}
```

---

## Membership APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/memberships/check?email=user@example.com&clubId=clubId` | Check if user already joined a club |
| POST | `/memberships` | Join a free club |
| GET | `/memberships/user/:email` | Get user's joined clubs with club details |
| DELETE | `/memberships/:id` | Leave a club |

### Free Membership Example

```json
{
  "userEmail": "member@example.com",
  "clubId": "club_id_here",
  "clubName": "Programming Club"
}
```

---

## Event APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/events` | Get all events |
| GET | `/events/:id` | Get event details |
| POST | `/events` | Create a new event |
| PATCH | `/events/:id` | Update an event |
| DELETE | `/events/:id` | Delete an event |
| GET | `/events/manager/:email` | Get manager's events |
| GET | `/events/:id/capacity` | Check event capacity |

### Create Event Example

```json
{
  "title": "Tech Meetup 2026",
  "description": "A meetup for technology lovers",
  "eventDate": "2026-05-20",
  "location": "Sylhet",
  "eventImage": "https://example.com/event.jpg",
  "clubId": "club_id_here",
  "clubName": "Programming Club",
  "isPaid": true,
  "eventFee": 10,
  "maxAttendees": 100
}
```

---

## Event Registration APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/event-registrations/check?email=user@example.com&eventId=eventId` | Check if user already registered for an event |
| POST | `/event-registrations` | Register for a free event |
| GET | `/event-registrations/user/:email` | Get user's registered events |

### Free Event Registration Example

```json
{
  "userEmail": "member@example.com",
  "eventId": "event_id_here",
  "clubId": "club_id_here"
}
```

---

## Payment APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/create-payment-intent` | Create Stripe payment intent |
| POST | `/payments` | Save membership payment and create membership |
| POST | `/event-payments` | Save event payment and create event registration |
| GET | `/payments/user/:email` | Get user's payment history |

### Create Payment Intent Example

```json
{
  "amount": 20
}
```

Response:

```json
{
  "clientSecret": "stripe_client_secret_here"
}
```

### Membership Payment Example

```json
{
  "userEmail": "member@example.com",
  "amount": 20,
  "clubId": "club_id_here",
  "clubName": "Programming Club",
  "stripePaymentIntentId": "pi_xyz"
}
```

### Event Payment Example

```json
{
  "userEmail": "member@example.com",
  "amount": 10,
  "eventId": "event_id_here",
  "eventTitle": "Tech Meetup 2026",
  "clubId": "club_id_here",
  "stripePaymentIntentId": "pi_xyz"
}
```

---

## Dashboard and Analytics APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile-stats/:email` | Get role based profile statistics |
| GET | `/member/dashboard-stats/:email` | Get member dashboard statistics |
| GET | `/admin/analytics` | Get admin analytics data |
| GET | `/community-leaders` | Get admins and club managers |
| GET | `/manager/approved-clubs/:email` | Get approved clubs of a manager |

---

# Role Based Access Summary

## Available Roles

```bash
member
clubManager
admin
```

---

## Member Features

A member can:

- Join free clubs
- Join paid clubs through Stripe payment
- Register for free events
- Register for paid events through Stripe payment
- View joined clubs
- View registered events
- View payment history
- View dashboard statistics

---

## Club Manager Features

A club manager can:

- Create clubs
- View own clubs
- View approved clubs
- Create events for managed clubs
- Update events
- Delete events
- View manager specific events
- View profile statistics

---

## Admin Features

An admin can:

- View all users
- Update user roles
- Approve clubs
- Reject clubs
- View total users
- View total clubs
- View total payments
- View total revenue
- View club status analytics
- View user role analytics
- View payment type analytics

---

# Important Business Logic

## Club Creation Logic

When a club is created, it is automatically saved with:

```json
{
  "status": "pending"
}
```

Only approved clubs can appear in the featured clubs section.

---

## Free Club Join Logic

Before creating a membership, the server checks if the user already joined the club.

If already joined:

```json
{
  "inserted": false,
  "message": "You already joined this club"
}
```

---

## Paid Club Join Logic

For paid clubs:

1. Client creates Stripe payment intent.
2. User completes payment.
3. Payment information is saved in the `payments` collection.
4. Membership information is saved in the `memberships` collection.

---

## Event Capacity Logic

Before event registration, the server checks:

- Event exists or not
- User already registered or not
- Event capacity is full or not

If event is full:

```json
{
  "insertedId": null,
  "message": "Event is already full",
  "full": true
}
```

For paid event:

```json
{
  "inserted": false,
  "full": true,
  "message": "Event is already full"
}
```

---

## Event Registration Logic

For free events:

- User registration is saved in `eventRegistrations`
- Status is saved as `registered`

For paid events:

- Payment is saved in `payments`
- Registration is saved in `eventRegistrations`

---

# Stripe Payment Flow

1. Client sends amount to `/create-payment-intent`
2. Server creates Stripe Payment Intent
3. Server returns `clientSecret`
4. Client confirms payment using Stripe
5. Client sends payment data to backend
6. Backend saves payment information
7. Backend creates membership or event registration

---

# CORS Configuration

Allowed origins:

```js
[
  "http://localhost:5173",
  "https://clubsphereee.netlify.app/"
]
```

---

# Deployment Notes

This backend is suitable for Vercel deployment because the Express app is exported:

```js
module.exports = app;
```

In local development, the server runs with:

```js
app.listen(port)
```

only when:

```js
process.env.NODE_ENV !== "production"
```

---

# Recommended Project Structure

```bash
server/
│
├── index.js
├── package.json
├── .env
├── .gitignore
└── README.md
```

---

# Security Notes

Before pushing the project to GitHub:

- Do not expose MongoDB username and password
- Do not expose Stripe secret key
- Store secret values in `.env`
- Add `.env` to `.gitignore`
- Use environment variables in Vercel
- Never commit `node_modules`

Recommended `.gitignore`:

```gitignore
node_modules
.env
.vercel
```

---

# Example Error Response

```json
{
  "error": "Failed to fetch data"
}
```

---

# Author

Developed by AHM_NOOR & ABU-SALEH-AL-AMIN.

---

# License

This project is created for educational and learning purposes.
