import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import Card from '../components/Card';
import './Dashboard.css';

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

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [assigningReport, setAssigningReport] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const db = getFirestore();
      const docRef = doc(db, 'reports', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const reportData = { id: docSnap.id, ...docSnap.data() };
        setReport(reportData);
        setStatusUpdate(reportData.status || 'Pending');
      }
      setLoading(false);
    };
    fetchReport();
  }, [id]);

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
  // Helper to get last 5 chars of report id
  const getShortId = (fullId) => {
    if (!fullId) return '';
    return fullId.slice(-5);
  };

  // Helper to format WhatsApp URL
  const formatWhatsAppUrl = (phone) => {
    if (!phone) return null;
    // Remove any non-digit characters and ensure it starts with country code
    let cleanPhone = phone.replace(/\D/g, '');
    // If it starts with 0, replace with 60 (Malaysia country code)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '60' + cleanPhone.substring(1);
    }
    // If it doesn't start with 60, add it
    if (!cleanPhone.startsWith('60')) {
      cleanPhone = '60' + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}`;
  };

  // Card component for better design consistency
  const Card = ({ title, children, className = "", style = {} }) => (
    <div 
      className={`detail-card ${className}`}
      style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 24, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: 24,
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

  // Update report status
  const handleStatusUpdate = async () => {
    if (!report || statusUpdate === report.status) return;
    
    try {
      const db = getFirestore();
      const docRef = doc(db, 'reports', id);
      await updateDoc(docRef, {
        status: statusUpdate
      });
      
      // Update local state
      setReport({
        ...report,
        status: statusUpdate
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Add assignment function
  const handleAssignReport = async () => {
    if (!selectedStaff) return;
    
    try {
      const db = getFirestore();
      const reportRef = doc(db, 'reports', id);
      const staff = availableStaff.find(s => s.id === selectedStaff);
      
      await updateDoc(reportRef, {
        assignedTo: staff.email,
        assignedStaffName: staff.displayName || staff.name || staff.email,
        assignedStaffDepartment: staff.department || 'N/A',
        status: 'In Progress',
        assignedAt: new Date()
      });
      
      // Update local state
      setReport({
        ...report,
        assignedTo: staff.email,
        assignedStaffName: staff.displayName || staff.name || staff.email,
        assignedStaffDepartment: staff.department || 'N/A',
        status: 'In Progress'
      });
      
      setAssigningReport(false);
      setSelectedStaff('');
    } catch (error) {
      console.error("Error assigning report:", error);
    }
  };

  // Add resolve report function
  const handleResolveReport = async () => {
    try {
      const db = getFirestore();
      const reportRef = doc(db, 'reports', id);
      
      await updateDoc(reportRef, {
        status: 'Resolved',
        resolvedAt: new Date(),
        pendingReview: false
      });
      
      // Update local state
      setReport({
        ...report,
        status: 'Resolved',
        resolvedAt: new Date(),
        pendingReview: false
      });
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  // Add reassignment function
  const handleReassignReport = async () => {
    if (!selectedStaff) return;
    
    try {
      const db = getFirestore();
      const reportRef = doc(db, 'reports', id);
      const staff = availableStaff.find(s => s.id === selectedStaff);
      
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
      
      // Update local state
      setReport({
        ...report,
        assignedTo: staff.email,
        assignedStaffName: staff.displayName || staff.name || staff.email,
        assignedStaffDepartment: staff.department || 'N/A',
        status: 'In Progress',
        resolutionImage: null,
        resolutionNote: null,
        resolutionTimestamp: null,
        pendingReview: false
      });
      
      setReassigning(false);
      setSelectedStaff('');
    } catch (error) {
      console.error("Error reassigning report:", error);
    }  };
  if (loading) {
    return (
      <div style={{ 
        background: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh'
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
          <p style={{ fontSize: 16, color: colors.darkText }}>Loading report details...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ background: '#f5f7fa', minHeight: '80vh', padding: '24px 32px' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h2 style={{ fontSize: 24, color: colors.darkText, marginBottom: 16 }}>Report Not Found</h2>
          <p style={{ fontSize: 16, color: '#6c757d', marginBottom: 24 }}>The requested report could not be found.</p>
            <button
              onClick={() => navigate('/reports')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: colors.primary,
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer'
              }}            >
              Back to Reports
            </button>
          </div>
      </div>
    );
  }

  // Determine report type for extra fields
  const isDorm = report.category?.toLowerCase() === 'dorm';
  const isFaculty = report.category?.toLowerCase() === 'faculty';
  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 28
      }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: colors.darkText, 
            display: 'flex', 
            alignItems: 'center',
            margin: 0 
          }}>
            Report Details 
            <span style={{ 
              fontSize: 18,
              fontWeight: 500,
              color: '#6c757d',
              marginLeft: 12,
              background: colors.lightBg,
              padding: '4px 10px',
              borderRadius: 6
            }}>{getShortId(report.ID || report.id)}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/reports')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.lightBorder}`,
              background: '#fff',
              color: colors.darkText,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Back to Reports
          </button>
        </div>
      </header><div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Left column - Report details */}
          <div style={{ flex: '1 1 500px' }}>
            {/* Reporter Contact Card */}
            <Card>
              <div style={{ 
                background: 'linear-gradient(135deg, #4361ee 0%, #3f37c9 100%)',
                color: '#fff',
                padding: 20,
                borderRadius: 12,
                marginBottom: 16,
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)'
              }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 16, 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: 0
                }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  Reporter Contact Information
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: 16 
                }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Email</div>
                    <div style={{ fontWeight: 500 }}>{report.userEmail || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Phone Number</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12 
                    }}>
                      <span style={{ fontWeight: 500 }}>
                        {report.reporterFullPhone || 'N/A'}
                      </span>
                      {report.reporterFullPhone && (
                        <a
                          href={formatWhatsAppUrl(report.reporterFullPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#25D366',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          <span style={{ fontSize: 12 }}>💬</span>
                          Contact on WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Status Management Card */}
            <Card>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: colors.lightBg,
                padding: 16,
                borderRadius: 8,
                marginBottom: 16
              }}>
                <div>
                  <div style={{ fontSize: 14, color: '#6c757d', marginBottom: 4 }}>Current Status</div>                  <div style={{ 
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 500,
                    background: report.status?.toLowerCase() === 'resolved' 
                      ? 'rgba(34, 197, 94, 0.1)' 
                      : report.status?.toLowerCase() === 'in progress'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : report.status?.toLowerCase() === 'pending review'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                    color: report.status?.toLowerCase() === 'resolved' 
                      ? '#22c55e'
                      : report.status?.toLowerCase() === 'in progress'
                        ? '#3b82f6'
                        : report.status?.toLowerCase() === 'pending review'
                          ? '#f59e0b'
                          : '#ef4444'
                  }}>
                    {report.status || 'Pending'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select 
                    value={statusUpdate} 
                    onChange={e => setStatusUpdate(e.target.value)}
                    style={{ 
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: `1px solid ${colors.lightBorder}`,
                      fontSize: 14
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  
                  <button
                    onClick={handleStatusUpdate}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      background: colors.primary,
                      color: '#fff',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Update Status
                  </button>
                </div>
              </div>
              
              {/* Assignment Info */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Assigned To</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14
                  }}>
                    {report.assignedStaffName ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{report.assignedStaffName}</div>
                        <div style={{ fontSize: 12, color: '#6c757d' }}>{report.assignedStaffDepartment}</div>
                        {report.assignedAt && (
                          <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                            Assigned: {formatTimestamp(report.assignedAt)}
                          </div>
                        )}
                        {/* Add reassign button here */}
                        {report.status?.toLowerCase() !== 'resolved' && (
                          <div style={{ marginTop: 16 }}>
                            <button
                              onClick={() => setReassigning(true)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                border: `2px solid ${colors.info}`,
                                background: '#fff',
                                color: colors.info,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 14,
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 2px 8px rgba(72, 149, 239, 0.15)',
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = colors.info;
                                e.target.style.color = '#fff';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(72, 149, 239, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.color = colors.info;
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(72, 149, 239, 0.15)';
                              }}
                            >
                              <span style={{ fontSize: 16 }}>🔄</span>
                              Reassign Staff
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span style={{ color: '#6c757d', fontStyle: 'italic', marginBottom: 8, display: 'block' }}>Unassigned</span>
                        <button
                          onClick={() => setAssigningReport(true)}
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
                          Assign Staff
                        </button>
                      </div>
                    )}                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Reported On</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14
                  }}>{formatTimestamp(report.timestamp)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Category & Type</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14
                  }}>{`${report.category || '-'} - ${report.type || '-'}`}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  marginBottom: 6, 
                  color: colors.darkText 
                }}>Description</div>
                <div style={{ 
                  padding: '12px 16px',
                  background: colors.lightBg,
                  borderRadius: 8,
                  fontSize: 14,
                  minHeight: 60
                }}>{report.description || '-'}</div>
              </div>

              {/* Location Details - Conditionally Rendered */}
              {isDorm && (
                <div>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    marginBottom: 12,
                    marginTop: 24,
                    color: colors.primary 
                  }}>Dormitory Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>College</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.college || '-'}</div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>Block</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.block || '-'}</div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>Floor</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.floor || '-'}</div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>House</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.house || '-'}</div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>Room</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.room || '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Faculty Details */}
              {isFaculty && (
                <div>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    marginBottom: 12,
                    marginTop: 24,
                    color: colors.primary 
                  }}>Faculty Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>Faculty</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.faculty || '-'}</div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>Floor</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.floor || '-'}</div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 6, 
                        color: colors.darkText 
                      }}>Room</div>
                      <div style={{ 
                        padding: '12px 16px',
                        background: colors.lightBg,
                        borderRadius: 8,
                        fontSize: 14
                      }}>{report.room || '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginTop: 24 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  marginBottom: 6, 
                  color: colors.darkText 
                }}>Additional Notes</div>
                <div style={{ 
                  padding: '12px 16px',
                  background: colors.lightBg,
                  borderRadius: 8,
                  fontSize: 14,
                  minHeight: 80
                }}>{report.notes || '-'}</div>
              </div>
            </Card>

            {/* Resolution Review Card - Show when staff has submitted resolution */}
            {report.pendingReview && report.resolutionImage && (
              <Card>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'rgba(72, 149, 239, 0.05)',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                  border: `1px solid ${colors.info}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: colors.info,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 18
                    }}>⚠️</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: colors.darkText }}>
                        Resolution Pending Review
                      </div>
                      <div style={{ fontSize: 14, color: '#6c757d' }}>
                        Staff has submitted a resolution that needs your approval
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleResolveReport}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: colors.success,
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(76, 201, 240, 0.3)',
                      transition: 'all 0.2s',
                      fontSize: 14
                    }}
                  >
                    ✓ Mark as Resolved
                  </button>
                </div>

                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 16,
                  color: colors.primary 
                }}>Staff Resolution Details</div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      marginBottom: 6, 
                      color: colors.darkText 
                    }}>Resolved By</div>
                    <div style={{ 
                      padding: '12px 16px',
                      background: colors.lightBg,
                      borderRadius: 8,
                      fontSize: 14
                    }}>{report.resolvedBy || report.assignedStaffName || '-'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      marginBottom: 6, 
                      color: colors.darkText 
                    }}>Resolution Date</div>
                    <div style={{ 
                      padding: '12px 16px',
                      background: colors.lightBg,
                      borderRadius: 8,
                      fontSize: 14
                    }}>{formatTimestamp(report.resolutionTimestamp)}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Resolution Notes</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14,
                    minHeight: 60
                  }}>{report.resolutionNote || 'No notes provided'}</div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Resolution Image</div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    background: colors.lightBg,
                    borderRadius: 8,
                    padding: 16
                  }}>
                    <img 
                      src={report.resolutionImage} 
                      alt="Resolution" 
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        window.open(report.resolutionImage, '_blank');
                      }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Map Card */}
            <Card title="Location">
              <div
                style={{
                  height: 350, 
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: `1px solid ${colors.lightBorder}`
                }}
              >
                {report.location && report.location.latitude && report.location.longitude ? (
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}&z=15&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#6c757d',
                    background: colors.lightBg
                  }}>
                    No location data available
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right column - Images */}
          <div style={{ flex: '1 1 300px' }}>
            <Card title="Original Issue Image">
              {report.imageUrl ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <img 
                    src={report.imageUrl} 
                    alt="Report Issue" 
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '50vh',
                      objectFit: 'contain',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      window.open(report.imageUrl, '_blank');
                    }}
                  />
                </div>
              ) : (
                <div style={{ 
                  height: 300, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6c757d',
                  background: colors.lightBg,
                  borderRadius: 8
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: '50%',
                    fontSize: 32
                  }}>📷</div>
                  <div>No image available</div>
                </div>
              )}
            </Card>

            {/* Resolution Image Card - Show only when resolution exists but not necessarily pending review */}
            {report.resolutionImage && (
              <Card title="Resolution Image">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <img 
                    src={report.resolutionImage} 
                    alt="Resolution" 
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '50vh',
                      objectFit: 'contain',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      window.open(report.resolutionImage, '_blank');
                    }}
                  />
                </div>
                
                {report.resolutionNote && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      marginBottom: 6, 
                      color: colors.darkText 
                    }}>Staff Notes</div>
                    <div style={{ 
                      padding: '12px 16px',
                      background: colors.lightBg,
                      borderRadius: 8,
                      fontSize: 14
                    }}>{report.resolutionNote}</div>
                  </div>
                )}
                
                {report.resolutionTimestamp && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#6c757d' 
                    }}>
                      Submitted: {formatTimestamp(report.resolutionTimestamp)}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Assignment Modal - Updated to handle both assign and reassign */}
        {(assigningReport || reassigning) && (
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
                  background: reassigning ? `linear-gradient(135deg, ${colors.info}, ${colors.primary})` : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#fff'
                }}>
                  {reassigning ? '🔄' : '👥'}
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: 20, 
                    fontWeight: 600, 
                    margin: 0,
                    color: colors.darkText 
                  }}>
                    {reassigning ? 'Reassign Staff' : 'Assign Staff'}
                  </h3>
                  <p style={{ 
                    fontSize: 14, 
                    color: '#6c757d',
                    margin: '4px 0 0 0'
                  }}>
                    {reassigning ? 'Transfer to a new staff member' : 'Assign to a staff member'}
                  </p>
                </div>
              </div>

              {reassigning && (
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
              )}

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
                    setAssigningReport(false);
                    setReassigning(false);
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
                  onClick={reassigning ? handleReassignReport : handleAssignReport}
                  disabled={!selectedStaff}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 12,
                    border: 'none',
                    background: selectedStaff ? 
                      (reassigning ? `linear-gradient(135deg, ${colors.info}, ${colors.primary})` : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`) 
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
                  <span>{reassigning ? '🔄' : '✓'}</span>
                  {reassigning ? 'Reassign Report' : 'Assign Report'}                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ReportDetail;