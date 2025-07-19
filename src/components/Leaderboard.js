import React, { useState, useEffect } from 'react';

/**
 * Leaderboard Component
 * Displays the dynamic rankings of all users
 */
const Leaderboard = ({ users, onRefresh }) => {
  const [sortBy, setSortBy] = useState('rank'); // rank, points, name
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort users based on selected criteria
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'points':
          aValue = a.totalPoints;
          bValue = b.totalPoints;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rank':
        default:
          aValue = a.rank;
          bValue = b.rank;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, sortBy, sortOrder, searchTerm]);

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'rank-first';
      case 2: return 'rank-second';
      case 3: return 'rank-third';
      default: return 'rank-other';
    }
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (users.length === 0) {
    return (
      <div className="leaderboard-container">
        <div className="empty-leaderboard">
          <h3>🏆 No Users Yet</h3>
          <p>Add some users and start claiming points to see the leaderboard!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      {/* Leaderboard Controls */}
      <div className="leaderboard-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button 
          className="refresh-button"
          onClick={onRefresh}
          title="Refresh leaderboard"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics Summary */}
      <div className="leaderboard-stats">
        <div className="stat-item">
          <span className="stat-label">Total Users:</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Points:</span>
          <span className="stat-value">{users.reduce((sum, user) => sum + user.totalPoints, 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Points:</span>
          <span className="stat-value">
            {users.length > 0 ? 
              Math.round(users.reduce((sum, user) => sum + user.totalPoints, 0) / users.length) : 0
            }
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th 
                className="sortable"
                onClick={() => handleSort('rank')}
                title="Sort by rank"
              >
                Rank {getSortIcon('rank')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('name')}
                title="Sort by name"
              >
                User {getSortIcon('name')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('points')}
                title="Sort by points"
              >
                Points {getSortIcon('points')}
              </th>
              <th>Progress</th>
              <th>Member Since</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => {
              const maxPoints = Math.max(...users.map(u => u.totalPoints));
              const progressPercentage = maxPoints > 0 ? (user.totalPoints / maxPoints) * 100 : 0;
              
              return (
                <tr key={user._id} className={`leaderboard-row ${getRankClass(user.rank)}`}>
                  <td className="rank-cell">
                    <div className="rank-display">
                      <span className="rank-emoji">{getRankEmoji(user.rank)}</span>
                      <span className="rank-number">#{user.rank}</span>
                    </div>
                  </td>
                  <td className="name-cell">
                    <div className="user-name-display">
                      <span className="user-name">{user.name}</span>
                      {user.rank <= 3 && (
                        <span className="top-performer">⭐</span>
                      )}
                    </div>
                  </td>
                  <td className="points-cell">
                    <div className="points-display">
                      <span className="points-number">{user.totalPoints}</span>
                      <span className="points-label">pts</span>
                    </div>
                  </td>
                  <td className="progress-cell">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                      <span className="progress-text">{Math.round(progressPercentage)}%</span>
                    </div>
                  </td>
                  <td className="date-cell">
                    {user.memberSince || new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && searchTerm && (
        <div className="no-results">
          <p>No users found matching "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')}>Clear search</button>
        </div>
      )}

      {/* Podium for Top 3 */}
      {users.length >= 3 && (
        <div className="podium-container">
          <h3>🏆 Top 3 Champions</h3>
          <div className="podium">
            {/* Second Place */}
            <div className="podium-position second">
              <div className="podium-user">
                <span className="podium-rank">🥈</span>
                <span className="podium-name">{users.find(u => u.rank === 2)?.name}</span>
                <span className="podium-points">{users.find(u => u.rank === 2)?.totalPoints} pts</span>
              </div>
              <div className="podium-base">2nd</div>
            </div>

            {/* First Place */}
            <div className="podium-position first">
              <div className="podium-user">
                <span className="podium-rank">🥇</span>
                <span className="podium-name">{users.find(u => u.rank === 1)?.name}</span>
                <span className="podium-points">{users.find(u => u.rank === 1)?.totalPoints} pts</span>
              </div>
              <div className="podium-base">1st</div>
            </div>

            {/* Third Place */}
            <div className="podium-position third">
              <div className="podium-user">
                <span className="podium-rank">🥉</span>
                <span className="podium-name">{users.find(u => u.rank === 3)?.name}</span>
                <span className="podium-points">{users.find(u => u.rank === 3)?.totalPoints} pts</span>
              </div>
              <div className="podium-base">3rd</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
