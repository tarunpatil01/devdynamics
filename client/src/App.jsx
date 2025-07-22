import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import ExpensesPage from './components/ExpensesPage';
import Groups from './components/Groups';

function App() {
  const token = localStorage.getItem('token');
  console.log('Token in App.jsx:', token);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/login" />} />
      <Route path="/expenses" element={token ? <ExpensesPage /> : <Navigate to="/login" />} />
      <Route path="/groups" element={token ? <Groups /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
