# Reports Module Documentation

## Overview
The Reports module (`/src/pages/Reports.js`) is a comprehensive report management system providing advanced filtering, sorting, assignment, and export capabilities for university facility maintenance reports.

## Purpose
- Comprehensive report listing and management
- Advanced filtering and search capabilities
- Staff assignment workflow
- PDF export functionality
- Pagination for large datasets

## Key Features

### 1. Advanced Report Listing
- **Paginated Display**: Configurable items per page (10, 25, 50, 100)
- **Real-time Updates**: Live data from Firestore
- **Responsive Table**: Adapts to different screen sizes
- **Status Indicators**: Visual badges for quick status identification

### 2. Filtering System
```javascript
// Available Filters:
- Search: Text search across title and description
- Category: Dorm, Faculty, Library, Sports, Food Court, Parking, Other
- Type: Electrical, Plumbing, HVAC, Structural, Cleanliness, Other
- Status: Open, In Progress, Resolved, Pending Review
- Date Range: Custom date picker for timestamp filtering
```

### 3. Sorting Capabilities
- **Sortable Columns**: ID, Title, Category, Type, Location, Status, Date
- **Bi-directional**: Ascending/Descending order
- **Visual Indicators**: Sort direction arrows
- **Persistent Sorting**: Maintains sort state during filtering

### 4. PDF Export System
- **Comprehensive Reports**: All data with professional formatting
- **Filtered Exports**: Export current filtered results
- **Styled Output**: University branding and consistent formatting
- **Pagination**: Multi-page support with headers/footers

### 5. Staff Assignment Workflow
- **Modal Interface**: Clean assignment dialog
- **Real-time Staff List**: Live data from users collection
- **Department Context**: Staff department information
- **Instant Updates**: Real-time status changes

## Component Architecture

```javascript
const Reports = () => {
  // Core State
  const [reports, setReports] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  
  // Filtering State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // UI State
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [assigningReport, setAssigningReport] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
};
```

## Core Functions

### Data Management

#### `fetchReports()`
Real-time report fetching with Firestore listeners:
```javascript
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
```

#### `fetchStaff()`
Real-time staff data for assignment:
```javascript
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
```

### Filtering and Sorting

#### `applyFilters(reports)`
Comprehensive filtering logic:
```javascript
const applyFilters = (reports) => {
  return reports.filter(report => {
    // Search filter
    const matchesSearch = !search || 
      report.title?.toLowerCase().includes(search.toLowerCase()) ||
      report.description?.toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || 
      report.category === categoryFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || 
      report.type === typeFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      report.status === statusFilter;
    
    // Date filter
    const matchesDate = applyDateFilter(report, dateFilter);
    
    return matchesSearch && matchesCategory && matchesType && 
           matchesStatus && matchesDate;
  });
};
```

#### `applySorting(reports, sortConfig)`
Dynamic sorting implementation:
```javascript
const applySorting = (reports, sortConfig) => {
  if (!sortConfig.key) return reports;
  
  return [...reports].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Handle timestamp sorting
    if (sortConfig.key === 'timestamp') {
      aValue = aValue?.toDate?.() || new Date(aValue);
      bValue = bValue?.toDate?.() || new Date(bValue);
    }
    
    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};
```

### Pagination System

#### `calculatePagination(filteredReports)`
Pagination logic with dynamic page calculation:
```javascript
const calculatePagination = (filteredReports) => {
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);
  
  return {
    currentReports,
    totalPages,
    totalItems: filteredReports.length,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, filteredReports.length)
  };
};
```

### PDF Export System

#### `handleExportPDF()`
Comprehensive PDF generation with professional styling:
```javascript
const handleExportPDF = () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  // Header with university branding
  doc.setFillColor(67, 97, 238); // Primary color
  doc.rect(0, 0, 210, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('University Report System', 14, 8);
  
  // Reset text color and add title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('Facility Reports', 14, y);
  y += 10;
  
  // Add metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y);
  doc.text(`Total Reports: ${filteredReports.length}`, 14, y + 5);
  y += 20;
  
  // Table generation with autoTable
  autoTable(doc, {
    head: [['ID', 'Title', 'Category', 'Type', 'Status', 'Location', 'Date']],
    body: filteredReports.map(report => [
      report.id.slice(-5),
      report.title || '-',
      report.category || '-',
      report.type || '-',
      report.status || '-',
      `${report.faculty || ''} ${report.room || ''}`.trim() || '-',
      formatDate(report.timestamp)
    ]),
    startY: y,
    styles: { fontSize: 8 },
    headStyles: { 
      fillColor: [67, 97, 238],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    tableWidth: 180
  });
  
  // Footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`, 
      doc.internal.pageSize.getWidth() / 2, 
      285, 
      { align: 'center' }
    );
    doc.text('University Report System', 14, 285);
  }

  doc.save('reports.pdf');
};
```

### Assignment System

#### `handleAssignReport(reportId, staffId)`
Complete assignment workflow:
```javascript
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
      assignedTimestamp: new Date(),
      lastUpdated: new Date()
    });
    
    // Close modal and reset state
    setAssigningReport(null);
    setSelectedStaff('');
    
    // Optional: Show success notification
    console.log(`Report ${reportId} assigned to ${staff.displayName}`);
    
  } catch (error) {
    console.error("Error assigning report:", error);
    // Handle error (show notification, etc.)
  }
};
```

## UI Components and Layout

### Table Structure
```javascript
<table className="reports-table">
  <thead>
    <tr>
      {columns.map(column => (
        <th 
          key={column.key}
          onClick={() => handleSort(column.key)}
          style={{ cursor: 'pointer' }}
        >
          {column.label}
          {sortConfig.key === column.key && (
            <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
          )}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {paginatedReports.map(report => (
      <ReportRow key={report.id} report={report} />
    ))}
  </tbody>
</table>
```

### Filter Bar
```javascript
<div className="filters-container">
  <input 
    type="text"
    placeholder="Search reports..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  
  <select 
    value={categoryFilter} 
    onChange={(e) => setCategoryFilter(e.target.value)}
  >
    <option value="all">All Categories</option>
    {categories.map(cat => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
  
  {/* Additional filters... */}
</div>
```

### Assignment Modal
```javascript
{assigningReport && (
  <div className="assignment-modal">
    <div className="modal-content">
      <h3>Assign Report: {assigningReport.id.slice(-5)}</h3>
      
      <div className="report-summary">
        <p><strong>Title:</strong> {assigningReport.title}</p>
        <p><strong>Category:</strong> {assigningReport.category}</p>
        <p><strong>Location:</strong> {assigningReport.faculty} - {assigningReport.room}</p>
      </div>
      
      <div className="staff-selection">
        <label>Select Staff Member:</label>
        <select 
          value={selectedStaff} 
          onChange={(e) => setSelectedStaff(e.target.value)}
        >
          <option value="">Select staff...</option>
          {availableStaff.map(staff => (
            <option key={staff.id} value={staff.id}>
              {staff.displayName} ({staff.department})
            </option>
          ))}
        </select>
      </div>
      
      <div className="modal-actions">
        <button onClick={() => setAssigningReport(null)}>Cancel</button>
        <button 
          onClick={() => handleAssignReport(assigningReport.id, selectedStaff)}
          disabled={!selectedStaff}
        >
          Assign Report
        </button>
      </div>
    </div>
  </div>
)}
```

## Responsive Design

### Breakpoint Handling
```css
/* Desktop */
@media (min-width: 1024px) {
  .reports-table {
    display: table;
  }
  .mobile-card-view {
    display: none;
  }
}

/* Tablet */
@media (max-width: 1023px) and (min-width: 768px) {
  .reports-table {
    font-size: 14px;
  }
  .table-column-optional {
    display: none;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .reports-table {
    display: none;
  }
  .mobile-card-view {
    display: block;
  }
}
```

### Mobile Card Layout
```javascript
const MobileReportCard = ({ report }) => (
  <div className="mobile-report-card">
    <div className="card-header">
      <span className="report-id">#{report.id.slice(-5)}</span>
      <StatusBadge status={report.status} />
    </div>
    
    <h4 className="report-title">{report.title}</h4>
    
    <div className="report-meta">
      <span className="category">{report.category}</span>
      <span className="type">{report.type}</span>
    </div>
    
    <div className="report-location">
      {report.faculty} - {report.room}
    </div>
    
    <div className="report-date">
      {formatDate(report.timestamp)}
    </div>
    
    <div className="card-actions">
      <button onClick={() => navigate(`/reports/${report.id}`)}>
        View Details
      </button>
      {report.status === 'Open' && (
        <button onClick={() => setAssigningReport(report)}>
          Assign
        </button>
      )}
    </div>
  </div>
);
```

## Performance Optimizations

### Memoization
```javascript
// Memoize expensive calculations
const filteredReports = useMemo(() => {
  return applyFilters(reports);
}, [reports, search, categoryFilter, typeFilter, statusFilter, dateFilter]);

const sortedReports = useMemo(() => {
  return applySorting(filteredReports, sortConfig);
}, [filteredReports, sortConfig]);

const paginationData = useMemo(() => {
  return calculatePagination(sortedReports);
}, [sortedReports, currentPage, itemsPerPage]);
```

### Virtual Scrolling (Future Enhancement)
```javascript
// For very large datasets
const VirtualizedTable = ({ reports }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={reports.length}
      itemSize={60}
      itemData={reports}
    >
      {ReportRow}
    </FixedSizeList>
  );
};
```

## Error Handling

### Network Error Recovery
```javascript
const [error, setError] = useState(null);
const [retryCount, setRetryCount] = useState(0);

useEffect(() => {
  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      setReports(reportsArray);
      setError(null);
      setRetryCount(0);
    },
    (error) => {
      console.error("Error fetching reports:", error);
      setError(error.message);
      
      // Automatic retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  );
}, [retryCount]);
```

### Data Validation
```javascript
const validateReport = (report) => {
  const errors = [];
  
  if (!report.title || report.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!report.category) {
    errors.push('Category is required');
  }
  
  if (!report.status) {
    errors.push('Status is required');
  }
  
  return errors;
};
```

## Testing Strategy

### Unit Tests
```javascript
describe('Reports Module', () => {
  test('applies filters correctly', () => {
    const mockReports = [
      { id: '1', title: 'Test Report', category: 'Dorm', status: 'Open' },
      { id: '2', title: 'Another Report', category: 'Faculty', status: 'Resolved' }
    ];
    
    const filtered = applyFilters(mockReports, {
      search: 'Test',
      categoryFilter: 'all',
      statusFilter: 'Open'
    });
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });
  
  test('sorts reports correctly', () => {
    const mockReports = [
      { id: '1', title: 'B Report' },
      { id: '2', title: 'A Report' }
    ];
    
    const sorted = applySorting(mockReports, {
      key: 'title',
      direction: 'asc'
    });
    
    expect(sorted[0].title).toBe('A Report');
  });
});
```

### Integration Tests
```javascript
describe('Reports Integration', () => {
  test('assignment workflow', async () => {
    render(<Reports />);
    
    // Wait for reports to load
    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });
    
    // Click assign button
    fireEvent.click(screen.getByText('Assign'));
    
    // Select staff member
    fireEvent.change(screen.getByLabelText('Select Staff'), {
      target: { value: 'staff1' }
    });
    
    // Submit assignment
    fireEvent.click(screen.getByText('Assign Report'));
    
    // Verify assignment
    await waitFor(() => {
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });
});
```

## Security Considerations

### Data Access Control
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{reportId} {
      allow read, write: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.assignedTo == request.auth.token.email ||
         request.auth.token.role == 'admin');
    }
  }
}
```

### Input Sanitization
```javascript
const sanitizeInput = (input) => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};
```

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Select multiple reports for batch actions
2. **Advanced Search**: Full-text search with highlighting
3. **Custom Views**: User-configurable table columns
4. **Export Options**: Excel, CSV, JSON export formats
5. **Report Templates**: Pre-defined report formats
6. **Automated Assignment**: Rule-based staff assignment
7. **Real-time Collaboration**: Multiple users editing simultaneously

### Performance Improvements
1. **Infinite Scrolling**: Replace pagination for better UX
2. **Background Sync**: Offline capability with sync
3. **Image Optimization**: Lazy loading and compression
4. **CDN Integration**: Faster asset delivery
5. **Database Indexing**: Optimized queries

### User Experience
1. **Advanced Filters**: Date ranges, custom criteria
2. **Saved Searches**: Bookmark frequently used filters
3. **Keyboard Shortcuts**: Power user features
4. **Drag & Drop**: Intuitive assignment interface
5. **Dark Mode**: Alternative color scheme