import React, { useState, useEffect } from 'react';
import './App.css';
import UserList from './components/UserList';
import Leaderboard from './components/Leaderboard';
import AddUser from './components/AddUser';
import PointHistory from './components/PointHistory';
import { userAPI, healthAPI } from './services/api';

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [claimingPoints, setClaimingPoints] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [serverStatus, setServerStatus] = useState('checking');

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const checkServerHealth = async () => {
    try {
      await healthAPI.check();
      setServerStatus('online');
    } catch (error) {
      setServerStatus('offline');
      setError('Unable to connect to server. Please make sure the backend is running.');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(response.data.data || []);
      
      // Set first user as selected if none selected
      if (response.data.data.length > 0 && !selectedUserId) {
        setSelectedUserId(response.data.data[0]._id);
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  const handleClaimPoints = async (e) => {
    // Prevent any form submission if this is inside a form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedUserId) {
      setError('Please select a user first');
      return;
    }

    if (claimingPoints) {
      return; // Prevent multiple clicks while claiming
    }

    setClaimingPoints(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await userAPI.claimPoints(selectedUserId);
      const { pointsAwarded, user } = response.data.data;
      
      setSuccessMessage(`🎉 ${pointsAwarded} points awarded to ${user.name}!`);
      
      // Refresh users to show updated rankings without showing main loading state
      const usersResponse = await userAPI.getAllUsers();
      setUsers(usersResponse.data.data || []);
      
    } catch (error) {
      console.error('Error claiming points:', error);
      setError(error.response?.data?.message || 'Failed to claim points');
    } finally {
      setClaimingPoints(false);
    }
  };

  const handleUserAdded = async (newUser) => {
    setSuccessMessage(`✅ User "${newUser.name}" added successfully!`);
    await fetchUsers();
  };

  const handleResetAllPoints = async () => {
    if (window.confirm('Are you sure you want to reset all user points? This action cannot be undone.')) {
      try {
        await userAPI.resetAllPoints();
        setSuccessMessage('🔄 All user points have been reset!');
        await fetchUsers();
      } catch (error) {
        console.error('Error resetting points:', error);
        setError('Failed to reset points');
      }
    }
  };

  const getSelectedUser = () => {
    return users.find(user => user._id === selectedUserId);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🏆 Dynamic Leaderboard</h1>
          <div className="server-status">
            <span className={`status-indicator ${serverStatus}`}></span>
            <span>Server: {serverStatus}</span>
          </div>
        </div>
      </header>

      {/* Error/Success Messages */}
      {error && (
        <div className="message error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {successMessage && (
        <div className="message success-message">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Leaderboard
        </button>
        <button
          className={`tab-button ${activeTab === 'claim' ? 'active' : ''}`}
          onClick={() => setActiveTab('claim')}
        >
          🎯 Claim Points
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Manage Users
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📈 History
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'leaderboard' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>🏆 Current Rankings</h2>
              <button 
                className="reset-button"
                onClick={handleResetAllPoints}
                title="Reset all user points"
              >
                🔄 Reset All Points
              </button>
            </div>
            <Leaderboard users={users} onRefresh={fetchUsers} />
          </div>
        )}

        {activeTab === 'claim' && (
          <div className="tab-content">
            <div className="claim-section">
              <h2>🎯 Claim Random Points</h2>
              <div className="claim-container">
                <div className="user-selection">
                  <UserList
                    users={users}
                    selectedUserId={selectedUserId}
                    onUserSelect={handleUserSelect}
                  />
                  {getSelectedUser() && (
                    <div className="selected-user-info">
                      <h3>Selected User:</h3>
                      <div className="user-card">
                        <span className="user-name">{getSelectedUser().name}</span>
                        <span className="user-points">{getSelectedUser().totalPoints} points</span>
                        <span className="user-rank">Rank #{getSelectedUser().rank}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="claim-action">
                  <button
                    type="button"
                    className="claim-button"
                    onClick={handleClaimPoints}
                    disabled={!selectedUserId || claimingPoints}
                  >
                    {claimingPoints ? (
                      <>
                        ⏳ Processing...
                      </>
                    ) : (
                      <>
                        🎲 Claim Random Points (1-10)
                      </>
                    )}
                  </button>
                  <p className="claim-note">
                    Click to award random points between 1 and 10 to the selected user
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <h2>👥 User Management</h2>
            <AddUser onUserAdded={handleUserAdded} />
            <div className="user-list-section">
              <h3>Current Users ({users.length})</h3>
              <div className="users-grid">
                {users.map((user) => (
                  <div key={user._id} className="user-item">
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-stats">
                        {user.totalPoints} points • Rank #{user.rank}
                      </span>
                    </div>
                    <div className="user-actions">
                      <button
                        className="select-button"
                        onClick={() => {
                          setSelectedUserId(user._id);
                          setActiveTab('claim');
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <h2>📈 Point Claim History</h2>
            <PointHistory />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built with ❤️ using React & Node.js | 
          Total Users: {users.length} | 
          Total Points: {users.reduce((sum, user) => sum + user.totalPoints, 0)}
        </p>
      </footer>
    </div>
  );
}

export default App;
