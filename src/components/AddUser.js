import React, { useState } from 'react';
import { userAPI } from '../services/api';

/**
 * AddUser Component
 * Allows adding new users to the system
 */
const AddUser = ({ onUserAdded }) => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      setError('Please enter a valid user name');
      return;
    }

    if (userName.trim().length < 2) {
      setError('User name must be at least 2 characters long');
      return;
    }

    if (userName.trim().length > 50) {
      setError('User name cannot exceed 50 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await userAPI.createUser({ name: userName.trim() });
      
      // Clear form
      setUserName('');
      
      // Notify parent component
      if (onUserAdded) {
        onUserAdded(response.data.data);
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to create user'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setUserName(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  const suggestedNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'
  ];

  const handleSuggestedName = (name) => {
    setUserName(name);
    setError('');
  };

  return (
    <div className="add-user-container">
      <div className="add-user-header">
        <h3>➕ Add New User</h3>
        <p>Add a new participant to the leaderboard</p>
      </div>

      <form onSubmit={handleSubmit} className="add-user-form">
        <div className="form-group">
          <label htmlFor="userName" className="form-label">
            User Name:
          </label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={handleInputChange}
            placeholder="Enter user name..."
            className={`form-input ${error ? 'error' : ''}`}
            disabled={loading}
            maxLength={50}
            autoComplete="off"
          />
          <div className="input-info">
            <span className="char-count">{userName.length}/50</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>❌ {error}</span>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="add-user-button"
            disabled={loading || !userName.trim()}
          >
            {loading ? (
              <>
                <span className="loading-spinner small"></span>
                Adding...
              </>
            ) : (
              <>
                ➕ Add User
              </>
            )}
          </button>
          
          {userName && (
            <button
              type="button"
              className="clear-button"
              onClick={() => {
                setUserName('');
                setError('');
              }}
              disabled={loading}
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </form>

      {/* Suggested Names */}
      <div className="suggested-names">
        <h4>💡 Suggested Names:</h4>
        <div className="name-suggestions">
          {suggestedNames.map((name) => (
            <button
              key={name}
              type="button"
              className="suggestion-button"
              onClick={() => handleSuggestedName(name)}
              disabled={loading}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="add-user-tips">
        <h4>📝 Tips:</h4>
        <ul>
          <li>Names must be between 2-50 characters</li>
          <li>Each user name must be unique</li>
          <li>Use real names or fun nicknames</li>
          <li>New users start with 0 points</li>
        </ul>
      </div>
    </div>
  );
};

export default AddUser;
