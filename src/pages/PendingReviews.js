import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getFirestore, collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";

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

const PendingReviews = () => {
  const navigate = useNavigate();
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');  const [reviewNote, setReviewNote] = useState('');  useEffect(() => {
    console.log('=== PendingReviews Component Starting ===');
    
    const db = getFirestore();
    console.log('Firestore DB instance:', db);
    
    // Simple query without complex nesting
    const reportsRef = collection(db, 'reports');
    const pendingQuery = query(reportsRef, where('status', '==', 'Pending Review'));
    
    console.log('Setting up Firestore listener for Pending Review status...');
    
    const unsubscribe = onSnapshot(
      pendingQuery, 
      (snapshot) => {
        console.log('=== FIRESTORE SNAPSHOT SUCCESS ===');
        console.log('Documents found:', snapshot.size);
        console.log('From cache:', snapshot.metadata.fromCache);
        
        const reports = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`Report ${doc.id}: Status = ${data.status}`);
          reports.push({
            id: doc.id,
            ...data
          });
        });
        
        console.log('All pending reports:', reports);
        setPendingReports(reports);
        setLoading(false);
      },
      (error) => {
        console.error('=== FIRESTORE ERROR ===');
        console.error('Error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setLoading(false);
      }
    );
    
    // Backup timeout
    const timeoutId = setTimeout(() => {
      console.log('=== TIMEOUT REACHED ===');
      console.log('No response after 10 seconds, stopping loading...');
      setLoading(false);
    }, 10000);
    
    return () => {
      console.log('=== CLEANUP ===');
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatLocation = (location) => {
    if (!location || typeof location !== 'object') return 'N/A';
    return `${location.latitude?.toFixed(6) || 'N/A'}, ${location.longitude?.toFixed(6) || 'N/A'}`;
  };

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

  const handleReviewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
    setReviewAction('');
    setReviewNote('');
  };

  const submitReview = async () => {
    if (!selectedReport || !reviewAction) return;

    try {
      const db = getFirestore();
      const reportRef = doc(db, 'reports', selectedReport.id);
        const updateData = {
        status: reviewAction === 'approve' ? 'Resolved' : 'Rejected',
        reviewedAt: new Date(),
        reviewNote: reviewNote || '',
        reviewedBy: 'admin'
      };

      await updateDoc(reportRef, updateData);
      
      setShowModal(false);
      setSelectedReport(null);
      setReviewAction('');
      setReviewNote('');
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending Review': { 
        background: '#fff3cd', 
        color: '#856404', 
        border: '1px solid #ffeaa7' 
      }
    };
    
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        ...styles[status]
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f7fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 48,
            height: 48,
            margin: '0 auto 20px',
            border: '3px solid rgba(67, 97, 238, 0.2)',
            borderTopColor: '#4361ee',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading pending reviews...
        </div>
      </div>
    );
  }  return (
    <div style={{ 
      background: '#f5f7fa',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div className="content-header" style={{ 
          background: '#fff',
          padding: '24px 32px',
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: colors.darkText, 
            marginBottom: 8,
            margin: 0
          }}>
            Pending Reviews
          </h1>
          <p style={{ 
            color: '#6c757d', 
            fontSize: 14,
            margin: 0,
            marginTop: 4
          }}>
            Review completed reports from staff members
          </p>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 24, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 24 
            }}>
              <h2 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: colors.darkText,
                margin: 0
              }}>
                Reports Awaiting Review ({pendingReports.length})
              </h2>
            </div>

          {pendingReports.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 60,
              color: '#6c757d'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No Pending Reviews</h3>
              <p>All reports have been reviewed or there are no completed reports waiting for review.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: 14
              }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.lightBorder}` }}>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Report ID</th>                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Reporter</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Contact</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Category</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Type</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Location</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Resolved By</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Resolution Date</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Status</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: colors.darkText }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReports.map((report) => (
                    <tr key={report.id} style={{ 
                      borderBottom: `1px solid ${colors.lightBorder}`,
                      transition: 'background-color 0.2s'
                    }}>                      <td style={{ padding: '16px 12px' }}>
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
                            display: 'inline-block'
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
                          {report.id.slice(-5)}
                        </span>
                      </td><td style={{ padding: '16px 12px' }}>{report.userEmail || 'N/A'}</td>
                      <td style={{ padding: '16px 12px' }}>
                        {report.reporterFullPhone ? (
                          <a
                            href={formatWhatsAppUrl(report.reporterFullPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#25D366',
                              color: '#fff',
                              padding: '6px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 500,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.2s',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#128C7E'}
                            onMouseOut={(e) => e.target.style.background = '#25D366'}
                            title={`Contact ${report.userEmail} on WhatsApp: ${report.reporterFullPhone}`}
                          >
                            <span style={{ fontSize: 12 }}>💬</span>
                            WhatsApp
                          </a>
                        ) : (
                          <span style={{ color: '#6c757d', fontSize: 12 }}>No phone</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          background: colors.lightBg,
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {report.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>{report.type}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{report.faculty} - {report.room}</div>
                          <div style={{ fontSize: 12, color: '#6c757d' }}>Floor {report.floor}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>{report.resolvedBy || report.assignedTo}</td>
                      <td style={{ padding: '16px 12px', fontSize: 12, color: '#6c757d' }}>
                        {formatDate(report.resolutionTimestamp)}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        {getStatusBadge(report.status)}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <button
                          onClick={() => handleReviewReport(report)}
                          style={{
                            background: colors.primary,
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.background = colors.secondary}
                          onMouseOut={(e) => e.target.style.background = colors.primary}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>            </div>          )}
        </div>
        </div>

      {/* Review Modal */}
      {showModal && selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '90%',
            maxWidth: 800,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              padding: 24,
              borderBottom: `1px solid ${colors.lightBorder}`
            }}>
              <h2 style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                margin: 0,
                color: colors.darkText
              }}>
                Review Report: {selectedReport.id.slice(-5)}
              </h2>
            </div>            <div style={{ padding: 24 }}>
              {/* Reporter Contact Card */}
              <div style={{ 
                background: 'linear-gradient(135deg, #4361ee 0%, #3f37c9 100%)',
                color: '#fff',
                padding: 20,
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)'
              }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 16, 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
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
                    <div style={{ fontWeight: 500 }}>{selectedReport.userEmail}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Phone Number</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12 
                    }}>
                      <span style={{ fontWeight: 500 }}>
                        {selectedReport.reporterFullPhone || 'N/A'}
                      </span>
                      {selectedReport.reporterFullPhone && (
                        <a
                          href={formatWhatsAppUrl(selectedReport.reporterFullPhone)}
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

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: 24,
                marginBottom: 24
              }}>
                {/* Report Details */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: colors.darkText }}>
                    Report Details
                  </h3>                  <div style={{ background: colors.lightBg, padding: 16, borderRadius: 8 }}>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Reporter:</strong> {selectedReport.userEmail}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Category:</strong> {selectedReport.category}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Type:</strong> {selectedReport.type}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Faculty:</strong> {selectedReport.faculty}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Room:</strong> {selectedReport.room}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Floor:</strong> {selectedReport.floor}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Location:</strong> {formatLocation(selectedReport.location)}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Reported:</strong> {formatDate(selectedReport.timestamp)}
                    </div>
                    <div>
                      <strong>Description:</strong>
                      <div style={{ marginTop: 8, padding: 12, background: '#fff', borderRadius: 4, border: `1px solid ${colors.lightBorder}` }}>
                        {selectedReport.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Details */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: colors.darkText }}>
                    Resolution Details
                  </h3>
                  <div style={{ background: colors.lightBg, padding: 16, borderRadius: 8 }}>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Assigned To:</strong> {selectedReport.assignedTo}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Staff Name:</strong> {selectedReport.assignedStaffName}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Department:</strong> {selectedReport.assignedStaffDepartment || 'N/A'}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Assigned At:</strong> {formatDate(selectedReport.assignedAt)}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Resolved By:</strong> {selectedReport.resolvedBy}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Resolution Date:</strong> {formatDate(selectedReport.resolutionTimestamp)}
                    </div>
                    <div>
                      <strong>Resolution Note:</strong>
                      <div style={{ marginTop: 8, padding: 12, background: '#fff', borderRadius: 4, border: `1px solid ${colors.lightBorder}` }}>
                        {selectedReport.resolutionNote || 'No resolution note provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: colors.darkText }}>
                  Images
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                  {selectedReport.imageUrl && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Original Report Image</h4>
                      <img 
                        src={selectedReport.imageUrl} 
                        alt="Report" 
                        style={{ 
                          width: '100%', 
                          height: 200, 
                          objectFit: 'cover', 
                          borderRadius: 8,
                          border: `1px solid ${colors.lightBorder}`
                        }} 
                      />
                    </div>
                  )}
                  {selectedReport.resolutionImage && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Resolution Image</h4>
                      <img 
                        src={selectedReport.resolutionImage} 
                        alt="Resolution" 
                        style={{ 
                          width: '100%', 
                          height: 200, 
                          objectFit: 'cover', 
                          borderRadius: 8,
                          border: `1px solid ${colors.lightBorder}`
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>              {/* Review Form */}
              <div style={{ background: colors.lightBg, padding: 20, borderRadius: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: colors.darkText }}>
                  Review Decision
                </h3>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setReviewAction('approve')}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: 8,
                        border: reviewAction === 'approve' ? `2px solid #22c55e` : `2px solid ${colors.lightBorder}`,
                        background: reviewAction === 'approve' ? 'rgba(34, 197, 94, 0.1)' : '#fff',
                        color: reviewAction === 'approve' ? '#22c55e' : colors.darkText,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 14
                      }}
                      onMouseEnter={(e) => {
                        if (reviewAction !== 'approve') {
                          e.target.style.borderColor = '#22c55e';
                          e.target.style.background = 'rgba(34, 197, 94, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (reviewAction !== 'approve') {
                          e.target.style.borderColor = colors.lightBorder;
                          e.target.style.background = '#fff';
                        }
                      }}
                    >
                      <span style={{ fontSize: 16 }}>✓</span>
                      Approve Resolution
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction('reject')}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: 8,
                        border: reviewAction === 'reject' ? `2px solid #ef4444` : `2px solid ${colors.lightBorder}`,
                        background: reviewAction === 'reject' ? 'rgba(239, 68, 68, 0.1)' : '#fff',
                        color: reviewAction === 'reject' ? '#ef4444' : colors.darkText,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 14
                      }}
                      onMouseEnter={(e) => {
                        if (reviewAction !== 'reject') {
                          e.target.style.borderColor = '#ef4444';
                          e.target.style.background = 'rgba(239, 68, 68, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (reviewAction !== 'reject') {
                          e.target.style.borderColor = colors.lightBorder;
                          e.target.style.background = '#fff';
                        }
                      }}
                    >
                      <span style={{ fontSize: 16 }}>✗</span>
                      Reject Resolution
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Review Note (Optional)
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Add any comments about your review decision..."
                    style={{
                      width: '100%',
                      minHeight: 80,
                      padding: 12,
                      border: `1px solid ${colors.lightBorder}`,
                      borderRadius: 6,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{
              padding: 24,
              borderTop: `1px solid ${colors.lightBorder}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#fff',
                  color: colors.darkText,
                  border: `1px solid ${colors.lightBorder}`,
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={!reviewAction}
                style={{
                  background: reviewAction ? colors.primary : colors.lightBorder,
                  color: reviewAction ? '#fff' : '#6c757d',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: reviewAction ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .sidebar-menu ul li:hover {
          background: rgba(67, 97, 238, 0.1);
          color: #4361ee;
        }
        
        tbody tr:hover {
          background: rgba(67, 97, 238, 0.02);
        }
      `}</style>
    </div>
  );
};

export default PendingReviews;
