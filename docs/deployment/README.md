# Deployment Guide

## Overview
This guide covers various deployment options for the University Report Dashboard, including Firebase Hosting, Netlify, Vercel, and traditional web servers.

## Prerequisites
- Completed development setup
- Firebase project configured
- Production environment variables
- Domain name (optional)

## Firebase Hosting (Recommended)

Firebase Hosting provides seamless integration with Firebase services and CDN distribution.

### Setup Process

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Firebase Hosting**
```bash
firebase init hosting
```

Select:
- Use existing project (your university project)
- Public directory: `build`
- Single-page app: `Yes`
- Overwrite index.html: `No`

4. **Build Production Version**
```bash
npm run build
```

5. **Deploy to Firebase**
```bash
firebase deploy --only hosting
```

### Firebase Configuration

Create `firebase.json`:
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Custom Domain Setup

1. **Add Custom Domain in Firebase Console**
   - Go to Hosting section
   - Click "Add custom domain"
   - Enter your domain name

2. **DNS Configuration**
   - Add A records pointing to Firebase IPs
   - Add TXT record for verification

3. **SSL Certificate**
   - Firebase automatically provisions SSL certificates
   - May take up to 24 hours to activate

## Netlify Deployment

Netlify offers excellent CI/CD integration with GitHub.

### GitHub Integration

1. **Connect Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Select GitHub and your repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: 16 or higher

3. **Environment Variables**
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### Netlify Configuration

Create `netlify.toml`:
```toml
[build]
  publish = "build"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "16"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

## Vercel Deployment

Vercel provides excellent performance and developer experience.

### GitHub Integration

1. **Import Project**
   - Go to Vercel dashboard
   - Click "Import Project"
   - Select your GitHub repository

2. **Build Configuration**
   - Framework preset: Create React App
   - Build command: `npm run build`
   - Output directory: `build`

### Vercel Configuration

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_FIREBASE_API_KEY": "@firebase_api_key",
    "REACT_APP_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain",
    "REACT_APP_FIREBASE_PROJECT_ID": "@firebase_project_id"
  }
}
```

## Traditional Web Server

Deploy to Apache, Nginx, or other web servers.

### Build Process

1. **Create Production Build**
```bash
npm run build
```

2. **Upload Build Files**
   - Upload contents of `build/` folder to web server
   - Ensure proper file permissions

### Apache Configuration

Create `.htaccess` in build directory:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## Environment Configuration

### Production Environment Variables

Create production `.env.production`:
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Application Settings
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_SUPPORT_EMAIL=support@university.edu

# Google Maps (if used)
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Analytics
REACT_APP_GA_TRACKING_ID=your_ga_id
```

### Security Considerations

1. **Environment Variables**
   - Never commit sensitive keys to git
   - Use deployment platform's environment variable system
   - Rotate keys regularly

2. **Firebase Security**
   - Configure proper security rules
   - Enable authentication
   - Set up proper CORS

3. **HTTPS**
   - Always use HTTPS in production
   - Configure proper SSL certificates
   - Implement HSTS headers

## Performance Optimization

### Build Optimization

1. **Bundle Analysis**
```bash
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

2. **Code Splitting**
```javascript
// Lazy load heavy components
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));

// Use with Suspense
<Suspense fallback={<Loading />}>
  <Analytics />
</Suspense>
```

### CDN Configuration

1. **Static Assets**
   - Move images to CDN
   - Use optimized image formats (WebP)
   - Implement responsive images

2. **Font Optimization**
```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

/* Use font-display: swap */
@font-face {
  font-family: 'Inter';
  font-display: swap;
  src: url('/fonts/inter.woff2') format('woff2');
}
```

## Monitoring and Maintenance

### Error Tracking

1. **Sentry Integration**
```bash
npm install @sentry/react @sentry/tracing
```

```javascript
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    new Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
});
```

2. **Performance Monitoring**
```javascript
// Monitor Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Health Checks

1. **Application Health**
```javascript
// /src/utils/healthCheck.js
export const performHealthCheck = async () => {
  const checks = {
    firebase: false,
    authentication: false,
    database: false
  };

  try {
    // Test Firebase connection
    const db = getFirestore();
    await getDocs(query(collection(db, 'reports'), limit(1)));
    checks.firebase = true;
    checks.database = true;

    // Test authentication
    const auth = getAuth();
    if (auth.currentUser) {
      checks.authentication = true;
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }

  return checks;
};
```

2. **Uptime Monitoring**
   - Use services like Pingdom, StatusCake, or UptimeRobot
   - Monitor critical endpoints
   - Set up alerting for downtime

### Backup and Recovery

1. **Database Backups**
```bash
# Export Firestore data
gcloud firestore export gs://your-backup-bucket/backups/$(date +%Y%m%d_%H%M%S)
```

2. **Code Backups**
   - Ensure git repository is backed up
   - Use multiple remotes (GitHub, GitLab, etc.)
   - Regular backup verification

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test -- --coverage --ci
    
    - name: Build application
      run: npm run build
      env:
        REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
        REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-project-id
```

### Staging Environment

1. **Separate Firebase Project**
   - Create staging Firebase project
   - Use different environment variables
   - Test all changes before production

2. **Branch-based Deployments**
```yaml
# Deploy feature branches to preview
- name: Deploy Preview
  if: github.event_name == 'pull_request'
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: '${{ secrets.GITHUB_TOKEN }}'
    firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
    projectId: your-project-id
```

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all environment variables are set
   - Clear npm cache: `npm cache clean --force`

2. **Firebase Authentication Issues**
   - Verify domain is added to authorized domains
   - Check API key permissions
   - Ensure proper security rules

3. **Performance Issues**
   - Enable Firebase offline persistence
   - Implement proper caching headers
   - Optimize bundle size

### Rollback Procedures

1. **Firebase Hosting**
```bash
# List previous deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:channel:deploy production --only hosting
```

2. **Git-based Rollback**
```bash
# Revert to previous commit
git revert HEAD

# Force push (use with caution)
git push origin main --force
```

## Security Checklist

- [ ] HTTPS enabled with valid certificate
- [ ] Environment variables secured
- [ ] Firebase security rules properly configured
- [ ] Regular security updates applied
- [ ] Error messages don't expose sensitive information
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if applicable)
- [ ] User input sanitized
- [ ] Authentication properly implemented
- [ ] Audit logs enabled

## Post-Deployment

### Launch Checklist

- [ ] Verify all core functionality works
- [ ] Test user authentication flows
- [ ] Confirm real-time updates working
- [ ] Validate PDF export functionality
- [ ] Check mobile responsiveness
- [ ] Verify email notifications
- [ ] Test error handling
- [ ] Confirm analytics tracking
- [ ] Validate backup systems
- [ ] Set up monitoring alerts

### User Training

1. **Administrator Training**
   - Dashboard overview
   - Report management
   - User administration
   - Analytics interpretation

2. **Staff Training**
   - Report assignment process
   - Status update procedures
   - Mobile app usage
   - Communication protocols

3. **Documentation**
   - User manuals
   - Video tutorials
   - FAQ updates
   - Support procedures

## Support and Maintenance

### Ongoing Tasks

1. **Weekly Tasks**
   - Monitor application performance
   - Check error logs
   - Verify backup integrity
   - Review user feedback

2. **Monthly Tasks**
   - Security updates
   - Dependency updates
   - Performance optimization
   - User access review

3. **Quarterly Tasks**
   - Full security audit
   - Disaster recovery testing
   - User training updates
   - Feature planning

### Contact Information

- **Technical Support**: dev-team@university.edu
- **User Support**: support@university.edu
- **Emergency Contact**: emergency-it@university.edu
- **Project Manager**: pm@university.edu