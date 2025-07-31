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

4. **Set up environment variables** {NOT REAL LINKS & SECRET}
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
   - Frontend: https://devdynamics-split-app.vercel.app
   - Backend API: https://devdynamics-yw9g.onrender.com

## API Documentation

### Authentication
- `POST /auth/register` - Register a new user. Body: `{ username, password }`
- `POST /auth/login` - Login user. Body: `{ username, password }`. Returns JWT token.
- `DELETE /auth/unregister` - Delete user account. Requires Authorization header.

### Expenses
- `GET /expenses` - Get all expenses for the authenticated user. Optional query: `group` (group id), `recurringOnly` (boolean).
- `POST /expenses` - Create new expense. Body: `{ amount, description, paid_by, split_type, split_details, split_with, group, category, recurring }`
- `PUT /expenses/:id` - Update expense. Body: same as POST.
- `DELETE /expenses/:id` - Delete expense by id.

### Groups
- `GET /groups` - Get all groups where the user is a member or owner.
- `POST /groups` - Create new group. Body: `{ name, members }`
- `POST /groups/:id/join` - Join a group by id.
- `POST /groups/:id/leave` - Leave a group by id.
- `POST /groups/:id/add-person` - Add a person (by name) to a group.
- `GET /groups/:id/messages` - Get group chat messages.
- `POST /groups/:id/messages` - Send a message to group chat. Body: `{ text }`

### Balances & Settlements
- `GET /balances` - Get current balances for the user (per group or overall).
- `GET /settlements` - Get suggested settlements to minimize transactions.
- `POST /settlements/settle` - Record a settlement between two users. Body: `{ user, counterparty, direction }` where direction is 'pay' or 'receive'.
- `GET /people` - Get all people in the user's groups.

### Real-time Events (Socket.io)
- `groupCreated` - Emitted when a group is created.
- `groupUpdated` - Emitted when group membership changes.
- `expenseCreated` - Emitted when an expense is added.
- `expenseUpdated` - Emitted when an expense is updated.
- `expenseDeleted` - Emitted when an expense is deleted.

---

## Settlement Calculation Logic

- **Balances:**
  - For each expense, the payer's balance increases by the amount paid.
  - Each participant's balance decreases by their share (based on split type: equal, percentage, exact).
  - Balances are summed across all expenses for each user.
- **Settlement Suggestions:**
  - Users with positive balances are creditors; negative balances are debtors.
  - The algorithm matches debtors to creditors, minimizing the number of transactions.
  - Each settlement is a suggested payment from a debtor to a creditor for the minimum amount owed.
- **Settle Up:**
  - When a user settles up, a new expense is created to record the payment, and balances are recalculated.

---

## Known Limitations & Assumptions

- Group members can be stored as either usernames or ObjectIds; mixed types are supported for demo purposes.
- Usernames are assumed to be unique and case-insensitive for balance/settlement calculations.
- Real-time updates require all clients to be connected to the same backend instance.
- No email verification or password reset by email (reset is token-based only).
- No pagination for expenses/groups in the UI (API supports pagination for expenses).
- Analytics and recurring expenses are basic and may not cover all edge cases.
- Only basic validation is performed on input fields; further hardening is recommended for production.
- The app is designed for demo/educational use and may require enhancements for production scale.

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

## Local Development & Code Quality

### Clean, Commented Code
- All backend and frontend code is written to be readable and maintainable.
- Functions, routes, and components include comments explaining their purpose and logic.
- Follow best practices for naming, structure, and error handling.
- Use Prettier for consistent code formatting (`npm run format`).

### Database Schema & Setup Scripts
- MongoDB is used for data storage. Mongoose models define the schema for each collection:
  - `models/User.js` — User accounts (username, password hash, etc.)
  - `models/Group.js` — Groups with name, owner, and members
  - `models/Expense.js` — Expenses with amount, description, split details, group, etc.
  - `models/People.js` — People in groups
  - `models/GroupMessage.js` — Group chat messages
  - `models/SplitType.js` — Enum for split types
- No manual SQL scripts are needed; collections are created automatically by Mongoose when the app runs.
- To seed the database with test data, you can use the Postman collection provided (`split-app-api.postman_collection.json`).
- For a fresh start, drop the database in MongoDB and restart the server. 

## Screenshots
<img width="2855" height="1579" alt="image" src="https://github.com/user-attachments/assets/0fafcf48-dea1-4901-ac25-077f2faac1e0" />
<img width="2879" height="1582" alt="image" src="https://github.com/user-attachments/assets/f8672420-8e4d-4570-bdad-0a66595e9770" />
<img width="2837" height="1587" alt="image" src="https://github.com/user-attachments/assets/2caf03e2-3eff-4d99-930c-5ddcc382f956" />
<img width="2867" height="1583" alt="image" src="https://github.com/user-attachments/assets/8c2ec322-ef9a-4255-9ed8-c647ff15ded4" />
<img width="2873" height="1592" alt="image" src="https://github.com/user-attachments/assets/c6caa36a-1d81-469d-938f-77c209398ffa" />




