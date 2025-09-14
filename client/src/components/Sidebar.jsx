import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

// If parent does not supply control props, Sidebar becomes self-managed (mobile fallback)
const Sidebar = ({ sidebarOpen: controlledOpen, setSidebarOpen: controlledSetOpen }) => {
  const isControlled = typeof controlledOpen === 'boolean' && typeof controlledSetOpen === 'function';
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const sidebarOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setSidebarOpen = isControlled ? controlledSetOpen : setUncontrolledOpen;
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
        {!isControlled && (
          <button
            className="text-white md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6"/>
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 flex flex-col gap-4 p-6">
        <NavLink
          to="/dashboard"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className={({ isActive }) => `w-full text-left px-6 py-5 rounded-2xl font-semibold transition-all duration-200 text-lg flex items-center gap-3 shadow-lg
            ${isActive ? 'bg-blue-700 text-white ring-2 ring-blue-400' : 'bg-zinc-800 text-blue-200 hover:bg-blue-900 hover:text-white'}`}
        >
          <span role="img" aria-label="dashboard" className="text-2xl">🏠</span> Dashboard
        </NavLink>
        <NavLink
          to="/groups"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className={({ isActive }) => `w-full text-left px-6 py-5 rounded-2xl font-semibold transition-all duration-200 text-lg flex items-center gap-3 shadow-lg
            ${isActive ? 'bg-purple-700 text-white ring-2 ring-purple-400' : 'bg-zinc-800 text-purple-300 hover:bg-purple-900 hover:text-white'}`}
        >
          <span role="img" aria-label="groups" className="text-2xl">👥</span> Groups
        </NavLink>
        <NavLink
          to="/expenses"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className={({ isActive }) => `w-full text-left px-6 py-5 rounded-2xl font-semibold transition-all duration-200 text-lg flex items-center gap-3 shadow-lg
            ${isActive ? 'bg-yellow-600 text-white ring-2 ring-yellow-400' : 'bg-zinc-800 text-yellow-300 hover:bg-yellow-900 hover:text-white'}`}
        >
          <span role="img" aria-label="expenses" className="text-2xl">🧾</span> Expenses
        </NavLink>
      </nav>
      <div className="mt-auto p-6 flex flex-col gap-4 border-t border-blue-900">
        <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-5 py-4 shadow text-purple-200">
          <span role="img" aria-label="profile" className="text-2xl">👤</span>
          <span className="font-semibold text-lg">{username || 'Profile'}</span>
        </div>
        <button
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-4 rounded-2xl shadow-lg transition-all duration-200 text-lg font-bold w-full"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('selectedGroup');
            window.dispatchEvent(new Event('auth-token-changed'));
            window.location.replace('/login');
          }}
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

// Optional external toggle for pages that don't maintain sidebar state
export const MobileSidebarToggle = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed top-4 left-4 z-50 p-3 rounded-xl bg-blue-700 text-white shadow-lg md:hidden active:scale-95 transition ${className}`}
        aria-label="Open sidebar"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <Sidebar sidebarOpen={open} setSidebarOpen={setOpen} />
    </>
  );
};
