import React, { useState, useRef, useEffect } from 'react';
import Toast from './Toast';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const res = await fetch(`${baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');
      setSuccess('Registration successful! You can now login.');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-2">
      <form
        className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-blue-900 p-8 flex flex-col gap-4 animate-fadein"
        onSubmit={handleSubmit}
        aria-label="Register Form"
      >
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center drop-shadow">Register</h2>
        <div className="mb-2">
          <label className="block font-semibold mb-1 text-blue-200">Username</label>
          <input
            ref={inputRef}
            type="text"
            className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            aria-label="Username"
            disabled={loading}
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1 text-blue-200">Password</label>
          <input
            type="password"
            className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            aria-label="Password"
            disabled={loading}
          />
        </div>
        {error && showToast && <Toast message={error} type="error" onClose={() => setShowToast(false)} />}
        {success && showToast && <Toast message={success} type="success" onClose={() => setShowToast(false)} />}
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white rounded px-4 py-2 font-bold shadow transition disabled:opacity-50 mt-2"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 py-2 rounded-lg font-bold shadow transition-all duration-200"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Already have an account? <span className="underline">Login</span>
        </button>
      </form>
    </div>
  );
};

export default Register;
