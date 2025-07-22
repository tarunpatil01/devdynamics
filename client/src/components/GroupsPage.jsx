import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Groups from './Groups';

const GroupsPage = () => {
  const [showGroups, setShowGroups] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [people, setPeople] = useState([]);
  const [messages, setMessages] = useState([]);
  const token = localStorage.getItem('token');

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/groups`, { headers });
        const data = await res.json();
        setGroups(Array.isArray(data.data) ? data.data : []);
        if (Array.isArray(data.data) && data.data.length > 0) {
          setSelectedGroup(data.data[0]);
        }
      } catch {}
    };
    if (token) fetchGroups();
  }, [token]);

  // Fetch people and messages for selected group
  useEffect(() => {
    if (!selectedGroup || !selectedGroup._id) return;
    const fetchPeopleAndMessages = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // People
        const pplRes = await fetch(`${baseURL}/people?group=${selectedGroup._id}`, { headers });
        const pplData = pplRes.ok ? await pplRes.json() : { data: [] };
        setPeople(Array.isArray(pplData.data) ? pplData.data : []);
        // Messages
        const msgRes = await fetch(`${baseURL}/groups/${selectedGroup._id}/messages`, { headers });
        const msgData = msgRes.ok ? await msgRes.json() : { data: [] };
        setMessages(Array.isArray(msgData.data) ? msgData.data : []);
      } catch {
        setPeople([]);
        setMessages([]);
      }
    };
    fetchPeopleAndMessages();
  }, [selectedGroup, token]);

  // Send message handler
  const handleSendMessage = async (text) => {
    if (!selectedGroup || !selectedGroup._id || !text.trim()) return;
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      const res = await fetch(`${baseURL}/groups/${selectedGroup._id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Failed to send message');
      const { data: msg } = await res.json();
      setMessages(prev => [...prev, msg]);
    } catch {}
  };

  return (
    <div className="min-h-screen w-full flex flex-row bg-gradient-to-br from-black via-zinc-900 to-blue-950">
      <Sidebar showGroups={showGroups} setShowGroups={setShowGroups} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 w-full md:ml-4">
        {groups.length > 0 && selectedGroup ? (
          <Groups
            group={selectedGroup}
            people={people}
            messages={messages}
            onSendMessage={handleSendMessage}
            onAddPerson={() => {}}
            onAddExpense={() => {}}
          />
        ) : (
          <div className="text-white text-2xl">No groups found.</div>
        )}
      </main>
    </div>
  );
};

export default GroupsPage; 