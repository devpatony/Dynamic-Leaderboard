import React from 'react';

/**
 * UserList Component
 * Displays a dropdown list of users for selection
 */
const UserList = ({ users, selectedUserId, onUserSelect }) => {
  return (
    <div className="user-list-container">
      <label htmlFor="user-select" className="user-select-label">
        Select a User:
      </label>
      <select
        id="user-select"
        className="user-select"
        value={selectedUserId}
        onChange={(e) => onUserSelect(e.target.value)}
      >
        <option value="">-- Choose a user --</option>
        {users.map((user) => (
          <option key={user._id} value={user._id}>
            {user.name} ({user.totalPoints} points - Rank #{user.rank})
          </option>
        ))}
      </select>
      
      {users.length === 0 && (
        <p className="no-users-message">
          No users available. Add some users first!
        </p>
      )}
    </div>
  );
};

export default UserList;
