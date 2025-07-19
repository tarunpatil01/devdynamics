import React from 'react';

const Sidebar = ({ showGroups, setShowGroups, sidebarOpen, setSidebarOpen }) => {
  const username = localStorage.getItem('username');
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen w-72 bg-zinc-900/95 backdrop-blur-lg shadow-2xl border-r-2 border-blue-900 rounded-r-2xl flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block responsive-container`}
      aria-label="Sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-blue-900">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow">Split App</h2>
        <button 
          className="text-white md:hidden touch-target p-2" 
          onClick={() => setSidebarOpen(false)} 
          aria-label="Close sidebar"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6"/>
          </svg>
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-3 md:gap-4 p-4 md:p-6 overflow-y-auto">
        <button
          className={`w-full text-left px-4 md:px-6 py-4 md:py-5 rounded-2xl font-semibold transition-all duration-200 text-base md:text-lg flex items-center gap-3 shadow-lg touch-target ${!showGroups ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-blue-300'}`}
          onClick={() => { setShowGroups(false); setSidebarOpen(false); }}
        >
          <span role="img" aria-label="split" className="text-xl md:text-2xl">💸</span> Split
        </button>
        <button
          className={`w-full text-left px-4 md:px-6 py-4 md:py-5 rounded-2xl font-semibold transition-all duration-200 text-base md:text-lg flex items-center gap-3 shadow-lg touch-target ${showGroups ? 'bg-blue-900 text-blue-200' : 'bg-zinc-800 text-purple-300'}`}
          onClick={() => { setShowGroups(true); setSidebarOpen(false); }}
        >
          <span role="img" aria-label="groups" className="text-xl md:text-2xl">👥</span> Groups
        </button>
      </nav>
      
      {/* Footer */}
      <div className="mt-auto p-4 md:p-6 flex flex-col gap-3 md:gap-4 border-t border-blue-900">
        <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 md:px-5 py-3 md:py-4 shadow text-purple-200">
          <span role="img" aria-label="profile" className="text-xl md:text-2xl">👤</span>
          <span className="font-semibold text-base md:text-lg truncate">{username || 'Profile'}</span>
        </div>
        <button
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-3 md:py-4 rounded-2xl shadow-lg transition-all duration-200 text-base md:text-lg font-bold w-full touch-target"
          onClick={() => { localStorage.clear(); window.location.replace('/login'); }}
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
      
      {/* Finance tip/info section for laptops/desktops */}
      <div className="hidden md:block mt-6 md:mt-8 mb-4 px-4 md:px-6">
        <div className="bg-blue-950/80 rounded-2xl p-3 md:p-4 text-blue-200 shadow-lg text-sm">
          <div className="font-bold mb-2 text-blue-300">💡 Finance Tip</div>
          <div>Track your group expenses, settle up easily, and keep your friendships healthy! Remember: transparency is key to good money management. 💰</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
