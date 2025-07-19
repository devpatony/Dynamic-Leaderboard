import React, { useState, useEffect } from 'react';
import { historyAPI, userAPI } from '../services/api';

/**
 * PointHistory Component
 * Displays the history of all point claims with filtering and pagination
 */
const PointHistory = () => {
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit] = useState(10);
  
  // Filter states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchHistory();
    fetchStats();
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [currentPage, selectedUserId, startDate, endDate, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      
      // If filtering by user
      if (selectedUserId) {
        response = await historyAPI.getUserHistory(selectedUserId, currentPage, pageLimit);
        setHistory(response.data.data.history || []);
        setTotalPages(response.data.pagination?.total || 1);
        setTotalRecords(response.data.pagination?.totalRecords || 0);
      } 
      // If searching with filters
      else if (searchTerm || startDate || endDate) {
        const searchParams = {
          page: currentPage,
          limit: pageLimit,
          ...(searchTerm && { userName: searchTerm }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        };
        
        response = await historyAPI.searchHistory(searchParams);
        setHistory(response.data.data || []);
        setTotalPages(response.data.pagination?.total || 1);
        setTotalRecords(response.data.pagination?.totalRecords || 0);
      }
      // Default: get all history
      else {
        response = await historyAPI.getHistory(currentPage, pageLimit);
        setHistory(response.data.data || []);
        setTotalPages(response.data.pagination?.total || 1);
        setTotalRecords(response.data.pagination?.totalRecords || 0);
      }
      
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to fetch history data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await historyAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await historyAPI.getRecentActivity(5);
      setRecentActivity(response.data.data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSelectedUserId('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPointsColor = (points) => {
    if (points >= 8) return 'high-points';
    if (points >= 5) return 'medium-points';
    return 'low-points';
  };

  return (
    <div className="history-container">
      {/* Stats Overview */}
      {stats?.overall && (
        <div className="stats-overview">
          <h3>📊 Statistics Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.overall.totalClaims}</span>
              <span className="stat-label">Total Claims</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.overall.totalPointsAwarded}</span>
              <span className="stat-label">Points Awarded</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{Math.round(stats.overall.averagePointsPerClaim || 0)}</span>
              <span className="stat-label">Avg Points/Claim</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.overall.maxPointsInSingleClaim}</span>
              <span className="stat-label">Max Single Claim</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="recent-activity">
          <h3>⚡ Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity._id} className="activity-item">
                <span className="activity-user">{activity.userName}</span>
                <span className="activity-action">claimed</span>
                <span className={`activity-points ${getPointsColor(activity.pointsAwarded)}`}>
                  {activity.pointsAwarded} points
                </span>
                <span className="activity-time">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="history-filters">
        <h3>🔍 Filters</h3>
        <div className="filter-grid">
          <div className="filter-group">
            <label>User:</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                handleFilterChange();
              }}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search Name:</label>
            <input
              type="text"
              placeholder="Search by user name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
            />
          </div>

          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
            />
          </div>

          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
            />
          </div>

          <div className="filter-actions">
            <button className="clear-filters-button" onClick={clearFilters}>
              🗑️ Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="history-table-section">
        <div className="history-header">
          <h3>📈 Point Claim History</h3>
          <div className="history-info">
            <span>Showing {history.length} of {totalRecords} records</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading history...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>❌ {error}</p>
            <button onClick={fetchHistory}>🔄 Retry</button>
          </div>
        ) : history.length === 0 ? (
          <div className="no-history">
            <p>📝 No history records found</p>
            {(selectedUserId || searchTerm || startDate || endDate) && (
              <button onClick={clearFilters}>Clear filters to see all records</button>
            )}
          </div>
        ) : (
          <>
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Points Awarded</th>
                    <th>Previous Total</th>
                    <th>New Total</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record._id} className="history-row">
                      <td className="user-cell">
                        <div className="user-info">
                          <span className="user-name">{record.userName}</span>
                          {record.userId?.name && record.userName !== record.userId.name && (
                            <span className="user-current">({record.userId.name})</span>
                          )}
                        </div>
                      </td>
                      <td className="points-cell">
                        <span className={`points-awarded ${getPointsColor(record.pointsAwarded)}`}>
                          +{record.pointsAwarded}
                        </span>
                      </td>
                      <td className="total-cell">
                        {record.previousTotal}
                      </td>
                      <td className="total-cell">
                        <strong>{record.newTotal}</strong>
                      </td>
                      <td className="timestamp-cell">
                        {formatTimestamp(record.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  « Previous
                </button>

                <div className="pagination-info">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next »
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PointHistory;
