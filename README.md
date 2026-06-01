# SocietySphere Client - React + Vite Frontend

A modern, elegant community management platform frontend built with React 18 and Vite. This is the user-facing application for residents, admins, and security staff.

## 🌟 Features

### For Residents
- **Dashboard:** Personal hub with maintenance bills, complaints, visitor approvals, and society notices
- **Visitor Management:** Pre-approve guests with QR-based digital passes
- **Complaint Tracking:** File and track complaints with status updates
- **Payment Management:** View payment history and pending dues

### For Admins
- **Society Management:** Manage residents, billing cycles, and access controls
- **Maintenance Billing:** Auto-generate invoices with customizable charges
- **Complaint Resolution:** Track and resolve resident complaints
- **Notices:** Broadcast announcements via push, email, and SMS
- **Analytics:** View key metrics and collection status

### For Security/Guards
- **Visitor Check-in:** Scan QR codes for visitor entries
- **Pre-approvals:** View and manage pre-approved visitors
- **Entry Logs:** Maintain detailed visitor entry/exit records
- **Quick Actions:** Approve/reject visitor requests on the fly

## 🛠️ Tech Stack

- **React 18** - UI framework with hooks
- **Vite 4** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **CSS-in-JS** - Inline styling with theme tokens

## 📦 Installation

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API server URL:
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

3. **Start development server:**
```bash
npm run dev
```

Opens http://localhost:5173 in your browser (Vite's default port)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Common.js       # Button, Card, Input, Badge, Logo
│   └── Layout.js       # Navbar, Footer
├── pages/              # Page components
│   ├── Landing.js      # Marketing landing page
│   ├── Auth.js         # Login & Signup
│   ├── ResidentDashboard.js
│   ├── AdminDashboard.js
│   └── GuardDashboard.js
├── context/            # State management
│   └── AuthContext.js  # Auth state & logic
├── hooks/              # Custom React hooks
│   └── useAuth.js      # Auth hook
├── styles/             # Global CSS
│   └── global.css      # Animations, resets, utilities
├── theme.js            # Design tokens (colors, fonts, spacing)
├── App.js              # Main app with routing
└── index.js            # React entry point
```

## 🎨 Design System

### Colors
- **Primary:** Jade Green (#22D9A0)
- **Secondary:** Gold (#E8A64C)
- **Background:** Deep Navy (#070F20)
- **Surface:** Light Navy (#0D1A32)
- **Text:** Off-white (#ECF0F7)
- **Muted:** Slate (#7B8CA8)

### Typography
- **Headings:** Cormorant Garamond (serif)
- **Body:** Outfit (sans-serif)

### Components
All components are designed to match the Figma mockup with:
- Consistent spacing and padding
- Hover states and transitions
- Responsive breakpoints
- Dark theme as default

## 🚀 Quick Start Guide

### Login

1. Navigate to `/auth?mode=login`
2. Select your role (Resident, Admin, or Security)
3. Enter credentials
4. Click "Sign In"

### Sign Up

1. Navigate to `/auth?mode=signup`
2. Select your role
3. Fill in basic info (Step 1)
4. Set password (Step 2)
5. Click "Create Account"

### Access Dashboard

After login, you're automatically routed to your role-specific dashboard:
- **Resident:** `/dashboard` → Resident Dashboard
- **Admin:** `/dashboard` → Admin Dashboard
- **Guard:** `/dashboard` → Guard Dashboard

## 🔌 API Integration

The app communicates with the backend at `http://localhost:5000`. All requests include the auth token in headers.

### Authentication Flow
```
Login/Signup → Get Token → Store in localStorage → Add to all requests
```

### Example API Call
```javascript
const { token } = useAuth();

fetch('/api/complaints', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

## 🎯 Common Tasks

### Add a New Page
1. Create component in `src/pages/NewPage.js`
2. Add route in `src/App.js`
3. Import and use components from `src/components/`

### Create a New Component
```jsx
import { COLORS, FONTS } from '../theme';
import { Card, Button } from './Common';

const MyComponent = ({ title, data }) => (
  <Card>
    <h3 style={{ color: COLORS.text, fontFamily: FONTS.serif }}>
      {title}
    </h3>
    {/* Content */}
  </Card>
);

export default MyComponent;
```

### Use Authentication
```jsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome {user?.name}</p>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
};
```

## 📱 Responsive Design

The design is mobile-first but currently optimized for desktop (1024px+).

Breakpoints defined in `theme.js`:
- Mobile: 480px
- Tablet: 768px
- Desktop: 1024px
- Wide: 1440px

## 🧪 Testing

Currently no automated tests. For manual testing:
1. Test all three user roles separately
2. Verify form validation works
3. Check API error handling
4. Test navigation flows
5. Verify responsive behavior

## 🐛 Troubleshooting

### "Cannot find module" Error
```bash
npm install
```

### Port 5173 Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### API Calls Failing
- Check if backend server is running (`npm run dev` in `/server`)
- Verify API URL in `.env.local`
- Check browser console for CORS errors

### Auth Token Issues
- Clear localStorage: `localStorage.clear()` in console
- Log out and log in again
- Check token expiration

## 📚 Documentation

See `FRONTEND_DOCUMENTATION.md` in the root for:
- Complete API reference
- Component documentation
- Adding new features
- Code patterns and standards

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Creates optimized build in `dist/` directory

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
Connect GitHub repo to Netlify and configure:
- Build command: `npm run build`
- Publish directory: `dist`

### Deploy to VPS
Upload the `dist/` folder to your web server

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code standards
3. Test thoroughly
4. Submit pull request

## 📄 License

ISC

## 📞 Support

- **Issues:** Check GitHub issues
- **Docs:** Read FRONTEND_DOCUMENTATION.md
- **Team:** Contact development team

---

**Version:** 1.0.0  
**Last Updated:** May 2025
```

Edit `.env.local` with your API server URL:
```
REACT_APP_API_URL=http://localhost:5000
```

3. **Start development server:**
```bash
npm start
```

Opens http://localhost:3000 in your browser

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Common.js       # Button, Card, Input, Badge, Logo
│   └── Layout.js       # Navbar, Footer
├── pages/              # Page components
│   ├── Landing.js      # Marketing landing page
│   ├── Auth.js         # Login & Signup
│   ├── ResidentDashboard.js
│   ├── AdminDashboard.js
│   └── GuardDashboard.js
├── context/            # State management
│   └── AuthContext.js  # Auth state & logic
├── hooks/              # Custom React hooks
│   └── useAuth.js      # Auth hook
├── styles/             # Global CSS
│   └── global.css      # Animations, resets, utilities
├── theme.js            # Design tokens (colors, fonts, spacing)
├── App.js              # Main app with routing
└── index.js            # React entry point
```

## 🎨 Design System

### Colors
- **Primary:** Jade Green (#22D9A0)
- **Secondary:** Gold (#E8A64C)
- **Background:** Deep Navy (#070F20)
- **Surface:** Light Navy (#0D1A32)
- **Text:** Off-white (#ECF0F7)
- **Muted:** Slate (#7B8CA8)

### Typography
- **Headings:** Cormorant Garamond (serif)
- **Body:** Outfit (sans-serif)

### Components
All components are designed to match the Figma mockup with:
- Consistent spacing and padding
- Hover states and transitions
- Responsive breakpoints
- Dark theme as default

## 🚀 Quick Start Guide

### Login

1. Navigate to `/auth?mode=login`
2. Select your role (Resident, Admin, or Security)
3. Enter credentials
4. Click "Sign In"

### Sign Up

1. Navigate to `/auth?mode=signup`
2. Select your role
3. Fill in basic info (Step 1)
4. Set password (Step 2)
5. Click "Create Account"

### Access Dashboard

After login, you're automatically routed to your role-specific dashboard:
- **Resident:** `/dashboard` → Resident Dashboard
- **Admin:** `/dashboard` → Admin Dashboard
- **Guard:** `/dashboard` → Guard Dashboard

## 🔌 API Integration

The app communicates with the backend at `http://localhost:5000`. All requests include the auth token in headers.

### Authentication Flow
```
Login/Signup → Get Token → Store in localStorage → Add to all requests
```

### Example API Call
```javascript
const { token } = useAuth();

fetch('/api/complaints', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

## 🎯 Common Tasks

### Add a New Page
1. Create component in `src/pages/NewPage.js`
2. Add route in `src/App.js`
3. Import and use components from `src/components/`

### Create a New Component
```jsx
import { COLORS, FONTS } from '../theme';
import { Card, Button } from './Common';

const MyComponent = ({ title, data }) => (
  <Card>
    <h3 style={{ color: COLORS.text, fontFamily: FONTS.serif }}>
      {title}
    </h3>
    {/* Content */}
  </Card>
);

export default MyComponent;
```

### Use Authentication
```jsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome {user?.name}</p>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
};
```

## 📱 Responsive Design

The design is mobile-first but currently optimized for desktop (1024px+). 

Breakpoints defined in `theme.js`:
- Mobile: 480px
- Tablet: 768px
- Desktop: 1024px
- Wide: 1440px

## 🧪 Testing

Currently no automated tests. For manual testing:
1. Test all three user roles separately
2. Verify form validation works
3. Check API error handling
4. Test navigation flows
5. Verify responsive behavior

## 🐛 Troubleshooting

### "Cannot find module" Error
```bash
npm install
```

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 npm start
```

### API Calls Failing
- Check if backend server is running (`npm run dev` in `/server`)
- Verify API URL in `.env.local`
- Check browser console for CORS errors

### Auth Token Issues
- Clear localStorage: `localStorage.clear()` in console
- Log out and log in again
- Check token expiration

## 📚 Documentation

See `FRONTEND_DOCUMENTATION.md` in the root for:
- Complete API reference
- Component documentation
- Adding new features
- Code patterns and standards

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Creates optimized build in `build/` directory

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
Connect GitHub repo to Netlify and configure:
- Build command: `npm run build`
- Publish directory: `build`

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code standards
3. Test thoroughly
4. Submit pull request

## 📄 License

ISC

## 📞 Support

- **Issues:** Check GitHub issues
- **Docs:** Read FRONTEND_DOCUMENTATION.md
- **Team:** Contact development team

---

**Version:** 1.0.0  
**Last Updated:** May 2025
