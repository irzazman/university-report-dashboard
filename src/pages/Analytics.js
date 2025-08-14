import React, { useEffect, useRef, useState } from 'react';
import './Dashboard.css';
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Modern color palette
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

const Analytics = () => {
  const [reports, setReports] = useState([]);
  const [dateFilter, setDateFilter] = useState('week');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [hoveredChart, setHoveredChart] = useState(null);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  // eslint-disable-next-line no-unused-vars
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarView, setCalendarView] = useState({
    fromMonth: new Date().getMonth(),
    fromYear: new Date().getFullYear(),
    toMonth: new Date().getMonth(),
    toYear: new Date().getFullYear()
  });
  // eslint-disable-next-line no-unused-vars
  const [selectedDates, setSelectedDates] = useState({
    start: null,
    end: null
  });
  const navigate = useNavigate();

  // Chart refs for exporting images
  const pieRef = useRef();
  const doughnutRef = useRef();
  const lineRef = useRef();
  const barLocationRef = useRef();
  const barTopIssuesRef = useRef();
  useEffect(() => {
    const db = getFirestore();
    const reportsRef = collection(db, 'reports');
    const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
      const reportsArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Normalize category to fix duplicates (making all lowercase for comparison)
        category: doc.data().category ? doc.data().category.toLowerCase() : null
      }));
      setReports(reportsArray);
      setLastUpdated(new Date());
    });
    return () => unsubscribe();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (isAutoRefresh) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh]);
  // Helper: filter by date
  const filterByDate = (report) => {
    if (!report.timestamp?.toDate) return false;
    const date = report.timestamp.toDate();
    const now = new Date();
    
    if (dateFilter === 'all') return true;
    
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo && date <= now;
    }
    
    if (dateFilter === 'month') {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    
    if (dateFilter === 'year') {
      return date.getFullYear() === now.getFullYear();
    }
    
    if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);
      // Set endDate to end of day
      endDate.setHours(23, 59, 59, 999);
      return date >= startDate && date <= endDate;
    }
    
    return true;
  };

  // Filtered reports - normalize category for comparison to prevent duplicates
  const filteredReports = reports.filter(r =>
    filterByDate(r) &&
    (locationFilter === 'all' || r.category === locationFilter.toLowerCase()) &&
    (categoryFilter === 'all' || r.type === categoryFilter) &&
    (statusFilter === 'all' || r.status === statusFilter)
  );

  // KPI Metrics
  const totalReports = filteredReports.length;
  const openReports = filteredReports.filter(r => r.status?.toLowerCase() !== 'resolved').length;
  const resolvedReports = filteredReports.filter(r => r.status?.toLowerCase() === 'resolved').length;
  const now = new Date();
  const reportsThisWeek = filteredReports.filter(r => {
    if (!r.timestamp?.toDate) return false;
    const date = r.timestamp.toDate();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo && date <= now;
  }).length;
  const reportsThisMonth = filteredReports.filter(r => {
    if (!r.timestamp?.toDate) return false;
    const date = r.timestamp.toDate();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  // Chart Data
  // Reports by Category
  const categoryCounts = {};
  filteredReports.forEach(r => {
    if (r.type) categoryCounts[r.type] = (categoryCounts[r.type] || 0) + 1;
  });
  const categoryLabels = Object.keys(categoryCounts);
  const categoryValues = Object.values(categoryCounts);
  const categoryTotal = categoryValues.reduce((a, b) => a + b, 0);
  const categoryData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryValues,
      backgroundColor: colors.chartColors,
    }]
  };

  // Reports by Status
  const statusCounts = {};
  filteredReports.forEach(r => {
    if (r.status) statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  const statusLabels = Object.keys(statusCounts);
  const statusValues = Object.values(statusCounts);
  const statusTotal = statusValues.reduce((a, b) => a + b, 0);
  const statusData = {
    labels: statusLabels,
    datasets: [{
      data: statusValues,
      backgroundColor: colors.chartColors.slice(0, statusLabels.length),
    }]
  };

  // Reports Over Time (by day)
  const dateCounts = {};
  filteredReports.forEach(r => {
    if (r.timestamp?.toDate) {
      const d = r.timestamp.toDate();
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      dateCounts[key] = (dateCounts[key] || 0) + 1;
    }
  });
  const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
  const timeData = {
    labels: sortedDates,
    datasets: [{
      label: 'Reports',
      data: sortedDates.map(date => dateCounts[date]),
      fill: false,
      borderColor: colors.primary,
      backgroundColor: colors.primary,
      tension: 0.2,
    }]
  };

  // Reports by Location (category field) - fix duplicates with normalization
  const locationCounts = {};
  filteredReports.forEach(r => {
    if (r.category) {
      // Capitalize first letter for display purposes
      const displayCategory = r.category.charAt(0).toUpperCase() + r.category.slice(1);
      locationCounts[displayCategory] = (locationCounts[displayCategory] || 0) + 1;
    }
  });
  const locationLabels = Object.keys(locationCounts);
  const locationValues = Object.values(locationCounts);
  const locationTotal = locationValues.reduce((a, b) => a + b, 0);
  const locationData = {
    labels: locationLabels,
    datasets: [{
      data: locationValues,
      backgroundColor: colors.chartColors.slice(0, locationLabels.length),
    }]
  };

  // Top Issues (most common types)
  const topIssues = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topIssuesData = {
    labels: topIssues.map(([type]) => type),
    datasets: [{
      label: 'Count',
      data: topIssues.map(([, count]) => count),
      backgroundColor: colors.primary,
    }]
  };

  // Dropdown options - normalize categories to prevent duplicates
  const uniqueLocations = Array.from(new Set(reports.map(r => {
    if (!r.category) return null;
    // Capitalize first letter for display
    return r.category.charAt(0).toUpperCase() + r.category.slice(1);
  }))).filter(Boolean);
  
  const uniqueCategories = Array.from(new Set(reports.map(r => r.type))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(reports.map(r => r.status))).filter(Boolean);

  // Trends/Insights (optional)
  const overdueReports = filteredReports.filter(r => {
    if (!r.timestamp?.toDate || r.status?.toLowerCase() === 'resolved') return false;
    const date = r.timestamp.toDate();
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  });

  // Export to PDF (with charts) - improved layout
  const handleExportPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 20;

    // Title with logo/header
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, 210, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('University Report System - Analytics', 14, 8);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.text('Analytics Report', 14, y);
    
    // Date of export
    const today = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${today}`, 14, y + 6);
    y += 14;

    // KPI Summary Table
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Key Metrics', 14, y);
    y += 2;
    
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Total Reports', totalReports],
        ['Open Reports', openReports],
        ['Resolved Reports', resolvedReports],
        ['This Week', reportsThisWeek],
        ['This Month', reportsThisMonth],
      ],
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
    y = doc.lastAutoTable.finalY + 10;
    
    // Trends & Insights - moved above charts as requested
    doc.setFontSize(14);
    doc.text('Trends & Insights', 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`• ${overdueReports.length} overdue report(s) (open for more than 7 days)`, 18, y);
    y += 6;
    if (topIssues.length > 0) {
      doc.text(`• Top issue: ${topIssues[0][0]} (${topIssues[0][1]} reports)`, 18, y);
      y += 6;
    }
    if (resolvedReports > 0) {
      doc.text(`• ${resolvedReports} reports resolved in selected period`, 18, y);
      y += 10;
    }

    // Helper to add chart image with section title - improved layout
    const addChartImage = async (chartRef, title) => {
      const chart = chartRef.current;
      if (chart && chart.toBase64Image) {
        if (y + 70 > 270) { // Avoid bottom overflow with more space
          doc.addPage();
          y = 20; // More margin at top of new page
        }
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 14, y);
        y += 6; // More space between title and chart
        const imgData = chart.toBase64Image();
        
        // Add a white background for the chart
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, y, 180, 60, 3, 3, 'F');
        
        // Add border
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(14, y, 180, 60, 3, 3, 'S');
        
        // Add chart with better sizing
        doc.addImage(imgData, 'PNG', 20, y + 5, 168, 50);
        y += 70; // More space after chart
      }
    };

    // Add charts as images
    await addChartImage(pieRef, 'Reports by Category');
    await addChartImage(doughnutRef, 'Reports by Status');
    
    // Add a new page for remaining charts for better spacing
    doc.addPage();
    y = 20;
    
    await addChartImage(lineRef, 'Reports Over Time');
    await addChartImage(barLocationRef, 'Reports by Location');
    await addChartImage(barTopIssuesRef, 'Top Issues');

    // Data Tables - with better spacing and layout
    const addTableSection = (title, head, body) => {
      if (y + 40 > 270) { // More space to ensure tables don't get cut off
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text(title, 14, y);
      autoTable(doc, {
        head: [head],
        body,
        startY: y + 6,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 10 },
        headStyles: { 
          fillColor: [67, 97, 238],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        theme: 'grid',
        tableWidth: 100
      });
      y = doc.lastAutoTable.finalY + 10;
    };

    addTableSection(
      'Reports by Category',
      ['Category', 'Count'],
      Object.entries(categoryCounts).map(([cat, count]) => [cat, count])
    );
    addTableSection(
      'Reports by Status',
      ['Status', 'Count'],
      Object.entries(statusCounts).map(([status, count]) => [status, count])
    );
    addTableSection(
      'Top Issues',
      ['Top Issue', 'Count'],
      topIssues.map(([type, count]) => [type, count])
    );

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, 285, { align: 'center' });
      doc.text('University Report System', 14, 285);
    }

    doc.save('analytics-report.pdf');
  };

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    let csv = 'Metric,Value\n';
    csv += `Total Reports,${totalReports}\n`;
    csv += `Open Reports,${openReports}\n`;
    csv += `Resolved Reports,${resolvedReports}\n`;
    csv += `This Week,${reportsThisWeek}\n`;
    csv += `This Month,${reportsThisMonth}\n\n`;

    csv += 'Category,Count\n';
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      csv += `${cat},${count}\n`;
    });
    csv += '\nStatus,Count\n';
    Object.entries(statusCounts).forEach(([status, count]) => {
      csv += `${status},${count}\n`;
    });
    csv += '\nTop Issue,Count\n';
    topIssues.forEach(([type, count]) => {
      csv += `${type},${count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Enhanced chart options with interactivity
  const getPieDoughnutOptions = (labels, values, total, chartType) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: { 
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        },
        onHover: (event, legendItem, legend) => {
          legend.chart.canvas.style.cursor = 'pointer';
        },
        onLeave: (event, legendItem, legend) => {
          legend.chart.canvas.style.cursor = 'default';
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} reports (${percentage}%)`;
          },
          afterLabel: function(context) {
            return selectedDataPoint && selectedDataPoint.chartType === chartType ? 
              'Click to clear filter' : 'Click to filter by this category';
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: { 
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          if (!total) return '';
          const percent = ((value / total) * 100).toFixed(1);
          return `${percent}%`;
        },
        textStrokeColor: 'rgba(0,0,0,0.3)',
        textStrokeWidth: 2,
        textShadowBlur: 5,
        textShadowColor: 'rgba(0,0,0,0.3)'
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const clickedLabel = labels[elementIndex];
        
        // Handle drill-down filtering
        if (chartType === 'category') {
          if (selectedDataPoint?.value === clickedLabel && selectedDataPoint?.chartType === 'category') {
            // Clear filter if same item clicked
            setCategoryFilter('all');
            setSelectedDataPoint(null);
          } else {
            setCategoryFilter(clickedLabel);
            setSelectedDataPoint({ value: clickedLabel, chartType: 'category' });
          }
        } else if (chartType === 'status') {
          if (selectedDataPoint?.value === clickedLabel && selectedDataPoint?.chartType === 'status') {
            setStatusFilter('all');
            setSelectedDataPoint(null);
          } else {
            setStatusFilter(clickedLabel);
            setSelectedDataPoint({ value: clickedLabel, chartType: 'status' });
          }
        } else if (chartType === 'location') {
          if (selectedDataPoint?.value === clickedLabel && selectedDataPoint?.chartType === 'location') {
            setLocationFilter('all');
            setSelectedDataPoint(null);
          } else {
            setLocationFilter(clickedLabel);
            setSelectedDataPoint({ value: clickedLabel, chartType: 'location' });
          }
        }
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
      if (elements.length > 0) {
        setHoveredChart(chartType);
      } else {
        setHoveredChart(null);
      }
    }
  });
  const getBarOptions = (labels, values, total, chartType) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} reports (${percentage}%)`;
          },
          afterLabel: function(context) {
            return 'Click to filter by this category';
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#212529',
        font: { 
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          if (!total) return '';
          const percent = ((value / total) * 100).toFixed(1);
          return `${percent}%`;
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const clickedLabel = labels[elementIndex];
        
        if (chartType === 'location') {
          if (selectedDataPoint?.value === clickedLabel && selectedDataPoint?.chartType === 'location') {
            setLocationFilter('all');
            setSelectedDataPoint(null);
          } else {
            setLocationFilter(clickedLabel);
            setSelectedDataPoint({ value: clickedLabel, chartType: 'location' });
          }
        }
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }    }
  });

  // Enhanced line chart options
  const getLineOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Reports: ${context.raw}`;
          },
          title: function(context) {
            return `Date: ${context[0].label}`;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  });

  // Card component for better design consistency
  const Card = ({ title, children, className = "", style = {} }) => (
    <div 
      className={`analytics-card ${className}`}
      style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 24, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        ...style 
      }}
    >
      <h3 style={{ 
        marginBottom: 16, 
        fontSize: 18,
        fontWeight: 600,
        color: colors.darkText 
      }}>{title}</h3>
      {children}
    </div>
  );
  return (
    <div style={{ background: '#f5f7fa' }}><header className="dashboard-header" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 32
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.darkText, margin: 0 }}>
              Analytics Dashboard
            </h1>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 16, 
              marginTop: 8 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontSize: 14,
                color: '#6c757d'
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isAutoRefresh ? '#28a745' : '#dc3545'
                }}></div>
                {isAutoRefresh ? 'Live Updates' : 'Static View'}
              </div>
              <div style={{ fontSize: 14, color: '#6c757d' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              {selectedDataPoint && (
                <div style={{
                  background: colors.primary,
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  Filtered by: {selectedDataPoint.value}
                  <button
                    onClick={() => {
                      setSelectedDataPoint(null);
                      setCategoryFilter('all');
                      setStatusFilter('all');
                      setLocationFilter('all');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      marginLeft: 8,
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `2px solid ${isAutoRefresh ? colors.success : colors.warning}`,
                background: isAutoRefresh ? colors.success : '#fff',
                color: isAutoRefresh ? '#fff' : colors.warning,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 12,
                transition: 'all 0.2s'
              }}
            >
              {isAutoRefresh ? '⏸️ Pause' : '▶️ Resume'} Updates
            </button>
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
            <button
              className="export-btn"
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: colors.success,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(76, 201, 240, 0.2)',
                transition: 'all 0.2s'
              }}
              onClick={handleExportExcel}
            >
              <span style={{ marginRight: 8 }}>📊</span> Export Excel
            </button>
          </div>
        </header>

        <section className="reports-section">          {/* KPI Cards with Enhanced Interactivity */}
          <div className="summary-cards" style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 20,
            marginBottom: 32 
          }}>
            <Card title="" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(67, 97, 238, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
              onClick={() => navigate('/reports')}
            >
              <div style={{ 
                padding: '16px 24px', 
                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                color: '#fff'
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>Total Reports</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700, 
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: 12 }}>{totalReports}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>reports</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                  Click to view all reports
                </div>
              </div>
            </Card>
            
            <Card title="" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(72, 149, 239, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
              onClick={() => {
                setStatusFilter('all');
                setSelectedDataPoint({ value: 'open', chartType: 'custom' });
                navigate('/reports');
              }}
            >
              <div style={{ 
                padding: '16px 24px', 
                background: `linear-gradient(45deg, ${colors.info}, ${colors.success})`,
                color: '#fff'
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>Open Reports</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700, 
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: 12 }}>{openReports}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>pending</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                  Click to view open reports
                </div>
              </div>
            </Card>
            
            <Card title="" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(76, 201, 240, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
              onClick={() => {
                setStatusFilter('Resolved');
                setSelectedDataPoint({ value: 'Resolved', chartType: 'status' });
              }}
            >
              <div style={{ 
                padding: '16px 24px', 
                background: `linear-gradient(45deg, ${colors.success}, ${colors.info})`,
                color: '#fff'
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>Resolved Reports</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700, 
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: 12 }}>{resolvedReports}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>completed</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                  Click to filter resolved reports
                </div>
              </div>
            </Card>
              <Card title="" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(247, 37, 133, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
              onClick={() => {
                setDateFilter('week');
                setShowCustomDatePicker(false);
                setCustomDateRange({ startDate: '', endDate: '' });
              }}
            >
              <div style={{ 
                padding: '16px 24px', 
                background: `linear-gradient(45deg, ${colors.warning}, ${colors.accent})`,
                color: '#fff'
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>This Week</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700, 
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: 12 }}>{reportsThisWeek}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>new</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                  Click to filter this week
                </div>
              </div>
            </Card>
            
            <Card title="" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(86, 11, 173, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
              onClick={() => {
                setDateFilter('month');
                setShowCustomDatePicker(false);
                setCustomDateRange({ startDate: '', endDate: '' });
              }}
            >
              <div style={{ 
                padding: '16px 24px', 
                background: `linear-gradient(45deg, ${colors.accent}, ${colors.primary})`,
                color: '#fff'
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>This Month</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700, 
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: 12 }}>{reportsThisMonth}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>total</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                  Click to filter this month
                </div>
              </div>
            </Card>
          </div>

          {/* Trends & Insights - Moved above charts as requested */}
          <Card 
            title="Trends & Insights" 
            style={{ marginBottom: 32 }}
          >
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <li style={{
                background: colors.lightBg,
                padding: '16px 24px',
                borderRadius: 8,
                flex: '1 1 200px',
                minWidth: 200
              }}>
                <div style={{ fontSize: 14, color: '#6c757d' }}>Overdue Reports</div>
                <div style={{ 
                  fontSize: 24, 
                  fontWeight: 600, 
                  color: overdueReports.length > 0 ? colors.warning : colors.success,
                  marginTop: 8
                }}>
                  {overdueReports.length} reports
                </div>
                <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                  Open for more than 7 days
                </div>
              </li>
              
              {topIssues.length > 0 && (
                <li style={{
                  background: colors.lightBg,
                  padding: '16px 24px',
                  borderRadius: 8,
                  flex: '1 1 200px',
                  minWidth: 200
                }}>
                  <div style={{ fontSize: 14, color: '#6c757d' }}>Top Issue</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: colors.primary, marginTop: 8 }}>
                    {topIssues[0][0]}
                  </div>
                  <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                    {topIssues[0][1]} reports
                  </div>
                </li>
              )}
              
              {resolvedReports > 0 && (
                <li style={{
                  background: colors.lightBg,
                  padding: '16px 24px',
                  borderRadius: 8,
                  flex: '1 1 200px',
                  minWidth: 200
                }}>
                  <div style={{ fontSize: 14, color: '#6c757d' }}>Resolved Reports</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: colors.success, marginTop: 8 }}>
                    {resolvedReports} reports
                  </div>
                  <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                    In selected period
                  </div>
                </li>
              )}
            </ul>          </Card>          {/* Enhanced Filters */}
          <Card title="Filters" style={{ marginBottom: 32 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20,
              marginBottom: 16
            }}>              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontSize: 14, 
                  fontWeight: 600,
                  color: colors.darkText
                }}>
                  📅 Time Period
                </label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    if (e.target.value === 'custom') {
                      setShowDatePicker(true);
                    } else {
                      setShowDatePicker(false);
                      setCustomDateRange({ startDate: '', endDate: '' });
                    }
                  }} 
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: `2px solid ${dateFilter !== 'week' ? colors.primary : colors.lightBorder}`,
                    background: dateFilter !== 'week' ? 'rgba(67, 97, 238, 0.05)' : '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontSize: 14,
                    transition: 'all 0.2s'
                  }}
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontSize: 14, 
                  fontWeight: 600,
                  color: colors.darkText
                }}>
                  📍 Location
                </label>
                <select 
                  value={locationFilter} 
                  onChange={e => setLocationFilter(e.target.value)} 
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: `2px solid ${locationFilter !== 'all' ? colors.success : colors.lightBorder}`,
                    background: locationFilter !== 'all' ? 'rgba(76, 201, 240, 0.05)' : '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontSize: 14,
                    transition: 'all 0.2s'
                  }}
                >
                  <option value="all">All Locations</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontSize: 14, 
                  fontWeight: 600,
                  color: colors.darkText
                }}>
                  🏷️ Category
                </label>
                <select 
                  value={categoryFilter} 
                  onChange={e => setCategoryFilter(e.target.value)} 
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: `2px solid ${categoryFilter !== 'all' ? colors.info : colors.lightBorder}`,
                    background: categoryFilter !== 'all' ? 'rgba(72, 149, 239, 0.05)' : '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontSize: 14,
                    transition: 'all 0.2s'
                  }}
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontSize: 14, 
                  fontWeight: 600,
                  color: colors.darkText
                }}>
                  📊 Status
                </label>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)} 
                  style={{ 
                    width: '100%',
                    padding: '12px 16px', 
                    borderRadius: 8,
                    border: `2px solid ${statusFilter !== 'all' ? colors.warning : colors.lightBorder}`,
                    background: statusFilter !== 'all' ? 'rgba(247, 37, 133, 0.05)' : '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontSize: 14,
                    transition: 'all 0.2s'
                  }}
                >
                  <option value="all">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date range fields - moved outside the custom date range box */}
            {dateFilter === 'custom' && showDatePicker && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                width: '90%',
                maxWidth: '900px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{ fontWeight: 500 }}>
                    {customDateRange.startDate ? new Date(customDateRange.startDate).toLocaleDateString() : 'Select start date'} 
                    {' — '} 
                    {customDateRange.endDate ? new Date(customDateRange.endDate).toLocaleDateString() : 'Select end date'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setCustomDateRange({ startDate: '', endDate: '' });
                        setSelectedDates({ start: null, end: null });
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: colors.primary,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      Clear filters
                    </button>
                    <button
                      onClick={() => {
                        setShowDatePicker(false);
                        setDateFilter('week');
                        setCustomDateRange({ startDate: '', endDate: '' });
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: colors.darkText,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (customDateRange.startDate && customDateRange.endDate) {
                          setShowDatePicker(false);
                        }
                      }}
                      disabled={!customDateRange.startDate || !customDateRange.endDate}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: customDateRange.startDate && customDateRange.endDate ? colors.primary : colors.lightBorder,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: customDateRange.startDate && customDateRange.endDate ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  padding: '16px',
                  gap: 24,
                  flexDirection: window.innerWidth < 768 ? 'column' : 'row'
                }}>
                  {/* From Date Calendar */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 12, fontWeight: 500 }}>From</div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: 12,
                      alignItems: 'center'
                    }}>
                      <select 
                        value={calendarView.fromMonth} 
                        onChange={(e) => setCalendarView({...calendarView, fromMonth: parseInt(e.target.value)})}
                        style={{ 
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          flex: 1
                        }}
                      >
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                          .map((month, idx) => (
                            <option key={month} value={idx}>{month}</option>
                          ))
                        }
                      </select>
                      
                      <select 
                        value={calendarView.fromYear} 
                        onChange={(e) => setCalendarView({...calendarView, fromYear: parseInt(e.target.value)})}
                        style={{ 
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          marginLeft: 8
                        }}
                      >
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      {/* Calendar Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 500, marginBottom: 8 }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                          <div key={day}>{day}</div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                        {(() => {
                          const days = [];
                          const firstDay = new Date(calendarView.fromYear, calendarView.fromMonth, 1);
                          const lastDay = new Date(calendarView.fromYear, calendarView.fromMonth + 1, 0);
                          const daysInMonth = lastDay.getDate();
                          
                          // Add empty cells for days before first of month
                          for (let i = 0; i < firstDay.getDay(); i++) {
                            days.push(<div key={`empty-start-${i}`}></div>);
                          }
                          
                          // Add days of month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(calendarView.fromYear, calendarView.fromMonth, day);
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = dateStr === customDateRange.startDate;
                            
                            days.push(
                              <div 
                                key={dateStr}
                                onClick={() => {
                                  setCustomDateRange(prev => ({ 
                                    ...prev, startDate: dateStr 
                                  }));
                                  setSelectedDates(prev => ({
                                    ...prev, start: date
                                  }));
                                }}
                                style={{
                                  padding: '8px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  borderRadius: 4,
                                  background: isSelected ? colors.primary : 'transparent',
                                  color: isSelected ? 'white' : 'inherit',
                                  border: isSelected ? 'none' : '1px solid #eee'
                                }}
                              >
                                {day}
                              </div>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* To Date Calendar */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 12, fontWeight: 500 }}>To</div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: 12,
                      alignItems: 'center'
                    }}>
                      <select 
                        value={calendarView.toMonth} 
                        onChange={(e) => setCalendarView({...calendarView, toMonth: parseInt(e.target.value)})}
                        style={{ 
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          flex: 1
                        }}
                      >
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                          .map((month, idx) => (
                            <option key={month} value={idx}>{month}</option>
                          ))
                        }
                      </select>
                      
                      <select 
                        value={calendarView.toYear} 
                        onChange={(e) => setCalendarView({...calendarView, toYear: parseInt(e.target.value)})}
                        style={{ 
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          marginLeft: 8
                        }}
                      >
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      {/* Calendar Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 500, marginBottom: 8 }}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                          <div key={day}>{day}</div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                        {(() => {
                          const days = [];
                          const firstDay = new Date(calendarView.toYear, calendarView.toMonth, 1);
                          const lastDay = new Date(calendarView.toYear, calendarView.toMonth + 1, 0);
                          const daysInMonth = lastDay.getDate();
                          
                          // Add empty cells for days before first of month
                          for (let i = 0; i < firstDay.getDay(); i++) {
                            days.push(<div key={`empty-end-${i}`}></div>);
                          }
                          
                          // Add days of month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(calendarView.toYear, calendarView.toMonth, day);
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = dateStr === customDateRange.endDate;
                            
                            days.push(
                              <div 
                                key={dateStr}
                                onClick={() => {
                                  if (!customDateRange.startDate || date >= new Date(customDateRange.startDate)) {
                                    setCustomDateRange(prev => ({ 
                                      ...prev, endDate: dateStr 
                                    }));
                                    setSelectedDates(prev => ({
                                      ...prev, end: date
                                    }));
                                  }
                                }}
                                style={{
                                  padding: '8px',
                                  textAlign: 'center',
                                  cursor: !customDateRange.startDate || date >= new Date(customDateRange.startDate) ? 'pointer' : 'not-allowed',
                                  borderRadius: 4,
                                  background: isSelected ? colors.primary : 'transparent',
                                  color: isSelected ? 'white' : (!customDateRange.startDate || date >= new Date(customDateRange.startDate)) ? 'inherit' : '#ccc',
                                  border: isSelected ? 'none' : '1px solid #eee',
                                  opacity: !customDateRange.startDate || date >= new Date(customDateRange.startDate) ? 1 : 0.5
                                }}
                              >
                                {day}
                              </div>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick range selections */}
                <div style={{
                  borderTop: '1px solid #eee',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const todayStr = today.toISOString().split('T')[0];
                      setCustomDateRange({
                        startDate: todayStr,
                        endDate: todayStr
                      });
                      setSelectedDates({
                        start: today,
                        end: today
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Today
                  </button>
                  
                  <button
                    onClick={() => {
                      const today = new Date();
                      const threeDaysAgo = new Date();
                      threeDaysAgo.setDate(today.getDate() - 3);
                      setCustomDateRange({
                        startDate: threeDaysAgo.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0]
                      });
                      setSelectedDates({
                        start: threeDaysAgo,
                        end: today
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Last 3 Days
                  </button>
                  
                  <button
                    onClick={() => {
                      const today = new Date();
                      const sevenDaysAgo = new Date();
                      sevenDaysAgo.setDate(today.getDate() - 7);
                      setCustomDateRange({
                        startDate: sevenDaysAgo.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0]
                      });
                      setSelectedDates({
                        start: sevenDaysAgo,
                        end: today
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Last 7 Days
                  </button>
                  
                  <button
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(today.getDate() - 30);
                      setCustomDateRange({
                        startDate: thirtyDaysAgo.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0]
                      });
                      setSelectedDates({
                        start: thirtyDaysAgo,
                        end: today
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>
            )}

            {/* Show the selected range summary if custom date is selected but date picker is hidden */}
            {dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate && !showDatePicker && (
              <div style={{
                margin: '16px 0',
                padding: '12px 16px',
                background: colors.lightBg,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>Selected Range: </span>
                  {new Date(customDateRange.startDate).toLocaleDateString()} - {new Date(customDateRange.endDate).toLocaleDateString()}
                </div>
                <button
                  onClick={() => setShowDatePicker(true)}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    border: `1px solid ${colors.primary}`,
                    borderRadius: 4,
                    color: colors.primary,
                    cursor: 'pointer'
                  }}
                >
                  Change
                </button>
              </div>
            )}
            
            {/* Remove the old custom date picker box */}
            {/* Quick Filter Actions */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              flexWrap: 'wrap',
              paddingTop: 16,
              marginTop: 16,
              borderTop: `1px solid ${colors.lightBorder}`
            }}>              <button
                onClick={() => {
                  setDateFilter('all');
                  setLocationFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setSelectedDataPoint(null);
                  setShowCustomDatePicker(false);
                  setCustomDateRange({ startDate: '', endDate: '' });
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: colors.lightBg,
                  color: colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.primary;
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = colors.lightBg;
                  e.target.style.color = colors.darkText;
                }}
              >
                🔄 Clear All Filters
              </button>
              
              <button
                onClick={() => {
                  setDateFilter('week');
                  setShowCustomDatePicker(false);
                  setCustomDateRange({ startDate: '', endDate: '' });
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: dateFilter === 'week' ? colors.primary : colors.lightBg,
                  color: dateFilter === 'week' ? '#fff' : colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
              >
                📅 This Week
              </button>
              
              <button
                onClick={() => {
                  setDateFilter('month');
                  setShowCustomDatePicker(false);
                  setCustomDateRange({ startDate: '', endDate: '' });
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: dateFilter === 'month' ? colors.info : colors.lightBg,
                  color: dateFilter === 'month' ? '#fff' : colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
              >
                📅 This Month
              </button>
              
              <button
                onClick={() => {
                  setDateFilter('year');
                  setShowCustomDatePicker(false);
                  setCustomDateRange({ startDate: '', endDate: '' });
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: dateFilter === 'year' ? colors.secondary : colors.lightBg,
                  color: dateFilter === 'year' ? '#fff' : colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
              >
                📅 This Year
              </button>
              
              <button
                onClick={() => setStatusFilter('Pending')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusFilter === 'Pending' ? colors.warning : colors.lightBg,
                  color: statusFilter === 'Pending' ? '#fff' : colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
              >
                ⏳ Pending Only
              </button>
              
              <button
                onClick={() => setStatusFilter('Resolved')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusFilter === 'Resolved' ? colors.success : colors.lightBg,
                  color: statusFilter === 'Resolved' ? '#fff' : colors.darkText,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s'
                }}
              >
                ✅ Resolved Only
              </button>
            </div>
          </Card>
            {/* Interactive Charts - First Row */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
            <Card title="Reports by Category" style={{ 
              flex: '1 1 300px',
              border: selectedDataPoint?.chartType === 'category' ? `3px solid ${colors.primary}` : 'none',
              background: hoveredChart === 'category' ? 'rgba(67, 97, 238, 0.02)' : '#fff'
            }}>
              <div style={{ 
                height:  300,
                position: 'relative'
              }}>
                <Pie 
                  data={categoryData} 
                  options={getPieDoughnutOptions(categoryLabels, categoryValues, categoryTotal, 'category')} 
                  plugins={[ChartDataLabels]} 
                  ref={pieRef} 
                />
                {hoveredChart === 'category' && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: colors.primary,
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    Click to filter
                  </div>
                )}
              </div>
            </Card>
            
            <Card title="Reports by Status" style={{ 
              flex: '1 1 300px',
              border: selectedDataPoint?.chartType === 'status' ? `3px solid ${colors.primary}` : 'none',
              background: hoveredChart === 'status' ? 'rgba(67, 97, 238, 0.02)' : '#fff'
            }}>
              <div style={{ 
                height: 300,
                position: 'relative'
              }}>
                <Doughnut 
                  data={statusData} 
                  options={getPieDoughnutOptions(statusLabels, statusValues, statusTotal, 'status')} 
                  plugins={[ChartDataLabels]} 
                  ref={doughnutRef} 
                />
                {hoveredChart === 'status' && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: colors.primary,
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    Click to filter
                  </div>
                )}
              </div>
            </Card>
            
            <Card title="Reports Over Time" style={{ flex: '1 1 300px' }}>
              <div style={{ height: 300 }}>
                <Line 
                  data={timeData} 
                  options={getLineOptions()} 
                  ref={lineRef} 
                />
              </div>
            </Card>
          </div>
          
          {/* Interactive Charts - Second Row */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
            <Card title="Reports by Location" style={{ 
              flex: '1 1 450px',
              border: selectedDataPoint?.chartType === 'location' ? `3px solid ${colors.primary}` : 'none',
              background: hoveredChart === 'location' ? 'rgba(67, 97, 238, 0.02)' : '#fff'
            }}>
              <div style={{ 
                height: 300,
                position: 'relative'
              }}>
                <Bar 
                  data={locationData} 
                  options={getBarOptions(locationLabels, locationValues, locationTotal, 'location')} 
                  plugins={[ChartDataLabels]} 
                  ref={barLocationRef} 
                />
                {hoveredChart === 'location' && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: colors.primary,
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    Click to filter
                  </div>
                )}
              </div>
            </Card>
            
            <Card title="Top Issues" style={{ flex: '1 1 450px' }}>
              <div style={{ height: 300 }}>
                <Bar 
                  data={topIssuesData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: colors.primary,
                        borderWidth: 1
                      }
                    }, 
                    animation: {
                      duration: 1000,
                      easing: 'easeInOutQuart'
                    }, 
                    scales: { 
                      y: { 
                        beginAtZero: true,
                        grid: {
                          display: true,
                          color: 'rgba(0,0,0,0.05)'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    } 
                  }} 
                  ref={barTopIssuesRef} 
                />
              </div>
            </Card>
          </div>        </section>
    </div>
  );
};

export default Analytics;