# QueueBook - Smart Queue Management & Appointment Platform

[![Version](https://img.shields.io/badge/Version-1.0-green)](https://github.com/adhithyan2/queuebook)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%2B%20Express%205-brightgreen)](https://github.com/adhithyan2/queuebook)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-blue)](https://github.com/adhithyan2/queuebook)
[![Real-time](https://img.shields.io/badge/Real--time-Socket.IO-orange)](https://github.com/adhithyan2/queuebook)
[![License](https://img.shields.io/badge/License-MIT-yellow)](https://github.com/adhithyan2/queuebook)

## Overview

**QueueBook** is a full-stack real-time queue management and appointment booking platform. Customers can discover nearby businesses, book appointments, join virtual queues, and track their position live. Business owners can manage queues, call next customers, view analytics, and collect reviews. Admins get a platform-wide overview dashboard.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [License](#license)

## Features

### 1. Authentication System
- Email & password based registration/login
- Role-based access: Customer, Business Owner, Admin
- JWT token authentication with secure sessions
- bcrypt password hashing (12 salt rounds)

### 2. Real-Time Queue Management
- Live queue position tracking via Socket.IO
- Auto token assignment with configurable prefix
- Call next, skip, and complete queue entries
- Walk-in customer support
- Estimated wait time calculation

### 3. Appointment Booking
- Browse business services with durations & prices
- Pick available time slots by date
- Cancel appointments
- Appointment status tracking (pending, confirmed, completed, cancelled)

### 4. Customer Dashboard
- Upcoming appointment summary
- Live queue status with position
- Nearby businesses with geolocation search
- Recent appointments & notifications

### 5. Business Dashboard
- Real-time queue table with actions (call next / skip / complete)
- Queue analytics with 7-day volume charts
- Business profile management (services, hours, queue settings)
- Customer reviews with ratings

### 6. Nearby Business Discovery
- Geolocation-based business search
- Distance & rating display
- Category filtering (hospital, clinic, salon, restaurant, office, laboratory)
- Book appointments directly from search results

### 7. Notifications
- Real-time queue & appointment notifications
- Mark individual or all as read
- Socket.IO instant push

### 8. Admin Panel
- User & business management
- Platform analytics & reports
- Revenue tracking

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI Library |
| React Router DOM 7 | Client-side routing |
| Vite 8 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first styling |
| Framer Motion | Animations |
| Axios | HTTP client |
| Socket.IO Client | Real-time WebSocket |
| React Icons | Icon library |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | Web framework |
| MongoDB Atlas | Database |
| Mongoose 9 | ODM |
| Socket.IO 4 | Real-time communication |
| JWT | Authentication |
| bcryptjs | Password hashing |

## Project Structure

```
queuebook/
├── client/
│   ├── public/                    # Static assets (logos, icons)
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/         # Dashboard widgets
│   │   │   ├── landing/           # Landing page sections
│   │   │   ├── layout/            # Sidebar, Navbar
│   │   │   └── ui/                # Reusable UI (Button, Card, Input, Badge, Avatar)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state & JWT persistence
│   │   │   └── SocketContext.jsx  # Socket.IO connection
│   │   ├── layouts/               # Auth, Customer, Business, Dashboard layouts
│   │   ├── pages/
│   │   │   ├── Customer/          # Dashboard, Appointments, Queue, Nearby, Book, Notifications, Profile
│   │   │   ├── Business/          # Dashboard, Queue, Analytics, Reviews, Profile
│   │   │   ├── Admin/             # Admin dashboard
│   │   │   ├── Landing/           # Landing page
│   │   │   ├── Login/             # Login page
│   │   │   ├── Register/          # Registration page
│   │   │   └── NotFound/          # 404 page
│   │   ├── routes/AppRoutes.jsx   # Route definitions with role protection
│   │   ├── services/api.js        # Axios API client
│   │   └── utils/                 # Constants & helpers
│   ├── vite.config.js             # Vite config with proxy
│   └── package.json
│
├── server/
│   ├── config/db.js               # MongoDB connection
│   ├── controllers/               # 7 controller files
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── businessController.js
│   │   ├── customerController.js
│   │   ├── queueController.js
│   │   ├── notificationController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + role authorize
│   │   └── errorHandler.js        # Global error handler
│   ├── models/                    # 6 Mongoose models
│   │   ├── User.js
│   │   ├── Business.js
│   │   ├── Appointment.js
│   │   ├── Queue.js
│   │   ├── Notification.js
│   │   └── Review.js
│   ├── routes/                    # 7 route files
│   ├── socket/queueHandler.js     # Socket.IO real-time queue events
│   ├── utils/helpers.js           # Token generation & wait time
│   ├── server.js                  # Entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Get current user profile |

### Appointments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/appointments` | Create an appointment |
| GET | `/api/appointments` | Get all user appointments |
| GET | `/api/appointments/:id` | Get appointment by ID |
| PUT | `/api/appointments/:id/cancel` | Cancel an appointment |

### Queue

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/queue` | Join a queue |
| GET | `/api/queue/my` | Get my active queue entries |
| GET | `/api/queue/:id/status` | Get real-time queue status |
| PUT | `/api/queue/:id/leave` | Leave a queue |

### Customer

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customer/dashboard` | Customer dashboard data |
| GET | `/api/customer/nearby` | Nearby businesses (lat/lng) |
| GET | `/api/customer/reviews/:businessId` | Business reviews |

### Business

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/business/dashboard` | Business dashboard |
| GET | `/api/business/profile` | Get business profile |
| POST | `/api/business/profile` | Create business profile |
| PUT | `/api/business/profile` | Update business profile |
| GET | `/api/business/analytics` | Queue analytics (7-day) |
| POST | `/api/business/queue/call-next` | Call next customer |
| PUT | `/api/business/queue/:id/skip` | Skip a customer |
| PUT | `/api/business/queue/:id/complete` | Mark completed |
| POST | `/api/business/queue/walkin` | Add walk-in customer |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get all notifications |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/businesses` | Get all businesses |
| GET | `/api/admin/reports` | Platform reports |
| GET | `/api/admin/analytics` | Platform analytics |

## Database Schema

### User

| Field | Type | Description |
|---|---|---|
| name | String | Required |
| email | String | Required, unique |
| password | String | Required, bcrypt hashed |
| role | String | customer / business / admin |
| phone | String | Optional |
| location | String | Optional |
| avatar | String | Optional |
| isActive | Boolean | Default: true |

### Business

| Field | Type | Description |
|---|---|---|
| owner | ObjectId | Ref: User |
| name | String | Required |
| category | String | hospital, clinic, salon, restaurant, office, laboratory |
| services | Array | `{ name, duration, price }` |
| location | GeoJSON Point | 2dsphere indexed |
| timeSlots | Object | `{ open, close, interval }` |
| queueSettings | Object | `{ tokenPrefix, maxDailyTokens, autoAssignToken }` |
| rating | Number | Average rating |

### Appointment

| Field | Type | Description |
|---|---|---|
| user | ObjectId | Ref: User |
| business | ObjectId | Ref: Business |
| service | String | Service name |
| date | Date | Appointment date |
| timeSlot | String | Selected time slot |
| tokenNumber | Number | Auto-assigned |
| status | String | pending, confirmed, completed, cancelled |

### Queue

| Field | Type | Description |
|---|---|---|
| business | ObjectId | Ref: Business |
| user | ObjectId | Ref: User (optional for walk-ins) |
| tokenNumber | Number | Required |
| status | String | waiting, called, completed, skipped, cancelled |
| position | Number | Queue position |
| estimatedWaitTime | Number | In minutes |

### Notification

| Field | Type | Description |
|---|---|---|
| user | ObjectId | Ref: User |
| title | String | Required |
| message | String | Required |
| type | String | queue, appointment, system |
| read | Boolean | Default: false |

### Review

| Field | Type | Description |
|---|---|---|
| user | ObjectId | Ref: User |
| business | ObjectId | Ref: Business |
| rating | Number | 1-5 |
| comment | String | Optional |

## Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Local Development

```bash
# Clone repository
git clone https://github.com/adhithyan2/queuebook.git
cd queuebook

# Install server dependencies
cd server
npm install

# Create .env file (see Environment Variables below)
cp .env.example .env

# Start backend
npm run dev
# Server runs on http://localhost:5000

# In another terminal, install client dependencies
cd ../client
npm install

# Start frontend
npm run dev
# Client runs on http://localhost:3000
```

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/queuebook
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

## Live Demo

🔗 **https://queuebook.onrender.com**

## License

MIT License - feel free to use this project for educational and commercial purposes.

---

Made with ❤️ by [adhithyan2](https://github.com/adhithyan2)
