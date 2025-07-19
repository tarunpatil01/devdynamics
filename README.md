# Split App

A modern expense splitting application built with React, Node.js, and MongoDB. Track group expenses, calculate balances, and manage settlements easily.

## Features

- 🔐 User authentication with JWT
- 💰 Expense tracking and splitting
- 👥 Group management
- 💬 Real-time messaging in groups
- 📊 Balance calculations
- 💸 Settlement suggestions
- 📱 Responsive design
- ⚡ Real-time updates with Socket.io

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time features
- bcryptjs for password hashing

### Frontend
- React 19 with Vite
- Tailwind CSS for styling
- Redux Toolkit for state management
- Socket.io client for real-time features

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devdynamics
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/splitapp
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

5. **Start the development servers**

   In the root directory (server):
   ```bash
   npm run dev
   ```

   In another terminal, in the client directory:
   ```bash
   cd client
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `DELETE /auth/unregister` - Delete user account

### Expenses
- `GET /expenses` - Get all expenses
- `POST /expenses` - Create new expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

### Groups
- `GET /groups` - Get all groups
- `POST /groups` - Create new group
- `GET /groups/:id/messages` - Get group messages
- `POST /groups/:id/messages` - Send message to group
- `POST /groups/:id/add-person` - Add person to group

### Balances & Settlements
- `GET /balances` - Get user balances
- `GET /settlements` - Get settlement suggestions
- `GET /people` - Get all people

## Project Structure

```
devdynamics/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # Redux store
│   │   └── ...
├── models/                # MongoDB models
├── routes/                # Express routes
├── index.js              # Server entry point
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 

## Code Formatting

This project uses [Prettier](https://prettier.io/) for code formatting. To format all code, run:

```bash
npm run format
```

## Monitoring & Alerts

- Monitor your Render logs for any runtime errors.
- Set up alerts for backend crashes or high error rates in your hosting provider. 