import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ showGroups, setShowGroups, sidebarOpen, setSidebarOpen }) => {
  const username = localStorage.getItem('username');
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full w-72 bg-zinc-900/95 backdrop-blur-lg shadow-2xl border-r-2 border-blue-900 rounded-r-2xl flex flex-col transition-transform duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block`}
      style={{ minHeight: '100vh', maxHeight: '100vh' }}
      aria-label="Sidebar"
    >
      <div className="flex items-center justify-between p-6 border-b border-blue-900">
        <h2 className="text-3xl font-extrabold text-white drop-shadow">Split App</h2>
        <button className="text-white md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6"/>
          </svg>
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-4 p-6">
        <Link
          to="/dashboard"
          className="w-full text-left px-6 py-5 rounded-2xl font-semibold transition-all duration-200 text-lg flex items-center gap-3 shadow-lg bg-blue-700 text-white hover:bg-blue-900"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        >
          <span role="img" aria-label="dashboard" className="text-2xl">🏠</span> Dashboard
        </Link>
        <Link
          to="/groups"
          className="w-full text-left px-6 py-5 rounded-2xl font-semibold transition-all duration-200 text-lg flex items-center gap-3 shadow-lg bg-zinc-800 text-purple-300 hover:bg-purple-900"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        >
          <span role="img" aria-label="groups" className="text-2xl">👥</span> Groups
        </Link>
        <Link
          to="/expenses"
          className="w-full text-left px-6 py-5 rounded-2xl font-semibold transition-all duration-200 text-lg flex items-center gap-3 shadow-lg bg-zinc-800 text-yellow-300 hover:bg-yellow-900"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        >
          <span role="img" aria-label="expenses" className="text-2xl">🧾</span> Expenses
        </Link>
      </nav>
      <div className="mt-auto p-6 flex flex-col gap-4 border-t border-blue-900">
        <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-5 py-4 shadow text-purple-200">
          <span role="img" aria-label="profile" className="text-2xl">👤</span>
          <span className="font-semibold text-lg">{username || 'Profile'}</span>
        </div>
        <button
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-4 rounded-2xl shadow-lg transition-all duration-200 text-lg font-bold w-full"
          onClick={() => { localStorage.clear(); window.location.replace('/login'); }}
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
      {/* Finance tip/info section for laptops/desktops */}
      <div className="hidden md:block mt-8 mb-4 px-6">
        <div className="bg-blue-950/80 rounded-2xl p-4 text-blue-200 shadow-lg text-sm">
          <div className="font-bold mb-2 text-blue-300">💡 Finance Tip</div>
          <div>Track your group expenses, settle up easily, and keep your friendships healthy! Remember: transparency is key to good money management. 💰</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
