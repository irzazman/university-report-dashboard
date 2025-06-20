import React, { useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy, where, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { colors, typography, spacing } from '../styles/GlobalStyles';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('today');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [assigningReport, setAssigningReport] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [availableStaff, setAvailableStaff] = useState([]);
  const [reassigningReport, setReassigningReport] = useState(null);
  const navigate = useNavigate();

  // Fetch staff
  useEffect(() => {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const staffQuery = query(usersRef, where('role', '==', 'staff'));
    
    const unsubscribe = onSnapshot(staffQuery, (snapshot) => {
      const staffArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAvailableStaff(staffArray);
    });

    return () => unsubscribe();
  }, []);

  // Fetch reports
  useEffect(() => {
    const db = getFirestore();
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
    });
    
    return () => unsubscribe();
  }, []);

  // Assign report to staff member
  const handleAssignReport = async (reportId, staffId) => {
    try {
      const db = getFirestore();
      const reportRef = doc(db, 'reports', reportId);
      const staff = availableStaff.find(s => s.id === staffId);
      
      await updateDoc(reportRef, {
        assignedTo: staff.email,
        assignedStaffName: staff.displayName || staff.name || staff.email,
        assignedStaffDepartment: staff.department || 'N/A',
        status: 'In Progress',
        assignedAt: new Date()
      });
      
      setAssigningReport(null);
      setSelectedStaff('');
    } catch (error) {
      console.error("Error assigning report:", error);
    }
  };

  // Add reassignment function back
  const handleReassignReport = async (reportId, staffId) => {
    try {
      const db = getFirestore();
      const reportRef = doc(db, 'reports', reportId);
      const staff = availableStaff.find(s => s.id === staffId);
      
      await updateDoc(reportRef, {
        assignedTo: staff.email,
        assignedStaffName: staff.displayName || staff.name || staff.email,
        assignedStaffDepartment: staff.department || 'N/A',
        status: 'In Progress',
        assignedAt: new Date(),
        // Clear any previous resolution data when reassigning
        resolutionImage: null,
        resolutionNote: null,
        resolutionTimestamp: null,
        pendingReview: false
      });
      
      setReassigningReport(null);
      setSelectedStaff('');
    } catch (error) {
      console.error("Error reassigning report:", error);
    }
  };

  // Helper to check if a report is within the selected filter range
  const isInRange = (timestamp, rangeType) => {
    if (!timestamp?.toDate) return false;
    const date = timestamp.toDate();
    const now = new Date();
    
    if (rangeType === 'today') {
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    
    if (rangeType === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      );
    }
    
    if (rangeType === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo && date <= now;
    }
    
    if (rangeType === 'lastWeek') {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(now.getDate() - 14);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    }
    
    if (rangeType === 'month') {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    
    if (rangeType === 'lastMonth') {
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);
      return (
        date.getMonth() === lastMonth.getMonth() &&
        date.getFullYear() === lastMonth.getFullYear()
      );
    }
    
    return true;
  };

  // Filter reports based on selected range, category, and type
  const filteredReports = reports.filter(r =>
    isInRange(r.timestamp, filter === 'all' ? 'all' : filter) &&
    (categoryFilter === 'all' || r.category === categoryFilter) &&
    (typeFilter === 'all' || r.type === typeFilter)
  );

  // Calculate reports for different time periods
  const total = filteredReports?.length || 0;
  const ongoing = filteredReports?.filter(r => r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'in progress').length || 0;
  const resolved = filteredReports?.filter(r => r.status?.toLowerCase() === 'resolved').length || 0;
  
  // Calculate reports from yesterday, last week, and last month for percentage changes
  const reportsYesterday = reports.filter(r => isInRange(r.timestamp, 'yesterday')).length;
  const reportsLastWeek = reports.filter(r => isInRange(r.timestamp, 'lastWeek')).length;
  const reportsLastMonth = reports.filter(r => isInRange(r.timestamp, 'lastMonth')).length;
  
  // Calculate percentage changes
  const calculatePercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };
  
  // Get percentage change based on selected time filter
  const getPercentChange = () => {
    let currentCount, previousCount;
    
    if (filter === 'today') {
      currentCount = reports.filter(r => isInRange(r.timestamp, 'today')).length;
      previousCount = reportsYesterday;
      return calculatePercentChange(currentCount, previousCount);
    }
    
    if (filter === 'week') {
      currentCount = reports.filter(r => isInRange(r.timestamp, 'week')).length;
      previousCount = reportsLastWeek;
      return calculatePercentChange(currentCount, previousCount);
    }
    
    if (filter === 'month') {
      currentCount = reports.filter(r => isInRange(r.timestamp, 'month')).length;
      previousCount = reportsLastMonth;
      return calculatePercentChange(currentCount, previousCount);
    }
    
    return 0;
  };
  
  const percentChange = getPercentChange();
  const isPositiveChange = percentChange >= 0;
  
  // Get unique types from reports for the Type dropdown
  const uniqueTypes = Array.from(new Set(reports.map(r => r.type))).filter(Boolean);

  // Sorting logic
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to filtered reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
    if (!a[sortConfig.key]) return 1;
    if (!b[sortConfig.key]) return -1;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Handle timestamp objects
    if (sortConfig.key === 'timestamp') {
      if (aValue?.toDate) aValue = aValue.toDate();
      if (bValue?.toDate) bValue = bValue.toDate();
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Helper to render sort arrow
  const renderSortArrow = (column) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <>
      <PageHeader 
        title="Dashboard"
        subtitle="Overview of all university maintenance reports"
      />
      
      <section style={{ marginBottom: spacing.xl }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
          flexWrap: 'wrap',
          gap: spacing.md
        }}>
          <h2 style={{ 
            fontSize: typography.fontSizes.xl, 
            fontWeight: typography.fontWeights.semibold, 
            color: colors.darkText, 
            margin: 0 
          }}>
            Reports
          </h2>
          
          <div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ 
                padding: '10px 16px', 
                borderRadius: 8, 
                border: `1px solid ${colors.lightBorder}`,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                fontSize: typography.fontSizes.sm
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: spacing.lg, 
          marginBottom: spacing.xl
        }}>
          {/* Total Card */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              padding: spacing.lg, 
              background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
              color: '#fff'
            }}>
              <div style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, opacity: 0.9 }}>Total</div>
              <div style={{ 
                fontSize: typography.fontSizes.xxxl, 
                fontWeight: typography.fontWeights.bold, 
                marginTop: spacing.xs,
                display: 'flex',
                alignItems: 'center'
              }}>
                {total}
              </div>
              <div style={{ 
                fontSize: typography.fontSizes.sm, 
                display: 'flex',
                alignItems: 'center',
                marginTop: spacing.sm
              }}>
                <span style={{ 
                  color: isPositiveChange ? '#4ade80' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: typography.fontWeights.medium,
                  marginRight: spacing.xs
                }}>
                  {isPositiveChange ? '↑' : '↓'} {Math.abs(percentChange)}%
                </span>
                <span style={{ opacity: 0.8 }}>
                  from {filter === 'today' ? 'yesterday' : filter === 'week' ? 'last week' : 'last month'}
                </span>
              </div>
            </div>
          </Card>
          
          {/* Ongoing Card */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              padding: spacing.lg, 
              background: `linear-gradient(45deg, ${colors.warning}, ${colors.accent})`,
              color: '#fff'
            }}>
              <div style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, opacity: 0.9 }}>Ongoing</div>
              <div style={{ 
                fontSize: typography.fontSizes.xxxl, 
                fontWeight: typography.fontWeights.bold, 
                marginTop: spacing.xs,
                display: 'flex',
                alignItems: 'center'
              }}>
                {ongoing}
              </div>
              <div style={{ 
                fontSize: typography.fontSizes.sm, 
                opacity: 0.8,
                marginTop: spacing.sm
              }}>
                {ongoing > 0 ? `${((ongoing / total) * 100).toFixed(1)}% of total` : 'No pending reports'}
              </div>
            </div>
          </Card>
          
          {/* Resolved Card */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              padding: spacing.lg, 
              background: `linear-gradient(45deg, ${colors.info}, ${colors.success})`,
              color: '#fff'
            }}>
              <div style={{ fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium, opacity: 0.9 }}>Resolved</div>
              <div style={{ 
                fontSize: typography.fontSizes.xxxl, 
                fontWeight: typography.fontWeights.bold, 
                marginTop: spacing.xs,
                display: 'flex',
                alignItems: 'center'
              }}>
                {resolved}
              </div>
              <div style={{ 
                fontSize: typography.fontSizes.sm, 
                opacity: 0.8,
                marginTop: spacing.sm
              }}>
                {resolved > 0 ? `${((resolved / total) * 100).toFixed(1)}% of total` : 'No resolved reports'}
              </div>
            </div>
          </Card>
        </div>
      </section>
      
      <section>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: spacing.md,
          flexWrap: 'wrap',
          gap: spacing.md
        }}>
          <h2 style={{ 
            fontSize: typography.fontSizes.xl, 
            fontWeight: typography.fontWeights.semibold, 
            color: colors.darkText, 
            margin: 0 
          }}>
            Recent Reports
          </h2>
          
          <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ 
                padding: '10px 16px', 
                borderRadius: 8, 
                border: `1px solid ${colors.lightBorder}`,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                fontSize: typography.fontSizes.sm,
                minWidth: 140
              }}
            >
              <option value="all">All Categories</option>
              <option value="Dorm">Dorm</option>
              <option value="Faculty">Faculty</option>
              <option value="Campus">Campus</option>
            </select>
            
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ 
                padding: '10px 16px', 
                borderRadius: 8, 
                border: `1px solid ${colors.lightBorder}`,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                fontSize: typography.fontSizes.sm,
                minWidth: 140
              }}
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: typography.fontSizes.sm 
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.lightBorder}` }}>
                  <th style={{ 
                    cursor: 'pointer', 
                    padding: '16px 8px',
                    textAlign: 'left',
                    fontWeight: typography.fontWeights.semibold
                  }} onClick={() => handleSort('id')}>
                    Report ID{renderSortArrow('id')}
                  </th>
                  <th style={{ 
                    cursor: 'pointer', 
                    padding: '16px 8px',
                    textAlign: 'left',
                    fontWeight: typography.fontWeights.semibold
                  }} onClick={() => handleSort('category')}>
                    Category{renderSortArrow('category')}
                  </th>
                  <th style={{ 
                    cursor: 'pointer', 
                    padding: '16px 8px',
                    textAlign: 'left',
                    fontWeight: typography.fontWeights.semibold
                  }} onClick={() => handleSort('type')}>
                    Type{renderSortArrow('type')}
                  </th>
                  <th style={{ 
                    cursor: 'pointer', 
                    padding: '16px 8px',
                    textAlign: 'left',
                    fontWeight: typography.fontWeights.semibold
                  }} onClick={() => handleSort('status')}>
                    Status{renderSortArrow('status')}
                  </th>
                  <th style={{ 
                    cursor: 'pointer', 
                    padding: '16px 8px',
                    textAlign: 'left',
                    fontWeight: typography.fontWeights.semibold
                  }} onClick={() => handleSort('assignedStaffName')}>
                    Assigned To{renderSortArrow('assignedStaffName')}
                  </th>
                  <th style={{ 
                    cursor: 'pointer', 
                    padding: '16px 8px',
                    textAlign: 'center',
                    fontWeight: typography.fontWeights.semibold
                  }} onClick={() => handleSort('timestamp')}>
                    Date/Time{renderSortArrow('timestamp')}
                  </th>
                  <th style={{ 
                    padding: '16px 8px',
                    textAlign: 'center',
                    fontWeight: typography.fontWeights.semibold
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedReports?.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ 
                      textAlign: 'center', 
                      padding: '20px 0',
                      color: '#6c757d'
                    }}>
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  sortedReports?.slice(0, 5).map(report => (
                    <tr 
                      key={report.id} 
                      style={{ 
                        borderBottom: `1px solid ${colors.lightBorder}`,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(67, 97, 238, 0.03)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 8px', textAlign: 'left' }}>
                        <b
                          style={{ 
                            cursor: 'pointer', 
                            color: colors.primary,
                            fontWeight: typography.fontWeights.medium
                          }}
                          onClick={() => navigate(`/reports/${report.id}`)}
                        >
                          {report.id.slice(-5)}
                        </b>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'left' }}>{report.category || '-'}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'left' }}>{report.type || '-'}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'left' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: typography.fontSizes.xs,
                          fontWeight: typography.fontWeights.medium,
                          background: report.status?.toLowerCase() === 'resolved' 
                            ? 'rgba(76, 201, 240, 0.1)' 
                            : report.status?.toLowerCase() === 'in progress'
                              ? 'rgba(72, 149, 239, 0.1)'
                              : 'rgba(247, 37, 133, 0.1)',
                          color: report.status?.toLowerCase() === 'resolved' 
                            ? colors.success
                            : report.status?.toLowerCase() === 'in progress'
                              ? colors.info
                              : colors.warning
                        }}>
                          {report.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'left' }}>
                        {report.assignedStaffName ? (
                          <div>
                            <div style={{ fontWeight: typography.fontWeights.medium }}>{report.assignedStaffName}</div>
                            <div style={{ fontSize: typography.fontSizes.xs, color: '#6c757d' }}>{report.assignedStaffDepartment}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        {report.timestamp?.toDate
                          ? report.timestamp.toDate().toLocaleString()
                          : '-'}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <Button 
                            type="primary" 
                            size="sm" 
                            onClick={() => navigate(`/reports/${report.id}`)}
                          >
                            View
                          </Button>
                          
                          {(!report.assignedTo || !report.assignedStaffName) && (
                            <Button 
                              type="info" 
                              size="sm" 
                              onClick={() => setAssigningReport(report.id)}
                            >
                              Assign
                            </Button>
                          )}
                          
                          {(report.assignedTo && report.assignedStaffName) && report.status?.toLowerCase() !== 'resolved' && (
                            <Button 
                              type="secondary" 
                              size="sm"
                              onClick={() => setReassigningReport(report.id)}
                              icon="🔄"
                            >
                              Reassign
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: spacing.lg, textAlign: 'center' }}>
            <Button
              type="primary"
              onClick={() => navigate('/reports')}
            >
              View All Reports
            </Button>
          </div>
        </Card>
      </section>      {/* Assignment Modal */}
      {assigningReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 520,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: `1px solid ${colors.lightBorder}`,
            transform: 'scale(1)',
            animation: 'modalAppear 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff'
              }}>
                👥
              </div>
              <div>
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  margin: 0,
                  color: colors.darkText 
                }}>
                  Assign Staff
                </h3>
                <p style={{ 
                  fontSize: 14, 
                  color: '#6c757d',
                  margin: '4px 0 0 0'
                }}>
                  Assign to a staff member
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: 28 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 10, 
                fontSize: 14, 
                fontWeight: 600,
                color: colors.darkText
              }}>
                Select Staff Member
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `2px solid ${colors.lightBorder}`,
                  fontSize: 15,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  background: '#fff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px rgba(67, 97, 238, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightBorder;
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)';
                }}
              >
                <option value="">Choose a staff member...</option>
                {availableStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.displayName || staff.name || staff.email} {staff.department ? `• ${staff.department}` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setAssigningReport(null);
                  setSelectedStaff('');
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: `2px solid ${colors.lightBorder}`,
                  background: '#fff',
                  color: colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.lightBg;
                  e.target.style.borderColor = '#c0c4cc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.borderColor = colors.lightBorder;
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignReport(assigningReport, selectedStaff)}
                disabled={!selectedStaff}
                style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: selectedStaff ? 
                    `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` 
                    : '#e9ecef',
                  color: selectedStaff ? '#fff' : '#6c757d',
                  fontWeight: 600,
                  cursor: selectedStaff ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  boxShadow: selectedStaff ? '0 4px 16px rgba(67, 97, 238, 0.3)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span>✓</span>
                Assign Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {reassigningReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            maxWidth: 520,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: `1px solid ${colors.lightBorder}`,
            transform: 'scale(1)',
            animation: 'modalAppear 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.info}, ${colors.primary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff'
              }}>
                🔄
              </div>
              <div>
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  margin: 0,
                  color: colors.darkText 
                }}>
                  Reassign Staff
                </h3>
                <p style={{ 
                  fontSize: 14, 
                  color: '#6c757d',
                  margin: '4px 0 0 0'
                }}>
                  Transfer to a new staff member
                </p>
              </div>
            </div>

            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(72, 149, 239, 0.08), rgba(67, 97, 238, 0.12))',
              borderRadius: 12,
              marginBottom: 24,
              border: `1px solid rgba(72, 149, 239, 0.2)`,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ fontSize: 14, color: colors.info, fontWeight: 500 }}>
                This will clear any existing resolution data and reset progress
              </div>
            </div>
            
            <div style={{ marginBottom: 28 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 10, 
                fontSize: 14, 
                fontWeight: 600,
                color: colors.darkText
              }}>
                Select New Staff Member
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `2px solid ${colors.lightBorder}`,
                  fontSize: 15,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  background: '#fff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px rgba(67, 97, 238, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightBorder;
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)';
                }}
              >
                <option value="">Choose a staff member...</option>
                {availableStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.displayName || staff.name || staff.email} {staff.department ? `• ${staff.department}` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setReassigningReport(null);
                  setSelectedStaff('');
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: `2px solid ${colors.lightBorder}`,
                  background: '#fff',
                  color: colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.lightBg;
                  e.target.style.borderColor = '#c0c4cc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.borderColor = colors.lightBorder;
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReassignReport(reassigningReport, selectedStaff)}
                disabled={!selectedStaff}
                style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: selectedStaff ? 
                    `linear-gradient(135deg, ${colors.info}, ${colors.primary})` 
                    : '#e9ecef',
                  color: selectedStaff ? '#fff' : '#6c757d',
                  fontWeight: 600,
                  cursor: selectedStaff ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  boxShadow: selectedStaff ? '0 4px 16px rgba(67, 97, 238, 0.3)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span>🔄</span>
                Reassign Report
              </button>
            </div>
          </div>
        </div>      )}
      
      <style jsx global>{`
        @keyframes modalAppear {
          0% { 
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          100% { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default Dashboard;