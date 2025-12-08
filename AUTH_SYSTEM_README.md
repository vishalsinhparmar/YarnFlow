# YarnFlow Authentication System

## Overview
A complete authentication system has been implemented for YarnFlow with login, registration, and protected routes.

## Features Implemented

### Backend (Server)
1. **Auth Controller** (`server/src/controller/authController.js`)
   - `register`: Create new user accounts
   - `login`: Authenticate users and generate JWT tokens
   - `verifyToken`: Validate JWT tokens

2. **Auth Middleware** (`server/src/middleware/authMiddleware.js`)
   - Validates JWT tokens from Authorization header
   - Protects routes requiring authentication

3. **Auth Routes** (`server/src/routes/authRoutes.js`)
   - `POST /auth/register` - Register new user
   - `POST /auth/login` - Login user
   - `GET /auth/verify` - Verify token (protected)

4. **User Model** (`server/src/models/user.model.js`)
   - Simple schema with email, password (hashed), and role
   - Default role: "Admin"

### Frontend (Client)

1. **Auth API Service** (`client/src/services/authAPI.js`)
   - API calls for register, login, and token verification

2. **Auth Context** (`client/src/context/AuthContext.jsx`)
   - Global authentication state management
   - Handles login, register, logout
   - Auto-verifies token on app load
   - Remember me functionality (stores credentials in localStorage)

3. **Protected Route Component** (`client/src/components/ProtectedRoute/ProtectedRoute.jsx`)
   - Wraps protected routes
   - Redirects to login if not authenticated
   - Shows loading state during verification

4. **Login Page** (`client/src/pages/Login.jsx`)
   - Beautiful, modern UI with gradient background
   - Email and password fields with validation
   - Show/hide password toggle
   - Remember me checkbox (auto-fills credentials)
   - Success toast on login
   - Responsive design

5. **Register Page** (`client/src/pages/Register.jsx`)
   - Beautiful, modern UI matching login page
   - Email, password, and confirm password fields
   - Client-side validation
   - Password strength requirements
   - Success toast on registration
   - Responsive design

6. **Updated Navbar** (`client/src/components/NavbarApp/NavbarApp.jsx`)
   - Displays authenticated user's email
   - Shows user role
   - Dropdown menu with user info
   - Logout button with confirmation

7. **Updated App.jsx**
   - Wrapped with AuthProvider
   - Public routes: `/login`, `/register`
   - Protected routes: All dashboard and admin routes
   - Auto-redirect to dashboard after login

## How It Works

### Registration Flow
1. User visits `/register`
2. Fills in email and password
3. Password is hashed on backend using bcrypt
4. JWT token is generated and returned
5. Token and user data stored in localStorage
6. User redirected to dashboard

### Login Flow
1. User visits `/login`
2. If "Remember Me" was checked previously, credentials are auto-filled
3. User enters email and password
4. Backend validates credentials
5. JWT token generated and returned
6. Token and user data stored in localStorage
7. If "Remember Me" checked, credentials saved to localStorage
8. Success toast displayed
9. User redirected to dashboard

### Protected Routes
1. All routes under `/` (except login/register) are protected
2. ProtectedRoute component checks authentication status
3. If not authenticated, redirects to `/login`
4. If authenticated, renders the requested page

### Token Verification
1. On app load, AuthContext checks for stored token
2. If token exists, calls `/auth/verify` endpoint
3. If valid, user state is restored
4. If invalid, token is cleared and user redirected to login

### Logout Flow
1. User clicks logout in navbar dropdown
2. Token and user data cleared from localStorage
3. Success toast displayed
4. User redirected to login page

## Remember Me Feature
- When checked, stores email and password in localStorage
- Auto-fills credentials on next visit
- Unchecking removes stored credentials
- Useful for client users who don't want to remember credentials

## Security Features
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiration
- Protected routes require valid token
- Token verification on app load
- Secure password input with show/hide toggle

## API Endpoints

### Register
```
POST /auth/register
Body: { email: string, password: string }
Response: { success: true, data: { id, email, role }, token }
```

### Login
```
POST /auth/login
Body: { email: string, password: string }
Response: { success: true, data: { id, email, role }, token }
```

### Verify Token
```
GET /auth/verify
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, data: { id, email, role } }
```

## Environment Variables
Make sure these are set in your `.env` files:

```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

## Testing the System

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd client
   npm run dev
   ```

3. Visit `http://localhost:5173/register` to create an account
4. Login at `http://localhost:5173/login`
5. Access the dashboard and other protected routes
6. Test the logout functionality

## Notes
- The system is production-ready
- Simple validation (email and password only)
- No unnecessary complexity
- Clean, modern UI
- Toast notifications for user feedback
- Responsive design for all screen sizes
