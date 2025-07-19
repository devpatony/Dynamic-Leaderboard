# Leaderboard System

A dynamic leaderboard system built with NodeJS backend and ReactJS frontend.

## Features

- **User Management**: Add and manage users
- **Random Point Claims**: Award random points (1-10) to selected users
- **Real-time Rankings**: Dynamic leaderboard updates
- **Point History**: Track all point claim activities
- **Modern UI**: Clean and responsive interface
- **Cloud Database**: Uses MongoDB Atlas for reliable cloud storage

## Tech Stack

### Backend
- NodeJS with Express
- MongoDB Atlas (Cloud Database)
- Mongoose ODM
- CORS enabled
- RESTful API design

### Frontend
- ReactJS with Hooks
- Axios for API calls
- Modern CSS styling
- Responsive design

## Project Structure

```
leaderboard-app/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── History.js
│   ├── routes/
│   │   ├── users.js
│   │   └── history.js
│   ├── config/
│   │   └── database.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UserList.js
│   │   │   ├── Leaderboard.js
│   │   │   ├── AddUser.js
│   │   │   └── PointHistory.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── README.md
```

## Installation & Setup

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up MongoDB Atlas (Cloud Database):**
   - Follow the detailed [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)
   - Create your cluster and get your connection string
   - Update your connection string in `backend/.env`

3. **Start the application:**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5001) and frontend development server (port 3000).

## API Endpoints

### Users
- `GET /api/users` - Get all users with rankings
- `POST /api/users` - Create a new user
- `POST /api/users/:id/claim` - Claim random points for a user

### History
- `GET /api/history` - Get point claim history
- `GET /api/history/:userId` - Get history for specific user

## Usage

1. **Select a user** from the dropdown or add a new user
2. **Click "Claim Points"** to award random points (1-10)
3. **View the leaderboard** which updates automatically
4. **Check point history** to see all claim activities

## Database Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  totalPoints: Number,
  rank: Number,
  createdAt: Date
}
```

### History Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  userName: String,
  pointsAwarded: Number,
  timestamp: Date
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

