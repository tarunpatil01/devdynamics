import React from 'react';

const Sidebar = ({ groups, selectedGroup, setSelectedGroup, onShowGroups }) => {
  return (
    <aside className="w-full md:w-64 h-20 md:h-full bg-zinc-900/80 backdrop-blur-lg shadow-2xl flex flex-row md:flex-col p-2 md:p-4 border-b md:border-b-0 md:border-r border-blue-900 rounded-2xl animate-fadein">
      <h2 className="text-2xl font-bold text-white mb-4 md:mb-6 drop-shadow">Split App</h2>
      <nav className="flex-1">
        <button
          className={`w-full text-left px-4 py-2 rounded-lg mb-2 font-semibold transition-all duration-200 ${selectedGroup ? 'bg-blue-900 text-white' : 'bg-zinc-800 text-gray-300'} hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          onClick={onShowGroups}
        >
          Groups
        </button>
        {groups && groups.length > 0 && (
          <ul className="mt-2">
            {groups.map(group => (
              <li key={group._id} className="flex items-center gap-2 mb-1">
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-900 text-white font-bold text-xs">
                    {group.initials || (group.name ? group.name.slice(0,2).toUpperCase() : '?')}
                  </span>
                )}
                <button
                  className={`flex-1 text-left px-2 py-2 rounded-lg transition-all duration-200 ${selectedGroup === group._id ? 'bg-blue-900 text-white' : 'bg-zinc-800 text-gray-300'} hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onClick={() => setSelectedGroup(group._id)}
                >
                  {group.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
