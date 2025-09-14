import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import ExpensesPage from './components/ExpensesPage';
import GroupsPage from './components/GroupsPage';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Listen for custom auth token change events or storage changes (multi-tab)
  useEffect(() => {
    const handleTokenChange = () => {
      const current = localStorage.getItem('token');
      setToken(current);
    };
    window.addEventListener('storage', handleTokenChange);
    window.addEventListener('auth-token-changed', handleTokenChange);
    return () => {
      window.removeEventListener('storage', handleTokenChange);
      window.removeEventListener('auth-token-changed', handleTokenChange);
    };
  }, []);

  return (
    <Routes>
      {/* Root route: send authenticated users to dashboard, others to login */}
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/login" replace />} />
      <Route path="/expenses" element={token ? <ExpensesPage /> : <Navigate to="/login" replace />} />
      <Route path="/groups" element={token ? <GroupsPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
