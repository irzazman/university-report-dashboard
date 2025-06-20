import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, onSnapshot, doc, updateDoc, orderBy, query } from "firebase/firestore";
import './Dashboard.css';

// Modern color palette
const colors = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  success: '#4cc9f0',
  warning: '#f72585',
  info: '#4895ef',
  accent: '#560bad',
  lightBg: '#f8f9fa',
  darkText: '#212529',
  lightBorder: '#e9ecef'
};

// Move Card component outside of the main component
const Card = ({ title, children, className = "", style = {} }) => (
  <div 
    className={`reports-card ${className}`}
    style={{ 
      background: '#fff', 
      borderRadius: 12, 
      padding: 24, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      ...style 
    }}
  >
    {title && (
      <h3 style={{ 
        marginBottom: 16, 
        fontSize: 18,
        fontWeight: 600,
        color: colors.darkText 
      }}>{title}</h3>
    )}
    {children}
  </div>
);

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    const db = getFirestore();
    const ticketsRef = collection(db, 'support_tickets'); // Changed from 'supportTickets' to 'support_tickets'
    const q = query(ticketsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Support tickets snapshot:', snapshot.docs.length);
        const ticketsArray = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Ticket data:', data);
          return {
            id: doc.id,
            ...data,
          };
        });
        setTickets(ticketsArray);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching support tickets:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter, itemsPerPage]);

  // Unique values for filters
  const uniqueCategories = Array.from(new Set(tickets.map(t => t.reportCategory))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(tickets.map(t => t.status || 'Open'))).filter(Boolean);

  // Search and filter logic
  const filteredTickets = tickets.filter(t => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      (t.id && t.id.toLowerCase().includes(searchLower)) ||
      (t.reportId && t.reportId.toLowerCase().includes(searchLower)) ||
      (t.userEmail && t.userEmail.toLowerCase().includes(searchLower)) ||
      (t.issueDescription && t.issueDescription.toLowerCase().includes(searchLower));
    
    const matchesCategory = categoryFilter === 'all' || t.reportCategory === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (t.status || 'Open') === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting logic
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'createdAt') {
      aValue = aValue?.toDate ? aValue.toDate() : new Date(0);
      bValue = bValue?.toDate ? bValue.toDate() : new Date(0);
    }
    
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  // Update ticket status
  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const db = getFirestore();
      const ticketRef = doc(db, 'support_tickets', ticketId); // Changed from 'supportTickets' to 'support_tickets'
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  // Helper to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return '-';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return colors.warning;
      case 'in progress':
        return colors.info;
      case 'resolved':
        return colors.success;
      case 'closed':
        return '#6c757d';
      default: 
        return colors.warning;
    }
  };
  // Memoize the search handler
  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  // Memoize the category filter handler
  const handleCategoryFilterChange = useCallback((e) => {
    setCategoryFilter(e.target.value);
  }, []);

  // Memoize the status filter handler
  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  // Memoize the items per page handler
  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
  }, []);
  if (loading) {
    return (
      <div style={{ 
        background: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ 
            width: 48,
            height: 48,
            margin: '0 auto 20px',
            border: '3px solid rgba(67, 97, 238, 0.2)',
            borderTopColor: colors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontSize: 16, color: colors.darkText }}>Loading support tickets...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ 
        background: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h2 style={{ fontSize: 24, color: colors.darkText, marginBottom: 16 }}>Error Loading Tickets</h2>
          <p style={{ fontSize: 16, color: '#6c757d', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: '#f5f7fa' }}>
      <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.darkText }}>Support Tickets</h1>
            <p style={{ fontSize: 16, color: '#6c757d', margin: '8px 0 0 0' }}>
              Manage student support tickets related to facility reports
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              background: 'rgba(67, 97, 238, 0.1)',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              color: colors.primary
            }}>
              {tickets.length} Total Tickets
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 32 
        }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              padding: '16px 24px', 
              background: `linear-gradient(45deg, ${colors.warning}, ${colors.accent})`,
              color: '#fff'
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>Open Tickets</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
                {tickets.filter(t => (t.status || 'Open') === 'Open').length}
              </div>
            </div>
          </Card>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              padding: '16px 24px', 
              background: `linear-gradient(45deg, ${colors.info}, ${colors.primary})`,
              color: '#fff'
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>In Progress</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
                {tickets.filter(t => (t.status || 'Open') === 'In Progress').length}
              </div>
            </div>
          </Card>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              padding: '16px 24px', 
              background: `linear-gradient(45deg, ${colors.success}, ${colors.info})`,
              color: '#fff'
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>Resolved</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
                {tickets.filter(t => (t.status || 'Open') === 'Resolved').length}
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <input
              key="search-input" // Add key to prevent re-creation
              type="text"
              placeholder="Search tickets by ID, email, or description..."
              value={search}
              onChange={handleSearchChange}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.lightBorder}`,
                fontSize: 15,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                outline: 'none'
              }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: colors.info,
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              marginBottom: 16, 
              flexWrap: 'wrap',
              background: colors.lightBg,
              padding: 16,
              borderRadius: 8
            }}>
              <select
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  border: `1px solid ${colors.lightBorder}`,
                  background: '#fff'
                }}
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  border: `1px solid ${colors.lightBorder}`,
                  background: '#fff'
                }}
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.lightBorder}` }}>
                  <th onClick={() => handleSort('id')} style={{ 
                    cursor: 'pointer', 
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Ticket ID{renderSortArrow('id')}
                  </th>
                  <th onClick={() => handleSort('userEmail')} style={{ 
                    cursor: 'pointer', 
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Student{renderSortArrow('userEmail')}
                  </th>
                  <th onClick={() => handleSort('reportId')} style={{ 
                    cursor: 'pointer', 
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Related Report{renderSortArrow('reportId')}
                  </th>
                  <th onClick={() => handleSort('reportCategory')} style={{ 
                    cursor: 'pointer', 
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Category{renderSortArrow('reportCategory')}
                  </th>
                  <th onClick={() => handleSort('status')} style={{ 
                    cursor: 'pointer', 
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Status{renderSortArrow('status')}
                  </th>
                  <th onClick={() => handleSort('createdAt')} style={{ 
                    cursor: 'pointer', 
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Created{renderSortArrow('createdAt')}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ 
                      textAlign: 'center', 
                      padding: '32px 0',
                      color: '#6c757d'
                    }}>
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map(ticket => (
                    <tr key={ticket.id} style={{ borderBottom: `1px solid ${colors.lightBorder}` }}>
                      <td style={{ padding: '14px 16px' }}>
                        <b style={{ color: colors.primary }}>
                          #{ticket.id?.slice(-8) || 'Unknown'}
                        </b>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {ticket.userEmail || '-'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {ticket.reportId ? (
                          <span
                            style={{ 
                              cursor: 'pointer', 
                              color: colors.info,
                              textDecoration: 'underline'
                            }}
                            onClick={() => navigate(`/reports/${ticket.reportId}`)}
                          >
                            #{ticket.reportId.slice(-5)}
                          </span>
                        ) : '-'
                        }
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {ticket.reportCategory || '-'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: `${getStatusColor(ticket.status || 'Open')}20`,
                          color: getStatusColor(ticket.status || 'Open')
                        }}>
                          {ticket.status || 'Open'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {formatTimestamp(ticket.createdAt)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => navigate(`/support-tickets/${ticket.id}`)}
                            style={{
                              padding: '6px 16px',
                              borderRadius: 6,
                              border: 'none',
                              background: colors.primary,
                              color: '#fff',
                              fontWeight: 500,
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            View & Respond
                          </button>
                          {ticket.status !== 'Resolved' && (
                            <select
                              value={ticket.status || 'Open'}
                              onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: `1px solid ${colors.lightBorder}`,
                                fontSize: 12,
                                background: '#fff'
                              }}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${colors.lightBorder}`
          }}>
            <div style={{ color: '#6c757d', fontSize: 14 }}>
              Showing {Math.min(startIndex + 1, sortedTickets.length)} - {Math.min(startIndex + itemsPerPage, sortedTickets.length)} of {sortedTickets.length} tickets
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#6c757d' }}>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: 6, 
                    border: `1px solid ${colors.lightBorder}`,
                    background: '#fff',
                    fontSize: 14
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: currentPage === 1 ? '#e9ecef' : colors.primary,
                    color: currentPage === 1 ? '#adb5bd' : '#fff',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    fontSize: 16
                  }}
                >
                  ←
                </button>
                
                <span style={{ fontSize: 14 }}>
                  Page {currentPage} of {totalPages || 1}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: currentPage >= totalPages ? '#e9ecef' : colors.primary,
                    color: currentPage >= totalPages ? '#adb5bd' : '#fff',
                    cursor: currentPage >= totalPages ? 'default' : 'pointer',
                    fontSize: 16
                  }}
                >
                  →
                </button>
              </div>
            </div>          </div>
        </Card>
    </div>
  );
};

export default SupportTickets;


