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
ChatApp/
├── chat-client/        # React front-end (Vite)
├── middleware/         # JWT auth middleware
├── models/             # User and Message schemas
├── routes/             # auth, contacts, messages
├── config.js           # Allowed CORS origins
├── server.js           # Express entry point
├── socket.js           # Socket.IO module
├── .env.example
├── LICENSE
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

Edit `.env` and set your own values (see [Environment Variables](#environment-variables)). Make sure MongoDB is running, then:

```bash
npm start
```

The server runs on port 5000 by default.

### 3. Set up the front-end

In a second terminal:

```bash
cd chat-client
npm install
npm run dev
```

The front-end runs on the Vite dev server (usually http://localhost:5173) and talks to the back-end API.

## Environment Variables

| Variable     | Description                                                                         |
|--------------|-------------------------------------------------------------------------------------|
| `PORT`       | Port for the back-end server (default: 5000)                                        |
| `MONGO_URI`  | MongoDB connection string                                                           |
| `JWT_SECRET` | Long random secret used to sign JWTs                                                |
| `CLIENT_URL` | Front-end origin(s) allowed by CORS. Separate several with commas, no trailing slash |

Example: `CLIENT_URL=http://localhost:5173`

## API Overview

| Method | Endpoint                   | Description                    |
|--------|----------------------------|--------------------------------|
| GET    | `/api/health`              | Health check                   |
| POST   | `/api/auth/register`       | Create an account              |
| POST   | `/api/auth/login`          | Log in and receive a JWT       |
| GET    | `/api/contacts`            | List your contacts             |
| POST   | `/api/contacts`            | Add a contact                  |
| DELETE | `/api/contacts/:id`        | Remove a contact               |
| GET    | `/api/messages/:contactId` | Message history with a contact |

Protected routes require the header `Authorization: Bearer <token>`.

### Socket.IO events

Connect with the JWT in the handshake: `io(url, { auth: { token } })`.

- `message:send` – client sends `{ to, text }` to a contact
- `message:new` – server delivers a new message to the sender and recipient

## Roadmap

- [ ] Image and video messages
- [ ] Online/typing indicators
- [ ] Deployment guide

## License

This project is licensed under the [MIT License](LICENSE).