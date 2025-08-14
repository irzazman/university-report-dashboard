# Firebase API Documentation

## Overview
The University Report Dashboard uses Firebase as its backend infrastructure, providing authentication, real-time database, and analytics capabilities. This document covers the Firebase integration, database structure, and API usage patterns.

## Firebase Services Used

### 1. Firebase Authentication
- **Purpose**: User authentication and session management
- **Methods**: Email/password authentication
- **Features**: Role-based access control, session persistence

### 2. Cloud Firestore
- **Purpose**: NoSQL document database for application data
- **Features**: Real-time updates, offline persistence, security rules
- **Collections**: `reports`, `users`, `support_tickets`

### 3. Firebase Analytics
- **Purpose**: Application usage analytics and user behavior tracking
- **Features**: Event tracking, user engagement metrics

## Database Schema

### Collections Structure

#### 1. `reports` Collection
Primary collection for facility maintenance reports.

```javascript
// Document Structure
{
  id: "auto-generated-document-id",
  
  // Basic Information
  title: "Water leak in dormitory bathroom",
  description: "Water is leaking from the ceiling in the second-floor bathroom...",
  
  // Categorization
  category: "Dorm" | "Faculty" | "Library" | "Sports" | "Food Court" | "Parking" | "Other",
  type: "Electrical" | "Plumbing" | "HVAC" | "Structural" | "Cleanliness" | "Other",
  priority: "Low" | "Medium" | "High" | "Critical",
  
  // Status & Workflow
  status: "Open" | "In Progress" | "Resolved" | "Pending Review",
  
  // Reporter Information
  reporterName: "John Doe",
  reporterEmail: "john.doe@university.edu",
  reporterPhone: "+60123456789",
  reporterMatricNumber: "A20EC0123", // For students
  
  // Location Details
  location: {
    lat: 3.1319,
    lng: 101.6841
  },
  faculty: "Faculty of Engineering",
  building: "Block A",
  floor: "2",
  room: "A2-201",
  
  // Assignment & Resolution
  assignedTo: "maintenance@university.edu",
  assignedStaffName: "Mike Johnson",
  assignedStaffDepartment: "Facilities Management",
  assignedTimestamp: Timestamp,
  
  // Resolution Details
  resolvedBy: "maintenance@university.edu",
  resolutionNote: "Fixed the leak by replacing damaged pipe joint",
  resolutionTimestamp: Timestamp,
  
  // Timestamps
  timestamp: Timestamp, // Report creation
  lastUpdated: Timestamp, // Last modification
  
  // Media Attachments
  imageUrls: ["https://storage.googleapis.com/..."],
  
  // Additional Fields
  isUrgent: boolean,
  estimatedCost: number,
  actualCost: number,
  reviewNotes: "Quality check passed",
  reviewedBy: "admin@university.edu",
  reviewTimestamp: Timestamp
}
```

#### 2. `users` Collection
User account and role management.

```javascript
// Document Structure (document ID = user UID)
{
  // Basic Profile
  email: "user@university.edu",
  displayName: "John Doe",
  phoneNumber: "+60123456789",
  
  // University Information
  matricNumber: "A20EC0123", // For students
  staffId: "ST001234", // For staff
  department: "Facilities Management",
  faculty: "Faculty of Engineering",
  
  // Role & Permissions
  role: "admin" | "staff" | "student",
  permissions: ["read_reports", "assign_reports", "manage_users"],
  
  // Status
  isActive: true,
  isVerified: true,
  
  // Timestamps
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
  updatedAt: Timestamp,
  
  // Preferences
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    language: "en",
    timezone: "Asia/Kuala_Lumpur"
  },
  
  // Statistics (for staff)
  stats: {
    reportsAssigned: 45,
    reportsResolved: 38,
    averageResolutionTime: 2.5, // days
    rating: 4.8
  }
}
```

#### 3. `support_tickets` Collection
Student support and inquiry system.

```javascript
// Document Structure
{
  // Ticket Information
  subject: "Unable to submit facility report",
  description: "The mobile app crashes when I try to submit a report...",
  
  // Categorization
  category: "Technical" | "Account" | "General" | "Feature Request",
  priority: "Low" | "Medium" | "High",
  
  // Status
  status: "Open" | "In Progress" | "Resolved" | "Closed",
  
  // User Information
  reporterName: "Jane Smith",
  reporterEmail: "jane.smith@university.edu",
  reporterPhone: "+60198765432",
  reporterType: "student" | "staff" | "visitor",
  
  // Assignment
  assignedTo: "support@university.edu",
  assignedStaffName: "Support Agent",
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  resolvedAt: Timestamp,
  
  // Communication
  responses: [
    {
      responderId: "staff-uid",
      responderName: "Support Agent",
      message: "Thank you for reporting this issue...",
      timestamp: Timestamp,
      isInternal: false
    }
  ],
  
  // Resolution
  resolution: "Updated mobile app to fix crash issue",
  resolutionCategory: "bug_fix" | "feature_added" | "user_error" | "other",
  
  // Metadata
  source: "web" | "mobile" | "email" | "phone",
  tags: ["mobile", "crash", "reports"],
  relatedReportId: "report-document-id" // If related to specific report
}
```

#### 4. `notifications` Collection (Optional)
System notifications for users.

```javascript
{
  // Target User
  userId: "user-uid",
  userEmail: "user@university.edu",
  
  // Notification Content
  title: "Report Status Updated",
  message: "Your report #12345 has been assigned to maintenance staff",
  type: "report_update" | "assignment" | "resolution" | "system",
  
  // Status
  read: false,
  delivered: true,
  
  // Timestamps
  createdAt: Timestamp,
  readAt: Timestamp,
  expiresAt: Timestamp,
  
  // Related Data
  relatedId: "report-or-ticket-id",
  relatedType: "report" | "ticket" | "announcement",
  
  // Action
  actionUrl: "/reports/12345",
  actionText: "View Report"
}
```

## API Usage Patterns

### Authentication

#### User Login
```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const loginUser = async (email, password) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user role and permissions
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    return {
      user,
      role: userData.role,
      permissions: userData.permissions
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

#### Authentication State Monitoring
```javascript
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  return { user, loading };
};
```

### Data Operations

#### Real-time Data Fetching
```javascript
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';

const useReports = (filters = {}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const db = getFirestore();
    let q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    
    // Apply filters
    if (filters.category && filters.category !== 'all') {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.status && filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching reports:', error);
        setError(error.message);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [filters]);
  
  return { reports, loading, error };
};
```

#### Document Creation
```javascript
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const createReport = async (reportData) => {
  try {
    const db = getFirestore();
    const reportsRef = collection(db, 'reports');
    
    const newReport = {
      ...reportData,
      status: 'Open',
      timestamp: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
    
    const docRef = await addDoc(reportsRef, newReport);
    console.log('Report created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};
```

#### Document Updates
```javascript
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const updateReportStatus = async (reportId, newStatus, resolutionNote = '') => {
  try {
    const db = getFirestore();
    const reportRef = doc(db, 'reports', reportId);
    
    const updateData = {
      status: newStatus,
      lastUpdated: serverTimestamp()
    };
    
    // Add resolution details if resolving
    if (newStatus === 'Resolved') {
      updateData.resolutionNote = resolutionNote;
      updateData.resolutionTimestamp = serverTimestamp();
      updateData.resolvedBy = auth.currentUser.email;
    }
    
    await updateDoc(reportRef, updateData);
    console.log('Report status updated successfully');
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};
```

#### Batch Operations
```javascript
import { getFirestore, writeBatch, doc } from 'firebase/firestore';

const assignMultipleReports = async (reportIds, staffEmail, staffName) => {
  try {
    const db = getFirestore();
    const batch = writeBatch(db);
    
    reportIds.forEach(reportId => {
      const reportRef = doc(db, 'reports', reportId);
      batch.update(reportRef, {
        assignedTo: staffEmail,
        assignedStaffName: staffName,
        status: 'In Progress',
        assignedTimestamp: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('Batch assignment completed');
  } catch (error) {
    console.error('Error in batch assignment:', error);
    throw error;
  }
};
```

### Advanced Queries

#### Compound Queries
```javascript
const getReportsByDateRange = (startDate, endDate, category = null) => {
  const db = getFirestore();
  let q = query(
    collection(db, 'reports'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'desc')
  );
  
  // Note: Firestore requires composite indexes for complex queries
  if (category) {
    q = query(q, where('category', '==', category));
  }
  
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return reports;
  });
};
```

#### Aggregation Queries (Firestore v9+)
```javascript
import { getCountFromServer, query, where } from 'firebase/firestore';

const getReportCounts = async () => {
  const db = getFirestore();
  
  const totalQuery = query(collection(db, 'reports'));
  const openQuery = query(collection(db, 'reports'), where('status', '==', 'Open'));
  const resolvedQuery = query(collection(db, 'reports'), where('status', '==', 'Resolved'));
  
  const [totalSnap, openSnap, resolvedSnap] = await Promise.all([
    getCountFromServer(totalQuery),
    getCountFromServer(openQuery),
    getCountFromServer(resolvedQuery)
  ]);
  
  return {
    total: totalSnap.data().count,
    open: openSnap.data().count,
    resolved: resolvedSnap.data().count
  };
};
```

## Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'staff'];
    }
    
    // Reports collection access
    match /reports/{reportId} {
      // Anyone authenticated can read reports
      allow read: if request.auth != null;
      
      // Students can create reports
      allow create: if request.auth != null && 
        request.auth.token.email.matches('.*@university\.edu$');
      
      // Staff and admins can update reports
      allow update: if request.auth != null && 
        (getUserRole() in ['admin', 'staff'] ||
         resource.data.assignedTo == request.auth.token.email);
      
      // Only admins can delete reports
      allow delete: if request.auth != null && getUserRole() == 'admin';
    }
    
    // Support tickets
    match /support_tickets/{ticketId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (getUserRole() in ['admin', 'staff'] ||
         resource.data.reporterEmail == request.auth.token.email);
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read, update: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && getUserRole() in ['admin', 'staff'];
    }
    
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
  }
}
```

### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Report images
    match /reports/{reportId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*');
    }
    
    // User profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 2 * 1024 * 1024; // 2MB limit
    }
  }
}
```

## Performance Optimization

### Indexing Strategy
```javascript
// Composite indexes needed for common queries
// These should be created in Firebase Console

// Reports by category and status
// Collection: reports
// Fields: category (Ascending), status (Ascending), timestamp (Descending)

// Reports by assigned staff and status
// Collection: reports  
// Fields: assignedTo (Ascending), status (Ascending), timestamp (Descending)

// Reports by date range
// Collection: reports
// Fields: timestamp (Ascending), category (Ascending)

// Support tickets by user
// Collection: support_tickets
// Fields: reporterEmail (Ascending), createdAt (Descending)
```

### Query Optimization
```javascript
// Use pagination for large datasets
const getPaginatedReports = (pageSize = 25, lastDoc = null) => {
  const db = getFirestore();
  let q = query(
    collection(db, 'reports'),
    orderBy('timestamp', 'desc'),
    limit(pageSize)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return getDocs(q);
};

// Use specific field selection
const getReportSummaries = () => {
  const db = getFirestore();
  return getDocs(query(
    collection(db, 'reports'),
    select('id', 'title', 'status', 'category', 'timestamp')
  ));
};
```

### Offline Persistence
```javascript
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';

// Enable offline persistence
const db = getFirestore();
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.log('The current browser does not support offline persistence');
    }
  });

// Handle online/offline states
window.addEventListener('online', () => {
  enableNetwork(db);
});

window.addEventListener('offline', () => {
  disableNetwork(db);
});
```

## Error Handling

### Common Error Patterns
```javascript
const handleFirebaseError = (error) => {
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action';
    case 'not-found':
      return 'The requested document was not found';
    case 'already-exists':
      return 'A document with this ID already exists';
    case 'failed-precondition':
      return 'The operation failed due to invalid conditions';
    case 'unavailable':
      return 'The service is currently unavailable. Please try again later';
    case 'unauthenticated':
      return 'You must be signed in to perform this action';
    default:
      return 'An unexpected error occurred. Please try again';
  }
};

// Usage in components
const createReportWithErrorHandling = async (reportData) => {
  try {
    const reportId = await createReport(reportData);
    showSuccessMessage('Report created successfully');
    return reportId;
  } catch (error) {
    const errorMessage = handleFirebaseError(error);
    showErrorMessage(errorMessage);
    console.error('Create report error:', error);
    throw error;
  }
};
```

### Retry Logic
```javascript
const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Usage
const robustReportFetch = () => {
  return withRetry(() => getDocs(query(collection(db, 'reports'))));
};
```

## Testing with Firebase

### Firebase Emulator Setup
```javascript
// firebase.test.js
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const testApp = initializeApp({
  projectId: 'test-project-id'
});

const db = getFirestore(testApp);
const auth = getAuth(testApp);

// Connect to emulators
if (!db._delegate._databaseId.database.includes('localhost')) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

if (!auth._delegate.emulatorConfig) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export { db, auth };
```

### Test Data Setup
```javascript
// test-utils.js
import { collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const createTestReport = async (db, overrides = {}) => {
  const testReport = {
    title: 'Test Report',
    description: 'Test description',
    category: 'Dorm',
    type: 'Plumbing',
    status: 'Open',
    reporterEmail: 'test@university.edu',
    timestamp: new Date(),
    ...overrides
  };
  
  const docRef = await addDoc(collection(db, 'reports'), testReport);
  return { id: docRef.id, ...testReport };
};

export const cleanupTestData = async (db) => {
  const collections = ['reports', 'users', 'support_tickets'];
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
};
```

## Monitoring and Analytics

### Custom Events
```javascript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

// Track user actions
export const trackReportCreated = (category, type) => {
  logEvent(analytics, 'report_created', {
    category,
    type,
    timestamp: Date.now()
  });
};

export const trackReportAssigned = (reportId, staffId) => {
  logEvent(analytics, 'report_assigned', {
    report_id: reportId,
    staff_id: staffId
  });
};

export const trackExportAction = (exportType, filterCount) => {
  logEvent(analytics, 'data_exported', {
    export_type: exportType,
    filter_count: filterCount
  });
};
```

### Performance Monitoring
```javascript
import { getPerformance, trace } from 'firebase/performance';

const perf = getPerformance();

// Monitor critical operations
export const monitorReportLoad = async (loadFunction) => {
  const t = trace(perf, 'report_load_time');
  t.start();
  
  try {
    const result = await loadFunction();
    t.stop();
    return result;
  } catch (error) {
    t.stop();
    throw error;
  }
};
```

## Best Practices

### 1. Data Modeling
- Keep document sizes under 1MB
- Avoid deep nesting (max 3-4 levels)
- Use subcollections for large datasets
- Denormalize for read performance

### 2. Security
- Always validate data on both client and server
- Use security rules to enforce permissions
- Implement proper authentication flows
- Regularly audit access logs

### 3. Performance
- Use indexes for all queries
- Implement pagination for large datasets
- Cache frequently accessed data
- Monitor quota usage

### 4. Cost Optimization
- Minimize document reads/writes
- Use appropriate query types
- Implement efficient pagination
- Consider Cloud Functions for server-side operations