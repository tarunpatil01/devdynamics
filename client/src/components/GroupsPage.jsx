import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/apiBase';
import authFetch from '../utils/authFetch';
import Sidebar from './Sidebar';
import Groups from './Groups';
import { socket } from '../socket';

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
    const res = await authFetch('/groups');
        const data = await res.json();
        setGroups(Array.isArray(data.data) ? data.data : []);
        if (Array.isArray(data.data) && data.data.length > 0) {
          setSelectedGroup(data.data[0]);
        }
      } catch (e) {
        console.warn('Failed to fetch groups', e);
      }
    };
    if (token) fetchGroups();
  }, [token]);

  // Fetch people and messages for selected group
  useEffect(() => {
    if (!selectedGroup || !selectedGroup._id) return;
    const fetchPeopleAndMessages = async () => {
      try {
    // People
    const pplRes = await authFetch(`/people?group=${selectedGroup._id}`);
        const pplData = pplRes.ok ? await pplRes.json() : { data: [] };
        setPeople(Array.isArray(pplData.data) ? pplData.data : []);
    // Messages
    const msgRes = await authFetch(`/groups/${selectedGroup._id}/messages`);
        const msgData = msgRes.ok ? await msgRes.json() : { data: [] };
        setMessages(Array.isArray(msgData.data) ? msgData.data : []);
      } catch (e) {
        console.warn('Failed to fetch people/messages', e);
        setPeople([]);
        setMessages([]);
      }
    };
    fetchPeopleAndMessages();
  }, [selectedGroup, token]);

  // Real-time group chat with socket.io
  useEffect(() => {
    if (!selectedGroup || !selectedGroup._id) return;
    socket.emit('joinGroup', selectedGroup._id);
    const handleGroupMessage = (msg) => {
      if (msg.group === selectedGroup._id || (msg.group && msg.group.toString() === selectedGroup._id.toString())) {
        setMessages(prev => [...prev, msg]);
      }
    };
    socket.on('groupMessage', handleGroupMessage);
    return () => {
      socket.off('groupMessage', handleGroupMessage);
      socket.emit('leaveGroup', selectedGroup._id);
    };
  }, [selectedGroup]);

  // Send message handler
  const handleSendMessage = async (text) => {
    if (!selectedGroup || !selectedGroup._id || !text.trim()) return;
    try {
      await authFetch(`/groups/${selectedGroup._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      // No need to update messages here; real-time socket will handle it
    } catch (e) {
      console.warn('Failed to send message', e);
    }
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