# Dashboard Module Documentation

## Overview
The Dashboard module (`/src/pages/Dashboard.js`) serves as the main landing page and overview center for the University Report Dashboard application.

## Purpose
- Provide quick overview of system status
- Display key metrics and statistics
- Enable quick actions on recent reports
- Serve as navigation hub for other modules

## Key Features

### 1. Real-time Statistics Display
- **Total Reports**: Shows count of all reports in system
- **Open Reports**: Reports currently awaiting attention
- **Resolved Reports**: Successfully completed reports
- **Today's Reports**: Reports submitted today
- **This Week's Reports**: Reports from current week

### 2. Recent Reports Table
- **Sortable Columns**: Click headers to sort by different criteria
- **Status Badges**: Visual indicators for report status
- **Quick Actions**: Assign staff, update status directly from table
- **Responsive Design**: Adapts to different screen sizes

### 3. Filtering Capabilities
- **Category Filter**: Filter by facility type (Dorm, Faculty, Library, etc.)
- **Type Filter**: Filter by issue type (Electrical, Plumbing, HVAC, etc.)
- **Time Filter**: View reports from today, this week, this month
- **Real-time Updates**: Filters update immediately

### 4. Staff Assignment System
- **Modal Interface**: Clean assignment dialog
- **Staff Selection**: Dropdown with available staff members
- **Department Display**: Shows staff department for context
- **Real-time Updates**: Assignment reflects immediately

## Component Structure

```javascript
const Dashboard = () => {
  // State Management
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('today');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [assigningReport, setAssigningReport] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);

  // Key Functions...
}
```

## Key Functions

### `fetchReports()`
- **Purpose**: Real-time data fetching from Firestore
- **Method**: Uses `onSnapshot` for live updates
- **Implementation**: 
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
  });

  return () => unsubscribe();
}, []);
```

### `handleAssignReport(reportId, staffId)`
- **Purpose**: Assign reports to maintenance staff
- **Parameters**: 
  - `reportId`: Unique report identifier
  - `staffId`: Selected staff member ID
- **Process**:
  1. Find staff member details
  2. Update Firestore document
  3. Set status to "In Progress"
  4. Add assignment timestamp
  5. Close assignment modal

### `handleStatusUpdate(reportId, newStatus)`
- **Purpose**: Update report status
- **Statuses**: Open, In Progress, Resolved, Pending Review
- **Side Effects**: Updates timestamps, triggers notifications

### `calculateStatistics(reports, filter)`
- **Purpose**: Calculate dashboard metrics
- **Returns**: Object with counts for different categories
- **Filters**: Applies time-based filtering for accurate counts

## Data Flow

1. **Initial Load**: 
   - Firebase authentication check
   - Fetch all reports from Firestore
   - Fetch available staff members
   - Calculate initial statistics

2. **Real-time Updates**:
   - Firestore `onSnapshot` listeners
   - Automatic re-calculation of statistics
   - UI updates without page refresh

3. **User Interactions**:
   - Filter changes trigger data re-processing
   - Sort changes reorder table display
   - Assignment actions update Firestore
   - Status updates trigger workflow changes

## Styling and Design

### Color Scheme
```css
:root {
  --primary-color: #4361ee;
  --success-color: #4cc9f0;
  --warning-color: #f72585;
  --background-color: #f8f9fa;
  --card-background: #ffffff;
  --text-primary: #212529;
  --text-secondary: #6c757d;
}
```

### Responsive Design
- **Desktop**: Full sidebar navigation, multi-column layout
- **Tablet**: Collapsible sidebar, adapted grid layout
- **Mobile**: Bottom navigation, single-column layout, touch-optimized

### Status Badges
```javascript
const getStatusBadge = (status) => {
  const statusStyles = {
    'Open': { background: '#fef3cd', color: '#856404', text: 'Open' },
    'In Progress': { background: '#cfe2ff', color: '#0c63e4', text: 'In Progress' },
    'Resolved': { background: '#d1e7dd', color: '#0a3622', text: 'Resolved' },
    'Pending Review': { background: '#fff3cd', color: '#664d03', text: 'Pending Review' }
  };
  // Return styled badge component
};
```

## Dependencies

### Firebase Dependencies
- `getFirestore`: Database access
- `collection`, `onSnapshot`, `query`, `orderBy`: Data querying
- `doc`, `updateDoc`: Document updates
- `where`: Filtering

### React Dependencies
- `useState`, `useEffect`: State and lifecycle management
- `useNavigate`: Navigation
- React Router for routing

### UI Dependencies
- Custom Card component
- Custom Button component
- PageHeader component
- Global styling system

## Error Handling

### Network Errors
```javascript
const unsubscribe = onSnapshot(q, 
  (snapshot) => {
    // Success handler
    setReports(reportsData);
    setError(null);
  },
  (error) => {
    // Error handler
    console.error("Error fetching reports:", error);
    setError("Failed to load reports. Please refresh the page.");
  }
);
```

### Permission Errors
- Handled through Firebase security rules
- UI shows appropriate error messages
- Graceful fallback to available data

## Performance Optimizations

### Data Loading
- Real-time listeners prevent unnecessary re-fetching
- Efficient queries with proper indexing
- Minimal data transfer with field selection

### UI Rendering
- React memoization for expensive calculations
- Virtualization for large report lists
- Lazy loading for non-critical components

### Caching
- Firebase offline persistence
- Browser caching for static assets
- Service worker for PWA capabilities

## Testing Considerations

### Unit Tests
- Test statistics calculations
- Test filtering logic
- Test assignment functionality
- Mock Firebase operations

### Integration Tests
- Test real-time data flow
- Test user interactions
- Test error scenarios

### E2E Tests
- Test complete user workflows
- Test responsive design
- Test performance under load

## Future Enhancements

### Planned Features
- **Advanced Filtering**: Date range pickers, custom filters
- **Bulk Operations**: Assign multiple reports, bulk status updates
- **Dashboard Customization**: User-configurable widgets
- **Real-time Notifications**: Push notifications for updates
- **Export Features**: Export dashboard data to various formats

### Performance Improvements
- **Infinite Scrolling**: For large report lists
- **Advanced Caching**: Redis for frequently accessed data
- **CDN Integration**: For faster asset loading
- **Database Optimization**: Better indexing strategies

## Troubleshooting

### Common Issues

**Reports not loading:**
- Check Firebase connection
- Verify security rules
- Check browser console for errors

**Assignment not working:**
- Verify staff collection has proper data
- Check user permissions
- Ensure proper role assignments

**Statistics incorrect:**
- Clear browser cache
- Check filter logic
- Verify timestamp formats

### Debug Mode
Enable debug logging by setting:
```javascript
window.DEBUG_MODE = true;
```

This enables additional console logging for troubleshooting.