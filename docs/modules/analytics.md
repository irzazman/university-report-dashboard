# Analytics Module Documentation

## Overview
The Analytics module (`/src/pages/Analytics.js`) provides comprehensive data visualization and reporting capabilities for the University Report Dashboard, enabling administrators to gain insights into facility maintenance patterns and performance metrics.

## Purpose
- Visualize report trends and patterns
- Provide actionable insights for decision-making
- Generate comprehensive analytics reports
- Export data in multiple formats (PDF, CSV)
- Monitor system performance and usage

## Key Features

### 1. Interactive Data Visualizations
- **Line Charts**: Reports over time trends
- **Bar Charts**: Category and location distributions
- **Pie Charts**: Status breakdowns
- **Doughnut Charts**: Type distributions
- **Real-time Updates**: Live data from Firestore

### 2. Comprehensive Metrics
```javascript
// Core Analytics Metrics:
- Total Reports: Overall system usage
- Open Reports: Current workload
- Resolved Reports: Completion rate
- Reports This Week: Recent activity
- Reports This Month: Monthly trends
- Category Distribution: Popular facility types
- Status Breakdown: Workflow efficiency
- Location Analysis: Geographic patterns
- Top Issues: Most common problems
```

### 3. Export Capabilities
- **PDF Reports**: Professional formatted analytics
- **CSV/Excel**: Raw data for further analysis
- **Chart Images**: Individual chart exports
- **Custom Date Ranges**: Filtered analytics

### 4. Time-based Analysis
- **Trend Analysis**: Historical data patterns
- **Seasonal Patterns**: Time-based insights
- **Performance Metrics**: Resolution timeframes
- **Workload Distribution**: Staff assignment patterns

## Component Architecture

```javascript
const Analytics = () => {
  // Core Data State
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Metrics State
  const [totalReports, setTotalReports] = useState(0);
  const [openReports, setOpenReports] = useState(0);
  const [resolvedReports, setResolvedReports] = useState(0);
  const [reportsThisWeek, setReportsThisWeek] = useState(0);
  const [reportsThisMonth, setReportsThisMonth] = useState(0);
  
  // Analysis State
  const [categoryCounts, setCategoryCounts] = useState({});
  const [statusCounts, setStatusCounts] = useState({});
  const [locationCounts, setLocationCounts] = useState({});
  const [topIssues, setTopIssues] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Chart References
  const pieRef = useRef(null);
  const doughnutRef = useRef(null);
  const lineRef = useRef(null);
  const barLocationRef = useRef(null);
  const barTopIssuesRef = useRef(null);
};
```

## Data Processing Functions

### Core Analytics Calculations

#### `calculateMetrics(reports)`
Comprehensive metrics calculation:
```javascript
const calculateMetrics = (reports) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const metrics = {
    total: reports.length,
    open: reports.filter(r => r.status === 'Open').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
    thisWeek: reports.filter(r => {
      const reportDate = r.timestamp?.toDate?.() || new Date(r.timestamp);
      return reportDate >= oneWeekAgo;
    }).length,
    thisMonth: reports.filter(r => {
      const reportDate = r.timestamp?.toDate?.() || new Date(r.timestamp);
      return reportDate >= oneMonthAgo;
    }).length
  };
  
  return metrics;
};
```

#### `calculateCategoryDistribution(reports)`
Category-based analysis:
```javascript
const calculateCategoryDistribution = (reports) => {
  const distribution = {};
  
  reports.forEach(report => {
    const category = report.category || 'Unknown';
    distribution[category] = (distribution[category] || 0) + 1;
  });
  
  return Object.entries(distribution)
    .sort(([,a], [,b]) => b - a)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};
```

#### `calculateTrendData(reports)`
Time-based trend analysis:
```javascript
const calculateTrendData = (reports) => {
  const monthlyData = {};
  
  reports.forEach(report => {
    const date = report.timestamp?.toDate?.() || new Date(report.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        total: 0,
        open: 0,
        resolved: 0,
        inProgress: 0
      };
    }
    
    monthlyData[monthKey].total++;
    
    switch (report.status) {
      case 'Open':
        monthlyData[monthKey].open++;
        break;
      case 'Resolved':
        monthlyData[monthKey].resolved++;
        break;
      case 'In Progress':
        monthlyData[monthKey].inProgress++;
        break;
      default:
        break;
    }
  });
  
  return Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
};
```

#### `calculateTopIssues(reports)`
Issue frequency analysis:
```javascript
const calculateTopIssues = (reports) => {
  const issueFrequency = {};
  
  reports.forEach(report => {
    const type = report.type || 'Unknown';
    issueFrequency[type] = (issueFrequency[type] || 0) + 1;
  });
  
  return Object.entries(issueFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10); // Top 10 issues
};
```

## Chart Configurations

### Line Chart (Reports Over Time)
```javascript
const lineChartData = {
  labels: monthlyData.map(item => {
    const [year, month] = item.month.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  }),
  datasets: [
    {
      label: 'Total Reports',
      data: monthlyData.map(item => item.total),
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}20`,
      fill: true,
      tension: 0.4
    },
    {
      label: 'Resolved',
      data: monthlyData.map(item => item.resolved),
      borderColor: colors.success,
      backgroundColor: `${colors.success}20`,
      fill: false,
      tension: 0.4
    }
  ]
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Reports Over Time',
      font: { size: 16, weight: 'bold' }
    },
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0,0,0,0.1)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
};
```

### Pie Chart (Category Distribution)
```javascript
const pieChartData = {
  labels: Object.keys(categoryCounts),
  datasets: [{
    data: Object.values(categoryCounts),
    backgroundColor: [
      '#4361ee', '#3f37c9', '#4cc9f0', '#f72585', 
      '#4895ef', '#560bad', '#7209b7', '#f72585'
    ],
    borderWidth: 2,
    borderColor: '#fff'
  }]
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Reports by Category',
      font: { size: 16, weight: 'bold' }
    },
    legend: {
      position: 'right',
      labels: {
        padding: 20,
        usePointStyle: true
      }
    },
    datalabels: {
      display: true,
      color: '#fff',
      font: {
        weight: 'bold'
      },
      formatter: (value, context) => {
        const total = context.dataset.data.reduce((a, b) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        return `${percentage}%`;
      }
    }
  }
};
```

### Bar Chart (Location Analysis)
```javascript
const barChartData = {
  labels: Object.keys(locationCounts),
  datasets: [{
    label: 'Reports by Location',
    data: Object.values(locationCounts),
    backgroundColor: colors.primary,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 4
  }]
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Reports by Location',
      font: { size: 16, weight: 'bold' }
    },
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0,0,0,0.1)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};
```

## Export Functionality

### PDF Export with Charts
```javascript
const handleExportPDF = async () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  // Header with branding
  doc.setFillColor(67, 97, 238);
  doc.rect(0, 0, 210, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('University Report System - Analytics', 14, 8);
  
  // Reset colors and add title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('Analytics Report', 14, y);
  y += 10;
  
  // Add generation date and summary
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);
  doc.text(`Reporting Period: ${getReportingPeriod()}`, 14, y + 5);
  y += 20;
  
  // Summary statistics
  doc.setFontSize(14);
  doc.text('Summary Statistics', 14, y);
  y += 10;
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Reports', totalReports.toString()],
    ['Open Reports', openReports.toString()],
    ['Resolved Reports', resolvedReports.toString()],
    ['This Week', reportsThisWeek.toString()],
    ['This Month', reportsThisMonth.toString()],
    ['Resolution Rate', `${((resolvedReports / totalReports) * 100).toFixed(1)}%`]
  ];
  
  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: y,
    styles: { fontSize: 10 },
    headStyles: { 
      fillColor: [67, 97, 238],
      textColor: [255, 255, 255] 
    },
    tableWidth: 100
  });
  y = doc.lastAutoTable.finalY + 20;
  
  // Chart images (if available)
  await addChartsToPDF(doc, y);
  
  // Data tables
  addDataTablesToPDF(doc);
  
  // Footer
  addFooterToPDF(doc);
  
  doc.save('analytics-report.pdf');
};
```

### Chart Image Export
```javascript
const addChartsToPDF = async (doc, startY) => {
  let y = startY;
  
  const addChartImage = async (chartRef, title) => {
    if (chartRef.current) {
      try {
        const canvas = chartRef.current.canvas;
        const imgData = canvas.toDataURL('image/png');
        
        if (y + 80 > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(12);
        doc.text(title, 14, y);
        doc.addImage(imgData, 'PNG', 14, y + 5, 180, 70);
        y += 85;
      } catch (error) {
        console.error(`Error adding chart ${title}:`, error);
      }
    }
  };
  
  await addChartImage(pieRef, 'Category Distribution');
  await addChartImage(doughnutRef, 'Status Breakdown');
  await addChartImage(lineRef, 'Reports Over Time');
  await addChartImage(barLocationRef, 'Location Analysis');
  await addChartImage(barTopIssuesRef, 'Top Issues');
};
```

### CSV Export
```javascript
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

  csv += '\nMonth,Total Reports,Resolved,Open,In Progress\n';
  monthlyData.forEach(item => {
    csv += `${item.month},${item.total},${item.resolved},${item.open},${item.inProgress}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'analytics-data.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};
```

## Real-time Data Updates

### Firestore Integration
```javascript
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
    
    // Recalculate all metrics
    const metrics = calculateMetrics(reportsData);
    setTotalReports(metrics.total);
    setOpenReports(metrics.open);
    setResolvedReports(metrics.resolved);
    setReportsThisWeek(metrics.thisWeek);
    setReportsThisMonth(metrics.thisMonth);
    
    // Recalculate distributions
    setCategoryCounts(calculateCategoryDistribution(reportsData));
    setStatusCounts(calculateStatusDistribution(reportsData));
    setLocationCounts(calculateLocationDistribution(reportsData));
    setTopIssues(calculateTopIssues(reportsData));
    setMonthlyData(calculateTrendData(reportsData));
    
    setLoading(false);
  }, (error) => {
    console.error("Error fetching analytics data:", error);
    setLoading(false);
  });

  return () => unsubscribe();
}, []);
```

### Automatic Refresh
```javascript
useEffect(() => {
  // Auto-refresh every 5 minutes for live dashboard
  const interval = setInterval(() => {
    // Trigger data refresh if needed
    console.log('Auto-refreshing analytics data...');
  }, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, []);
```

## Performance Optimizations

### Memoization
```javascript
// Memoize expensive calculations
const memoizedMetrics = useMemo(() => {
  return calculateMetrics(reports);
}, [reports]);

const memoizedChartData = useMemo(() => {
  return {
    pieData: generatePieChartData(categoryCounts),
    lineData: generateLineChartData(monthlyData),
    barData: generateBarChartData(locationCounts)
  };
}, [categoryCounts, monthlyData, locationCounts]);
```

### Lazy Loading
```javascript
// Lazy load charts for better performance
const LazyPieChart = lazy(() => import('./charts/PieChart'));
const LazyLineChart = lazy(() => import('./charts/LineChart'));
const LazyBarChart = lazy(() => import('./charts/BarChart'));

// Usage with Suspense
<Suspense fallback={<ChartSkeleton />}>
  <LazyPieChart data={pieChartData} options={pieChartOptions} />
</Suspense>
```

## UI Components

### Metric Cards
```javascript
const MetricCard = ({ title, value, change, icon, color }) => (
  <Card className="metric-card">
    <div className="metric-header">
      <div className="metric-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="metric-info">
        <h3>{title}</h3>
        <div className="metric-value">{value}</div>
        {change && (
          <div className={`metric-change ${change > 0 ? 'positive' : 'negative'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  </Card>
);
```

### Chart Container
```javascript
const ChartContainer = ({ title, children, onExport }) => (
  <Card className="chart-container">
    <div className="chart-header">
      <h3>{title}</h3>
      {onExport && (
        <button onClick={onExport} className="export-button">
          Export
        </button>
      )}
    </div>
    <div className="chart-content">
      {children}
    </div>
  </Card>
);
```

### Date Range Picker
```javascript
const DateRangePicker = ({ startDate, endDate, onChange }) => (
  <div className="date-range-picker">
    <label>Date Range:</label>
    <input 
      type="date" 
      value={startDate} 
      onChange={(e) => onChange({ startDate: e.target.value, endDate })}
    />
    <span>to</span>
    <input 
      type="date" 
      value={endDate} 
      onChange={(e) => onChange({ startDate, endDate: e.target.value })}
    />
  </div>
);
```

## Error Handling

### Chart Error Boundaries
```javascript
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="chart-error">
          <p>Unable to load chart</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Data Validation
```javascript
const validateAnalyticsData = (reports) => {
  const errors = [];
  
  if (!Array.isArray(reports)) {
    errors.push('Reports data must be an array');
  }
  
  if (reports.length === 0) {
    errors.push('No reports data available');
  }
  
  const invalidReports = reports.filter(report => 
    !report.timestamp || !report.status || !report.category
  );
  
  if (invalidReports.length > 0) {
    errors.push(`${invalidReports.length} reports have missing required fields`);
  }
  
  return errors;
};
```

## Testing Strategy

### Unit Tests
```javascript
describe('Analytics Module', () => {
  test('calculates metrics correctly', () => {
    const mockReports = [
      { status: 'Open', timestamp: new Date() },
      { status: 'Resolved', timestamp: new Date() },
      { status: 'In Progress', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }
    ];
    
    const metrics = calculateMetrics(mockReports);
    
    expect(metrics.total).toBe(3);
    expect(metrics.open).toBe(1);
    expect(metrics.resolved).toBe(1);
    expect(metrics.thisWeek).toBe(2);
  });
  
  test('generates chart data correctly', () => {
    const categoryCounts = { 'Dorm': 5, 'Faculty': 3 };
    const chartData = generatePieChartData(categoryCounts);
    
    expect(chartData.labels).toEqual(['Dorm', 'Faculty']);
    expect(chartData.datasets[0].data).toEqual([5, 3]);
  });
});
```

### Integration Tests
```javascript
describe('Analytics Integration', () => {
  test('renders charts with real data', async () => {
    const mockReports = generateMockReports(100);
    
    render(<Analytics />);
    
    // Mock Firestore response
    mockFirestore.collection('reports').onSnapshot.mockImplementation((callback) => {
      callback({
        docs: mockReports.map(report => ({
          id: report.id,
          data: () => report
        }))
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Report')).toBeInTheDocument();
    });
    
    // Check if charts are rendered
    expect(screen.getByText('Reports by Category')).toBeInTheDocument();
    expect(screen.getByText('Reports Over Time')).toBeInTheDocument();
  });
});
```

## Security and Privacy

### Data Access Control
```javascript
// Only show analytics to authorized users
const Analytics = () => {
  const [userRole, setUserRole] = useState(null);
  
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      // Check user role
      getUserRole(user.uid).then(role => {
        setUserRole(role);
      });
    }
  }, []);
  
  if (userRole !== 'admin' && userRole !== 'manager') {
    return <div>Access denied. Analytics require admin privileges.</div>;
  }
  
  // Rest of component...
};
```

### Data Anonymization
```javascript
const anonymizeLocationData = (reports) => {
  return reports.map(report => ({
    ...report,
    // Remove specific room numbers, keep only faculty/building
    room: report.room ? 'XXX' : null,
    // Keep general location for analytics
    faculty: report.faculty
  }));
};
```

## Future Enhancements

### Advanced Analytics
1. **Predictive Analytics**: ML models for maintenance prediction
2. **Seasonal Analysis**: Weather-based pattern recognition
3. **Staff Performance**: Assignment and resolution metrics
4. **Cost Analysis**: Budget and resource allocation insights
5. **SLA Monitoring**: Service level agreement tracking

### Interactive Features
1. **Drill-down Charts**: Click charts to filter data
2. **Custom Dashboards**: User-configurable analytics views
3. **Real-time Alerts**: Threshold-based notifications
4. **Collaborative Annotations**: Comments on charts
5. **Scheduled Reports**: Automated report generation

### Technical Improvements
1. **Data Warehouse**: Separate analytics database
2. **Real-time Streaming**: Live data processing
3. **Advanced Caching**: Redis for performance
4. **API Integration**: External data sources
5. **Mobile Analytics**: Touch-optimized charts