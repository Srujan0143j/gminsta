import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout & Common
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Main Pages
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Reels from './pages/Reels';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-premium-lightBg dark:bg-premium-darkBg flex items-center justify-center">
        <Loader2 className="animate-spin text-instagram-blue" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Main Layout Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Feed />} />
                <Route path="explore" element={<Explore />} />
                <Route path="reels" element={<Reels />} />
                <Route path="messages" element={<Messages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>

              {/* Redirects */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
