import React, { useState } from 'react';
import './Dashboard.css';
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

const Support = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState('faqs'); // Keep this for consistency but only show FAQs
  
  // Card component for better design consistency
  const Card = ({ title, children, className = "", style = {} }) => (
    <div 
      className={`support-card ${className}`}
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
    // FAQ data
  const faqs = [
    {
      question: 'How do I update the status of a report?',
      answer: 'To update a report status, navigate to the report details page by clicking on a report ID. On the details page, you\'ll find a dropdown menu to change the status and an "Update Status" button to save your changes.'
    },
    {
      question: 'How can I export reports data?',
      answer: 'You can export reports as PDF by visiting the Reports page and clicking the "Export PDF" button in the top-right corner. This will generate a PDF containing all reports matching your current filters.'
    },
    {
      question: 'How do I filter reports by category?',
      answer: 'On both the Dashboard and Reports pages, you\'ll find dropdown filters for Category and Type. Select your desired category from the dropdown to filter the reports.'
    },
    {
      question: 'Can I sort the reports table?',
      answer: 'Yes, you can sort the reports table by clicking on any column header. Click once to sort ascending and again to sort descending.'
    },
    {
      question: 'How do I view analytics for specific date ranges?',
      answer: 'On the Analytics page, use the date range selector to choose your desired timeframe. The charts and data will update automatically to show information for that period.'
    },
    {
      question: 'How do I manage support tickets?',
      answer: 'Navigate to the Support Tickets page to view and manage all student support tickets. You can view ticket details, respond to tickets, and update their status from there.'
    },
    {
      question: 'How do I assign reports to staff members?',
      answer: 'On the Reports page or Dashboard, click the "Assign" button next to any unassigned report. Select a staff member from the dropdown and click "Assign Report". You can also reassign reports to different staff members if needed.'
    }
  ];
  return (
    <div style={{ background: '#f5f7fa' }}>
        <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 28
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.darkText }}>Support Center</h1>
        </header>
        
        {/* FAQs Section - Always shown */}
        <div className="faqs-section">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 16, color: colors.darkText }}>
                Find answers to commonly asked questions about the University Report Dashboard.
              </p>
            </div>
            
            <div style={{ marginTop: 24 }}>
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  style={{ 
                    marginBottom: 20, 
                    padding: 16, 
                    background: colors.lightBg, 
                    borderRadius: 8,
                    borderLeft: `3px solid ${colors.primary}`
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: colors.darkText 
                  }}>
                    {faq.question}
                  </h4>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#52575c' }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            
            <div style={{ 
              marginTop: 32, 
              padding: 16, 
              background: 'rgba(67, 97, 238, 0.05)', 
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                background: 'rgba(67, 97, 238, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>💡</div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: 500, color: colors.darkText }}>
                  Need additional help?
                </p>
                <p style={{ margin: 0, fontSize: 14, color: '#52575c' }}>
                  For more specific questions or technical support, please contact the system administrator or IT support team directly.
                </p>
              </div>
            </div>
          </Card>        </div>
    </div>
  );
};

export default Support;