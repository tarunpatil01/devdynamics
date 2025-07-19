import React, { useState, useRef, useEffect } from 'react';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const username = params.get('username');

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const res = await fetch(`${baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Reset failed');
      setMessage('Password reset successful! You can now login.');
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2500);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!token || !username) return <div className="text-red-500 p-8">Invalid or expired reset link.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-2">
      <form className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-blue-900 p-8 flex flex-col gap-4 animate-fadein" onSubmit={handleReset} aria-label="Reset Password Form">
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center drop-shadow">Reset Password</h2>
        <input
          ref={inputRef}
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          aria-label="New Password"
          disabled={success}
        />
        {message && <div className={`text-center ${success ? 'text-green-400' : 'text-blue-400'}`}>{message}</div>}
        <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-bold shadow transition-all duration-200" disabled={success}>
          Reset Password
        </button>
        {success && <button type="button" className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 py-2 rounded-lg font-bold shadow transition-all duration-200" onClick={() => window.location.href = '/'}>Back to Login</button>}
      </form>
    </div>
  );
};

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const forgotInputRef = useRef(null);

  useEffect(() => {
    if (showForgot && forgotInputRef.current) forgotInputRef.current.focus();
  }, [showForgot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const res = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.message && data.message.toLowerCase().includes('invalid credentials')) {
          setError('User not found. Please register first.');
        } else {
          setError(data.message || 'Login failed');
        }
        setLoading(false);
        return;
      }
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setResetLink('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const res = await fetch(`${baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUser })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to generate reset link');
      setForgotMsg('Reset link generated! (For demo, see below)');
      setResetLink(data.resetLink);
      setTimeout(() => setShowForgot(false), 2500);
    } catch (err) {
      setForgotMsg(err.message);
    }
  };

  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-2">
      <form
        className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-blue-900 p-8 flex flex-col gap-4 animate-fadein"
        onSubmit={handleSubmit}
        aria-label="Login Form"
      >
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center drop-shadow">Login</h2>
        <div className="mb-2">
          <label className="block text-gray-300 mb-1 font-semibold">Username</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            aria-label="Username"
            disabled={loading}
          />
        </div>
        <div className="mb-2">
          <label className="block text-gray-300 mb-1 font-semibold">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            aria-label="Password"
            disabled={loading}
          />
        </div>
        {error && <div className="text-red-500 mb-2 text-center animate-shake" role="alert">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-bold shadow transition-all duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 py-2 rounded-lg font-bold shadow transition-all duration-200"
          onClick={onSwitchToRegister}
          disabled={loading}
        >
          Don't have an account? <span className="underline">Register</span>
        </button>
        <div className="mt-2 text-center">
          <button type="button" className="text-blue-400 hover:underline text-sm" onClick={() => setShowForgot(true)} disabled={loading}>
            Forgot password?
          </button>
        </div>
      </form>
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fadein" role="dialog" aria-modal="true">
          <form className="bg-zinc-900/90 p-8 rounded-2xl shadow-2xl border-2 border-blue-900 flex flex-col gap-4 w-full max-w-xs animate-fadein" onSubmit={handleForgot} aria-label="Forgot Password Form">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Forgot Password</h3>
            <input
              ref={forgotInputRef}
              type="text"
              placeholder="Enter your username"
              value={forgotUser}
              onChange={e => setForgotUser(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              aria-label="Username for password reset"
              disabled={!!resetLink}
            />
            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-bold shadow transition-all duration-200" disabled={!!resetLink}>
              Send Reset Link
            </button>
            {forgotMsg && <div className="text-blue-400 text-center">{forgotMsg}</div>}
            {resetLink && <div className="text-xs text-green-400 break-all text-center mt-2">Reset Link: <a href={resetLink} className="underline" target="_blank" rel="noopener noreferrer">{resetLink}</a></div>}
            <button type="button" className="mt-2 text-gray-400 hover:underline text-xs" onClick={() => setShowForgot(false)}>
              Close
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;
