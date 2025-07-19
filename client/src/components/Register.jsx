import React, { useState } from 'react';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');
      setSuccess('Registration successful! You can now login.');
      if (onRegister) onRegister();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-2">
      <form
        className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-blue-900 p-8 flex flex-col gap-4 animate-fadein"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-extrabold text-white mb-2 text-center drop-shadow">Register</h2>
        <div className="mb-2">
          <label className="block text-gray-300 mb-1 font-semibold">Username</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
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
          />
        </div>
        {error && <div className="text-red-500 mb-2 text-center animate-shake">{error}</div>}
        {success && <div className="text-green-500 mb-2 text-center animate-fadein">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-bold shadow transition-all duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 py-2 rounded-lg font-bold shadow transition-all duration-200"
          onClick={onSwitchToLogin}
        >
          Already have an account? <span className="underline">Login</span>
        </button>
      </form>
    </div>
  );
};

export default Register;
