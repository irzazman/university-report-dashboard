import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
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

const SupportTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [response, setResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const docRef = doc(db, 'support_tickets', id); // Changed from 'supportTickets' to 'support_tickets'
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const ticketData = { id: docSnap.id, ...docSnap.data() };
          setTicket(ticketData);
          setStatusUpdate(ticketData.status || 'Open');
        } else {
          console.log("No such document!");
          setTicket(null);
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
        setTicket(null);
      }
      setLoading(false);
    };
    
    if (id) {
      fetchTicket();
    }
  }, [id]);
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

  // Update ticket status
  const handleStatusUpdate = async () => {
    if (!ticket || statusUpdate === ticket.status) return;
    
    try {
      const db = getFirestore();
      const docRef = doc(db, 'support_tickets', id); // Changed from 'supportTickets' to 'support_tickets'
      await updateDoc(docRef, {
        status: statusUpdate,
        updatedAt: new Date()
      });
      
      // Update local state
      setTicket({
        ...ticket,
        status: statusUpdate,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Add response to ticket
  const handleAddResponse = async () => {
    if (!response.trim() || submittingResponse) return;
    
    setSubmittingResponse(true);
    try {
      const db = getFirestore();
      const docRef = doc(db, 'support_tickets', id); // Changed from 'supportTickets' to 'support_tickets'
      
      const newResponse = {
        id: Date.now().toString(),
        message: response.trim(),
        timestamp: new Date(),
        author: 'Admin',
        authorType: 'admin'
      };
      
      await updateDoc(docRef, {
        responses: arrayUnion(newResponse),
        status: 'In Progress',
        updatedAt: new Date(),
        lastResponseAt: new Date()
      });
      
      // Update local state
      setTicket({
        ...ticket,
        responses: [...(ticket.responses || []), newResponse],
        status: 'In Progress',
        updatedAt: new Date(),
        lastResponseAt: new Date()
      });
      
      setResponse('');
    } catch (error) {
      console.error("Error adding response:", error);
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Resolve ticket
  const handleResolveTicket = async () => {
    try {
      const db = getFirestore();
      const docRef = doc(db, 'support_tickets', id); // Changed from 'supportTickets' to 'support_tickets'
      
      await updateDoc(docRef, {
        status: 'Resolved',
        resolvedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update local state
      setTicket({
        ...ticket,
        status: 'Resolved',
        resolvedAt: new Date(),
        updatedAt: new Date()
      });
      setStatusUpdate('Resolved');
    } catch (error) {
      console.error("Error resolving ticket:", error);
    }
  };

  // Memoize the response handler to prevent unnecessary re-renders
  const handleResponseChange = useCallback((e) => {
    setResponse(e.target.value);
  }, []);

  // Memoize the status update handler
  const handleStatusUpdateChange = useCallback((e) => {
    setStatusUpdate(e.target.value);
  }, []);
  if (loading) {
    return (
      <div style={{ 
        padding: '24px 32px', 
        background: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
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
          <p style={{ fontSize: 16, color: colors.darkText }}>Loading ticket details...</p>
        </div>
      </div>
    );
  }
  if (!ticket) {
    return (
      <div style={{ padding: '24px 32px', background: '#f5f7fa' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h2 style={{ fontSize: 24, color: colors.darkText, marginBottom: 16 }}>Ticket Not Found</h2>
          <p style={{ fontSize: 16, color: '#6c757d', marginBottom: 24 }}>The requested support ticket could not be found.</p>
          <button
            onClick={() => navigate('/support-tickets')}
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
            Back to Support Tickets
          </button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: '24px 32px', background: '#f5f7fa' }}>
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
            Support Ticket 
            <span style={{ 
              fontSize: 18,
              fontWeight: 500,
              color: '#6c757d',
              marginLeft: 12,
              background: colors.lightBg,
              padding: '4px 10px',
              borderRadius: 6
            }}>#{ticket.id?.slice(-8) || 'Unknown'}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/support-tickets')}
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
              ← Back to Tickets
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Left column - Ticket details */}
          <div style={{ flex: '1 1 500px' }}>
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
                  <div style={{ fontSize: 14, color: '#6c757d', marginBottom: 4 }}>Current Status</div>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 500,
                    background: ticket.status?.toLowerCase() === 'resolved' 
                      ? 'rgba(76, 201, 240, 0.1)' 
                      : ticket.status?.toLowerCase() === 'in progress'
                        ? 'rgba(72, 149, 239, 0.1)'
                        : 'rgba(247, 37, 133, 0.1)',
                    color: ticket.status?.toLowerCase() === 'resolved' 
                      ? colors.success
                      : ticket.status?.toLowerCase() === 'in progress'
                        ? colors.info
                        : colors.warning
                  }}>
                    {ticket.status || 'Open'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select 
                    value={statusUpdate} 
                    onChange={handleStatusUpdateChange}
                    style={{ 
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: `1px solid ${colors.lightBorder}`,
                      fontSize: 14
                    }}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
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
              
              {/* Ticket Info */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Submitted By</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14
                  }}>{ticket.userEmail || '-'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Related Report</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14
                  }}>
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
                    ) : '-'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Created</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14
                  }}>{formatTimestamp(ticket.createdAt)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 6, 
                    color: colors.darkText 
                  }}>Category</div>
                  <div style={{ 
                    padding: '12px 16px',
                    background: colors.lightBg,
                    borderRadius: 8,
                    fontSize: 14
                  }}>{ticket.reportCategory || '-'}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  marginBottom: 6, 
                  color: colors.darkText 
                }}>Issue Description</div>
                <div style={{ 
                  padding: '12px 16px',
                  background: colors.lightBg,
                  borderRadius: 8,
                  fontSize: 14,
                  minHeight: 80,
                  whiteSpace: 'pre-wrap'
                }}>{ticket.issueDescription || ticket.description || '-'}</div>
              </div>

              {/* Quick Actions */}
              {ticket.status !== 'Resolved' && (
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={handleResolveTicket}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: colors.success,
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(76, 201, 240, 0.3)'
                    }}
                  >
                    ✓ Mark as Resolved
                  </button>
                </div>
              )}
            </Card>

            {/* Response Section */}
            <Card title="Conversation">
              <div style={{ marginBottom: 20, maxHeight: '400px', overflowY: 'auto' }}>
                {ticket.responses && ticket.responses.length > 0 ? (
                  ticket.responses.map((resp, index) => (
                    <div key={resp.id || index} style={{
                      background: resp.authorType === 'admin' ? colors.lightBg : '#fff',
                      border: `1px solid ${colors.lightBorder}`,
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12
                    }}>
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8
                      }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: colors.darkText,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          {resp.authorType === 'admin' ? '👤' : '👨‍🎓'} 
                          {resp.author || 'User'}
                          {resp.authorType === 'admin' && (
                            <span style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 10,
                              background: colors.primary,
                              color: '#fff'
                            }}>ADMIN</span>
                          )}
                        </span>
                        <span style={{ fontSize: 12, color: '#6c757d' }}>
                          {formatTimestamp(resp.timestamp)}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {resp.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: 40,
                    color: '#6c757d'
                  }}>
                    No responses yet
                  </div>
                )}
              </div>

              {/* Add Response */}
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: colors.darkText
                }}>Add Response</div>
                <textarea
                  key="response-textarea" // Add key to prevent re-creation
                  value={response}
                  onChange={handleResponseChange}
                  placeholder="Type your response to help resolve this ticket..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.lightBorder}`,
                    fontSize: 14,
                    minHeight: 120,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ marginTop: 12, textAlign: 'right' }}>
                  <button
                    onClick={handleAddResponse}
                    disabled={!response.trim() || submittingResponse}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: response.trim() && !submittingResponse ? colors.primary : '#e9ecef',
                      color: response.trim() && !submittingResponse ? '#fff' : '#6c757d',
                      fontWeight: 500,
                      cursor: response.trim() && !submittingResponse ? 'pointer' : 'not-allowed',
                      boxShadow: response.trim() && !submittingResponse ? '0 2px 8px rgba(67, 97, 238, 0.2)' : 'none'                    }}
                  >
                    {submittingResponse ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

export default SupportTicketDetail;