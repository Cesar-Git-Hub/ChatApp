# ChatApp

A real-time chat application with user accounts and contacts. Built with React, Node.js, Express, MongoDB and Socket.IO.

## Features

- User registration and login (JWT authentication)
- Add and remove contacts (works on both sides)
- Real-time text messaging between contacts (Socket.IO)
- Message history per contact
- Messages are only allowed between users who are contacts (2000-character limit)

**Planned:** image and video messages.

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Front-end | React, Vite                                 |
| Back-end  | Node.js, Express                            |
| Database  | MongoDB with Mongoose                       |
| Real-time | Socket.IO (authenticated with the same JWT) |
| Auth      | JSON Web Tokens                             |

## Project Structure

```
Chat/
├── chat-client/        # React front-end (Vite)
├── middleware/         # JWT auth middleware
├── models/             # User and Message schemas
├── routes/             # auth, contacts, messages
├── server.js           # Express entry point
├── socket.js           # Socket.IO module
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- MongoDB running locally (or a MongoDB Atlas connection string)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Cesar-Git-Hub/ChatApp.git
cd ChatApp
```

### 2. Set up the back-end

```bash
npm install
cp .env.example .env     # on Windows: copy .env.example .env
```

Edit `.env` and set your own values (see Environment Variables below), then:

```bash
npm start
```

### 3. Set up the front-end

```bash
cd chat-client
npm install
npm run dev
```

The front-end runs on the Vite dev server (usually http://localhost:5173) and the API on the port set in `.env`.

## Environment Variables

| Variable     | Description                          |
|--------------|--------------------------------------|
| `PORT`       | Port for the back-end server         |
| `MONGO_URI`  | MongoDB connection string            |
| `JWT_SECRET` | Long random secret used to sign JWTs |

## API Overview

| Method | Endpoint                | Description                      |
|--------|-------------------------|----------------------------------|
| POST   | `/api/auth/register`    | Create an account                |
| POST   | `/api/auth/login`       | Log in and receive a JWT         |
| *      | `/api/contacts`         | List, add and remove contacts    |
| GET    | `/api/messages/:contactId` | Message history with a contact |

### Socket.IO events

- `message:send` – client sends a message to a contact
- `message:new` – server delivers a new message to the recipient

## Roadmap

- [Not ready ] Image and video messages
- [Not Ready ] Online/typing indicators
- [Not ready ] Deployment guide

## License

MIT