import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Groups from './Groups';

const GroupsPage = () => {
  const [showGroups, setShowGroups] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-row bg-gradient-to-br from-black via-zinc-900 to-blue-950">
      <Sidebar showGroups={showGroups} setShowGroups={setShowGroups} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 w-full md:ml-4">
        <Groups />
      </main>
    </div>
  );
};

export default GroupsPage; 