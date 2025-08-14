# University Report Dashboard

A comprehensive web-based dashboard system for managing university facility maintenance reports, built with React and Firebase. This application enables universities to efficiently track, manage, and resolve facility-related issues reported by students and staff.

## 🎯 Project Overview

The University Report Dashboard is a complete solution for managing facility maintenance requests including:

- **Real-time Report Management** - Track maintenance requests from submission to resolution
- **Staff Assignment System** - Assign reports to maintenance staff with role-based access
- **Analytics & Reporting** - Comprehensive analytics with charts and PDF export capabilities
- **Support Ticket System** - Handle student inquiries and support requests
- **Review Workflow** - Quality assurance through pending reviews system
- **Mobile-Responsive Design** - Optimized for desktop, tablet, and mobile devices

## 🚀 Tech Stack

- **Frontend**: React 19.1.0, React Router 7.6.1
- **Backend**: Firebase (Firestore, Authentication, Analytics)
- **UI Components**: Material-UI 7.1.1, Custom CSS
- **Charts**: Chart.js 4.4.9, React-Chartjs-2 5.3.0
- **PDF Generation**: jsPDF 3.0.1, jsPDF-AutoTable 5.0.2
- **Maps**: Google Maps API (@react-google-maps/api 2.20.6)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppLayout.js     # Main application layout wrapper
│   ├── Sidebar.js       # Navigation sidebar with menu items
│   ├── PageHeader.js    # Reusable page header component
│   ├── Card.js          # Reusable card component
│   ├── Button.js        # Reusable button component
│   └── FormField.js     # Reusable form input component
├── pages/              # Main application pages/modules
│   ├── Dashboard.js     # Main dashboard with overview statistics
│   ├── Reports.js       # Reports management and listing
│   ├── ReportDetail.js  # Individual report details and management
│   ├── Analytics.js     # Data visualization and analytics
│   ├── PendingReviews.js # Review management for completed reports
│   ├── Support.js       # FAQ and help documentation
│   ├── SupportTickets.js # Support ticket management
│   ├── SupportTicketDetail.js # Individual ticket details
│   └── Login.js         # Authentication page
├── styles/             # Global styles and design system
│   └── GlobalStyles.js  # Centralized styling constants
├── firebase.js         # Firebase configuration and initialization
└── App.js             # Main application with routing setup
```

## 🏗️ Module Documentation

### Core Pages

#### 1. Dashboard (`/src/pages/Dashboard.js`)
**Main overview page displaying key metrics and recent reports**

**Features:**
- Real-time statistics (total reports, open/resolved counts)
- Recent reports list with filtering capabilities
- Staff assignment functionality
- Quick actions for report management
- Responsive card-based layout

**Key Functions:**
- `fetchReports()` - Real-time data fetching from Firestore
- `handleAssignReport()` - Assign reports to staff members
- `handleStatusUpdate()` - Update report status
- Filtering by category, type, and date ranges

#### 2. Reports (`/src/pages/Reports.js`)
**Comprehensive report management with advanced features**

**Features:**
- Complete report listing with pagination
- Advanced filtering (category, type, status, date range)
- Sortable columns (ID, title, category, location, status, date)
- PDF export functionality
- Staff assignment with modal interface
- Items per page customization

**Key Functions:**
- `handleExportPDF()` - Generate PDF reports with styling
- `handleAssignReport()` - Staff assignment workflow
- Pagination controls with configurable page sizes
- Real-time search and filtering

#### 3. Analytics (`/src/pages/Analytics.js`)
**Data visualization and reporting analytics dashboard**

**Features:**
- Interactive charts (line, bar, pie, doughnut)
- Reports by category, status, and location analysis
- Time-based trend analysis
- Top issues identification
- Export capabilities (PDF and Excel/CSV)
- Date range filtering

**Charts Available:**
- Reports over time (line chart)
- Category distribution (pie chart)
- Status breakdown (doughnut chart)
- Location-based analysis (bar chart)
- Top issues ranking

#### 4. Report Detail (`/src/pages/ReportDetail.js`)
**Individual report management with full details**

**Features:**
- Complete report information display
- Status update functionality
- Staff assignment and reassignment
- Contact information with WhatsApp integration
- Location details (faculty/dorm specifics)
- Resolution notes and timestamps
- Image attachments support

**Key Functions:**
- `handleStatusUpdate()` - Update report status with notes
- `handleAssignStaff()` - Assign or reassign staff members
- `formatWhatsAppUrl()` - Generate WhatsApp contact links
- Responsive design for mobile viewing

#### 5. Pending Reviews (`/src/pages/PendingReviews.js`)
**Quality assurance workflow for completed reports**

**Features:**
- Review queue for resolved reports
- Detailed review modal with complete report information
- Reporter contact details
- Approval/rejection workflow
- Notes and feedback system

**Review Process:**
- Staff completes report → Status: "Pending Review"
- Admin reviews completion → Approve or request changes
- Final status update to "Resolved" or back to "In Progress"

#### 6. Support Tickets (`/src/pages/SupportTickets.js`)
**Student support ticket management system**

**Features:**
- Ticket listing with status tracking
- Category-based organization
- Priority handling
- Search and filtering capabilities
- Status update workflow
- Response management

**Ticket Categories:**
- Technical issues
- Account problems
- General inquiries
- Feature requests

#### 7. Support (`/src/pages/Support.js`)
**Help documentation and FAQ system**

**Features:**
- Comprehensive FAQ section
- Contact information
- Feature documentation
- User guides and tutorials
- Searchable help content

### Core Components

#### 1. AppLayout (`/src/components/AppLayout.js`)
**Main application wrapper providing consistent layout**

**Features:**
- Responsive design system
- Sidebar integration
- Mobile viewport optimization
- Global styling application
- CSS-in-JS responsive styles

#### 2. Sidebar (`/src/components/Sidebar.js`)
**Navigation component with responsive design**

**Features:**
- Role-based menu items
- Active route highlighting
- Mobile bottom navigation
- Logout functionality
- Collapsible mobile menu

**Menu Structure:**
- Main Menu: Dashboard, Reports, Reviews, Analytics, Support Tickets
- Management: Support, Logout

#### 3. PageHeader (`/src/components/PageHeader.js`)
**Reusable header component for consistent page structure**

**Features:**
- Customizable titles and subtitles
- Breadcrumb support
- Action button integration
- Responsive typography

### Firebase Integration

#### Authentication (`/src/firebase.js`)
**Secure user authentication system**

**Features:**
- Email/password authentication
- Role-based access control
- Session management
- Protected route implementation

**Configuration:**
```javascript
// Firebase configuration includes:
// - Authentication domain
// - Firestore database
// - Storage bucket
// - Analytics integration
```

#### Database Collections

**1. `reports` Collection:**
```javascript
{
  id: "auto-generated",
  title: "Report title",
  description: "Detailed description",
  category: "Dorm|Faculty|Library|Sports|Other",
  type: "Electrical|Plumbing|HVAC|Structural|Other",
  status: "Open|In Progress|Resolved|Pending Review",
  priority: "Low|Medium|High|Critical",
  reporterName: "Student/Staff name",
  reporterEmail: "email@university.edu",
  reporterPhone: "+60123456789",
  location: { lat: number, lng: number },
  faculty: "Faculty name",
  room: "Room number",
  floor: "Floor number",
  assignedTo: "staff@university.edu",
  assignedStaffName: "Staff member name",
  timestamp: Firestore.Timestamp,
  resolutionTimestamp: Firestore.Timestamp,
  resolutionNote: "Resolution details"
}
```

**2. `support_tickets` Collection:**
```javascript
{
  id: "auto-generated",
  subject: "Ticket subject",
  description: "Detailed description",
  category: "Technical|Account|General|Feature",
  status: "Open|In Progress|Resolved|Closed",
  priority: "Low|Medium|High",
  reporterName: "User name",
  reporterEmail: "user@university.edu",
  createdAt: Firestore.Timestamp,
  updatedAt: Firestore.Timestamp,
  assignedTo: "support@university.edu"
}
```

**3. `users` Collection:**
```javascript
{
  id: "user-uid",
  email: "user@university.edu",
  displayName: "User Name",
  role: "admin|staff|student",
  department: "Department name",
  createdAt: Firestore.Timestamp
}
```

## 🔧 Setup and Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Firebase project with Firestore enabled
- Google Maps API key (for location features)

### Installation Steps

1. **Clone the repository:**
```bash
git clone https://github.com/irzazman/university-report-dashboard.git
cd university-report-dashboard
```

2. **Install dependencies:**
```bash
npm install
```

3. **Firebase Setup:**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Analytics (optional)
   - Copy your Firebase configuration

4. **Environment Configuration:**
   - Update `/src/firebase.js` with your Firebase configuration:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

5. **Firestore Security Rules:**
   Configure appropriate security rules for your collections:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reports collection
    match /reports/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Support tickets
    match /support_tickets/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. **Google Maps Setup (Optional):**
   - Get Google Maps API key
   - Enable Maps JavaScript API and Places API
   - Add API key to your environment

### Development

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## 📱 Usage Guide

### For Administrators

1. **Dashboard Overview:**
   - View summary statistics
   - Monitor recent reports
   - Quick staff assignments

2. **Report Management:**
   - Filter and search reports
   - Assign staff to reports
   - Update report status
   - Export data to PDF

3. **Analytics:**
   - Monitor trends and patterns
   - Generate reports
   - Export analytics data

4. **Quality Control:**
   - Review completed reports
   - Approve or request revisions
   - Manage workflow

### For Staff Members

1. **View Assigned Reports:**
   - Access reports assigned to you
   - Update progress status
   - Add resolution notes

2. **Support Tickets:**
   - Respond to student inquiries
   - Update ticket status
   - Manage workload

### For Students (Mobile App Integration)

The dashboard is designed to work with a companion mobile app where students can:
- Submit facility reports
- Track report status
- Submit support tickets
- Receive notifications

## 🚀 Deployment

### Firebase Hosting

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login and Initialize:**
```bash
firebase login
firebase init hosting
```

3. **Build and Deploy:**
```bash
npm run build
firebase deploy
```

### Alternative Deployment Options

- **Netlify**: Connect GitHub repository for automatic deployments
- **Vercel**: Simple deployment with GitHub integration
- **AWS Amplify**: Full-stack deployment with AWS services

## 🎨 Design System

### Color Palette
```javascript
const colors = {
  primary: '#4361ee',      // Main brand color
  secondary: '#3f37c9',    // Secondary actions
  success: '#4cc9f0',      // Success states
  warning: '#f72585',      // Warning/error states
  info: '#4895ef',         // Information
  accent: '#560bad',       // Accent highlights
  lightBg: '#f8f9fa',      // Background
  darkText: '#212529',     // Primary text
  lightBorder: '#e9ecef'   // Borders
};
```

### Typography
```javascript
const typography = {
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px'
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};
```

### Responsive Breakpoints
```javascript
const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px'
};
```

## 🔒 Security Features

- **Authentication**: Firebase Authentication with email/password
- **Authorization**: Role-based access control (Admin, Staff, Student)
- **Data Validation**: Client and server-side validation
- **Secure Rules**: Firestore security rules
- **HTTPS**: All communications encrypted
- **XSS Protection**: Input sanitization

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📈 Performance Optimization

- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images with proper sizing
- **Caching**: Firebase offline persistence
- **Bundle Analysis**: Use `npm run build` to analyze bundle size

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Issues:**
   - Verify Firebase configuration
   - Check network connectivity
   - Ensure proper security rules

2. **Authentication Problems:**
   - Check Firebase Authentication settings
   - Verify email/password configuration
   - Review user permissions

3. **Build Failures:**
   - Clear node_modules and reinstall
   - Check for dependency conflicts
   - Verify Node.js version compatibility

### Getting Help

- Check the Support page within the application
- Review Firebase documentation
- Contact the development team

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Development Team**: University IT Department
- **Maintenance**: Facility Management Team
- **Support**: Student Services

## 📞 Contact

For technical support or inquiries:
- Email: support@university.edu
- Phone: +60 3-1234 5678
- Website: https://university.edu/support

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**React Version**: 19.1.0  
**Firebase Version**: 11.8.1
