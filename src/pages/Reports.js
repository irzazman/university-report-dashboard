import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

// Modern color palette matching other pages
const colors = {
  primary: '#4361ee',
  secondary: '#3f37c9',
  success: '#4cc9f0',
  warning: '#f72585',
  info: '#4895ef',
  accent: '#560bad',
  chartColors: ['#4361ee', '#f72585', '#4cc9f0', '#4895ef', '#560bad', '#3f37c9', '#7209b7', '#b5179e'],
  lightBg: '#f8f9fa',
  darkText: '#212529',
  lightBorder: '#e9ecef'
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [assigningReport, setAssigningReport] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [availableStaff, setAvailableStaff] = useState([]);
  const [reassigningReport, setReassigningReport] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setSortField('timestamp');
    setSortOrder('desc');
  }, []);

  useEffect(() => {
    const db = getFirestore();
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportsArray);
    });

    return () => unsubscribe();
  }, []);

  // Fetch staff members from database
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

  // Reset to first page when filters or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, typeFilter, statusFilter, itemsPerPage]);

  // Unique values for dropdowns
  const uniqueTypes = Array.from(new Set(reports.map(r => r.type))).filter(Boolean);
  const uniqueCategories = Array.from(new Set(reports.map(r => r.category))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(reports.map(r => r.status))).filter(Boolean);

  // Search and filter logic
  const filteredReports = reports.filter(r => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      (r.ID && r.ID.toString().toLowerCase().includes(searchLower)) ||
      (r.id && r.id.toString().toLowerCase().includes(searchLower)) ||
      (r.category && r.category.toLowerCase().includes(searchLower)) ||
      (r.type && r.type.toLowerCase().includes(searchLower)) ||
      (r.status && r.status.toLowerCase().includes(searchLower));
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  // Sorting logic
  const sortedReports = [...filteredReports].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    if (sortField === 'timestamp') {
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
  const totalPages = Math.ceil(sortedReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = sortedReports.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Helper to render sort arrow
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  // Card component for better design consistency
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

  // Pagination controls
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Export PDF handler with improved styling
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 20;

    // Title with logo/header
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, 210, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('University Report System', 14, 8);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.text('Reports', 14, y);
    
    // Date of export
    const today = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${today}`, 14, y + 6);
    y += 14;

    // Summary of filters
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    if (categoryFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all') {
      y += 6;
      doc.text('Applied Filters:', 14, y);
      y += 6;
      
      if (categoryFilter !== 'all') {
        doc.text(`• Category: ${categoryFilter}`, 18, y);
        y += 6;
      }
      
      if (typeFilter !== 'all') {
        doc.text(`• Type: ${typeFilter}`, 18, y);
        y += 6;
      }
      
      if (statusFilter !== 'all') {
        doc.text(`• Status: ${statusFilter}`, 18, y);
        y += 6;
      }
      
      y += 4;
    }

    // Prepare table rows
    const tableRows = sortedReports.map(report => [
      report.id ? report.id.slice(-5) : '',
      report.category || '',
      report.type || '',
      report.status || '',
      report.timestamp?.toDate ? report.timestamp.toDate().toLocaleString() : '',
    ]);

    autoTable(doc, {
      head: [['Report ID', 'Category', 'Type', 'Status', 'Date/Time']],
      body: tableRows,
      startY: y + 4,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
      headStyles: { 
        fillColor: [67, 97, 238],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      theme: 'grid',
      tableWidth: 180
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, 285, { align: 'center' });
      doc.text('University Report System', 14, 285);
    }

    doc.save('reports.pdf');
  };

  // Remove the hardcoded staff list and update the assignment function
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

  return (
    <div style={{ background: '#f5f7fa' }}>
        <header className="dashboard-header" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 32
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.darkText }}>Reports</h1>
          <button
            className="export-btn"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)',
              transition: 'all 0.2s'
            }}
            onClick={handleExportPDF}
          >
            <span style={{ marginRight: 8 }}>📑</span> Export PDF
          </button>
        </header>
        
        <section className="reports-section">
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by Report ID, Category, Type, Status..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: `1px solid ${colors.lightBorder}`,
                  fontSize: 15,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              />
              <button
                className="filter-btn"
                onClick={() => setShowFilters(!showFilters)}
                style={{ 
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: colors.info,
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(72, 149, 239, 0.2)',
                  transition: 'all 0.2s'
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
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: 8, 
                    border: `1px solid ${colors.lightBorder}`,
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    minWidth: 180
                  }}
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: 8, 
                    border: `1px solid ${colors.lightBorder}`,
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    minWidth: 180
                  }}
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: 8, 
                    border: `1px solid ${colors.lightBorder}`,
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    minWidth: 180
                  }}
                >
                  <option value="all">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            )}
          </Card>
          
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: 14 
              }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.lightBorder}` }}>
                    <th 
                      onClick={() => handleSort('id')}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600
                      }}
                    >
                      Report ID{renderSortArrow('id')}
                    </th>
                    <th 
                      onClick={() => handleSort('category')}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600
                      }}
                    >
                      Category{renderSortArrow('category')}
                    </th>
                    <th 
                      onClick={() => handleSort('type')}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600
                      }}
                    >
                      Type{renderSortArrow('type')}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600
                      }}
                    >
                      Status{renderSortArrow('status')}
                    </th>
                    <th 
                      onClick={() => handleSort('assignedStaffName')}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600
                      }}
                    >
                      Assigned To{renderSortArrow('assignedStaffName')}
                    </th>
                    <th 
                      onClick={() => handleSort('timestamp')}
                      style={{ 
                      padding: '14px 16px',
                      textAlign: 'center',
                      fontWeight: 600
                    }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ 
                        textAlign: 'center', 
                        padding: '32px 0',
                        color: '#6c757d'
                      }}>
                        No reports found.
                      </td>
                    </tr>
                  ) : (
                    paginatedReports.map(report => (
                      <tr 
                        key={report.id} 
                        style={{ 
                          borderBottom: `1px solid ${colors.lightBorder}`,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(67, 97, 238, 0.03)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >                        <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                          <span
                            onClick={() => navigate(`/reports/${report.id}`)}
                            style={{ 
                              fontFamily: 'monospace',
                              background: colors.lightBg,
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              border: `1px solid transparent`,
                              display: 'inline-block',
                              fontWeight: 500
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = colors.primary;
                              e.target.style.color = '#fff';
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 2px 8px rgba(67, 97, 238, 0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = colors.lightBg;
                              e.target.style.color = 'inherit';
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                            title="Click to view report details"
                          >
                            {(report.id || '').slice(-5)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'left' }}>{report.category || '-'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'left' }}>{report.type || '-'}</td>                        <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            background: (() => {
                              const status = report.status?.toLowerCase();
                              switch (status) {
                                case 'resolved': return 'rgba(40, 167, 69, 0.1)'; // Green background
                                case 'in progress': return 'rgba(0, 123, 255, 0.1)'; // Blue background
                                case 'pending review': return 'rgba(255, 193, 7, 0.1)'; // Yellow background
                                default: return 'rgba(220, 53, 69, 0.1)'; // Red background for pending
                              }
                            })(),
                            color: (() => {
                              const status = report.status?.toLowerCase();
                              switch (status) {
                                case 'resolved': return '#28a745'; // Green text
                                case 'in progress': return '#007bff'; // Blue text
                                case 'pending review': return '#ffc107'; // Yellow text
                                default: return '#dc3545'; // Red text for pending
                              }
                            })()
                          }}>
                            {report.status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'left' }}>
                          {report.assignedStaffName ? (
                            <div>
                              <div style={{ fontWeight: 500 }}>{report.assignedStaffName}</div>
                              <div style={{ fontSize: 12, color: '#6c757d' }}>{report.assignedStaffDepartment}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {report.timestamp?.toDate
                            ? report.timestamp.toDate().toLocaleString()
                            : '-'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => navigate(`/reports/${report.id}`)}
                              style={{
                                padding: '6px 16px',
                                borderRadius: 6,
                                border: 'none',
                                background: colors.primary,
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontSize: 12,
                                boxShadow: '0 2px 6px rgba(67, 97, 238, 0.2)',
                                transition: 'all 0.2s'
                              }}
                            >
                              View
                            </button>
                            {(!report.assignedTo || !report.assignedStaffName) && (
                              <button
                                onClick={() => setAssigningReport(report.id)}
                                style={{
                                  padding: '6px 16px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: colors.info,
                                  color: '#fff',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  boxShadow: '0 2px 6px rgba(72, 149, 239, 0.2)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                Assign
                              </button>
                            )}
                            {(report.assignedTo && report.assignedStaffName) && report.status?.toLowerCase() !== 'resolved' && (
                              <button
                                onClick={() => setReassigningReport(report.id)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  border: `1.5px solid ${colors.info}`,
                                  background: '#fff',
                                  color: colors.info,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = colors.info;
                                  e.target.style.color = '#fff';
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 3px 8px rgba(72, 149, 239, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#fff';
                                  e.target.style.color = colors.info;
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = 'none';
                                }}
                              >
                                <span style={{ fontSize: 10 }}>🔄</span>
                                Reassign
                              </button>
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
                Showing {Math.min(startIndex + 1, sortedReports.length)} - {Math.min(startIndex + itemsPerPage, sortedReports.length)} of {sortedReports.length} reports
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#6c757d' }}>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: currentPage === 1 ? '#e9ecef' : colors.primary,
                      color: currentPage === 1 ? '#adb5bd' : '#fff',
                      cursor: currentPage === 1 ? 'default' : 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ←
                  </button>
                  
                  <span style={{ fontSize: 14 }}>
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: currentPage >= totalPages ? '#e9ecef' : colors.primary,
                      color: currentPage >= totalPages ? '#adb5bd' : '#fff',
                      cursor: currentPage >= totalPages ? 'default' : 'pointer',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </section>
        
        {/* Assignment modal */}
        {assigningReport && (
          <div className="assignment-modal">
            <div className="modal-content" style={{ 
              padding: 24, 
              borderRadius: 12, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              background: '#fff'
            }}>
              <h3 style={{ 
                marginBottom: 16, 
                fontSize: 18,
                fontWeight: 600,
                color: colors.darkText 
              }}>
                Assign Report
              </h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontSize: 14, 
                  fontWeight: 500,
                  color: colors.darkText 
                }}>
                  Select Staff
                </label>
                <select
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(e.target.value)}
                  style={{ 
                    padding: '10px 16px', 
                    borderRadius: 8, 
                    border: `1px solid ${colors.lightBorder}`,
                    background: '#f8f9fa',
                    fontSize: 14,
                    width: '100%',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <option value="">Choose staff member</option>
                  {availableStaff.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.displayName || staff.name || staff.email} {staff.department ? `(${staff.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 16 
              }}>
                <button
                  onClick={() => {
                    setAssigningReport(null);
                    setSelectedStaff('');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#e9ecef',
                    color: '#333',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: 1,
                    maxWidth: 120
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignReport(assigningReport, selectedStaff)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: colors.primary,
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: 1,
                    maxWidth: 120
                  }}
                >
                  Assign Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reassignment modal */}
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
              border: `1px solid ${colors.lightBorder}`
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
                    Reassign Report
                  </h3>
                  <p style={{ 
                    fontSize: 14, 
                    color: '#6c757d',
                    margin: '4px 0 0 0'
                  }}>
                    Transfer this report to a new staff member
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
                  This will clear any existing resolution data
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
                  onChange={e => setSelectedStaff(e.target.value)}
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
                    background: selectedStaff ? `linear-gradient(135deg, ${colors.info}, ${colors.primary})` : '#e9ecef',
                    color: selectedStaff ? '#fff' : '#6c757d',
                    fontWeight: 600,
                    cursor: selectedStaff ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    boxShadow: selectedStaff ? '0 4px 16px rgba(72, 149, 239, 0.3)' : 'none',
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
            </div>          </div>
        )}
    </div>
  );
};

export default Reports;