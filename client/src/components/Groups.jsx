import React, { useState, useRef, useEffect, useMemo } from 'react';
import { API_BASE } from '../utils/apiBase';
import ExpenseForm from './ExpenseForm';
import Toast from './Toast';

const avatarColors = [
  'bg-blue-700', 'bg-pink-700', 'bg-green-700', 'bg-yellow-700', 'bg-purple-700', 'bg-red-700', 'bg-indigo-700', 'bg-teal-700'
];
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

const Groups = ({ group, people, onAddPerson, messages, onSendMessage, onAddExpense }) => {
  const [newPerson, setNewPerson] = useState('');
  const [message, setMessage] = useState('');
  const chatRef = useRef(null);
  const [groups, setGroups] = useState([]);
  // Removed unused loading & error state
  const [toast, setToast] = useState({ message: '', type: '' });
  const token = localStorage.getItem('token');

  // Always treat people and messages as arrays
  const safePeople = Array.isArray(people) ? people : [];
  const safeMessages = useMemo(() => (Array.isArray(messages) ? messages : []), [messages]);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
  // fetch groups
      try {
  const baseURL = API_BASE;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/groups`, { headers });
        const data = await res.json();
        setGroups(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        console.warn('Failed to load groups', e);
      }
    };
    fetchGroups();
  }, [token]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [safeMessages]);

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (newPerson.trim()) {
      onAddPerson(newPerson.trim());
      setNewPerson('');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    try {
  const baseURL = API_BASE;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${baseURL}/groups/${groupId}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete group');
      setGroups(prev => prev.filter(g => g._id !== groupId));
      setToast({ message: 'Group deleted!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete group.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto p-2 md:p-6 bg-black text-white rounded-2xl shadow-2xl border-2 border-blue-900 animate-fadein">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow">Groups</h2>
      <ul className="mb-4 flex flex-col gap-3">
  {groups.length > 0 ? groups.map((g) => (
          <li key={g._id} className="flex items-center gap-3 py-2 px-3 bg-zinc-900 rounded-xl shadow text-white justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg bg-blue-700`}>{g.name.charAt(0).toUpperCase()}</span>
              <span className="font-semibold text-blue-200 text-base">{g.name}</span>
            </div>
            <button className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded-lg shadow transition-all duration-200" onClick={() => handleDeleteGroup(g._id)}>Delete</button>
          </li>
        )) : <li className="text-gray-500">No groups found.</li>}
      </ul>
      {/* Add Expense Form for this group */}
      {group?._id && (
        <div className="mb-8">
          <ExpenseForm group={group._id} onAdd={onAddExpense} />
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8 mb-4">
        {/* People in Group */}
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">People in Group</h3>
          <ul className="mb-4 flex flex-col gap-3">
            {safePeople.length > 0 ? safePeople.map((person, idx) => {
              const key = typeof person === 'string' ? person : (person._id || person.name || idx);
              const displayName = typeof person === 'string' ? person : (typeof person.name === 'string' ? person.name : '');
              return (
                <li key={key} className="flex items-center gap-3 py-2 px-3 bg-zinc-900 rounded-xl shadow text-white">
                  <span className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg ${getAvatarColor(displayName)}`}>{displayName.charAt(0).toUpperCase()}</span>
                  <span className="font-semibold text-blue-200 text-base">{typeof displayName === 'string' ? displayName : ''}</span>
                </li>
              );
            }) : <li className="text-gray-500">No people in group.</li>}
          </ul>
          <form onSubmit={handleAddPerson} className="flex gap-2 mt-2">
            <input
              type="text"
              value={newPerson}
              onChange={e => setNewPerson(e.target.value)}
              placeholder="Add person"
              className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full"
            />
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white rounded px-4 py-2 font-bold shadow transition disabled:opacity-50">Add</button>
          </form>
        </div>
        {/* Group Chat */}
        <div className="flex-1 flex flex-col min-w-[320px]">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Group Chat</h3>
          <div ref={chatRef} className="flex-1 overflow-y-auto bg-zinc-900 rounded-2xl p-4 mb-3 border border-blue-800 max-h-[420px] min-h-[320px] shadow-inner">
            {safeMessages.length > 0 ? safeMessages.map((msg, idx) => (
              <div key={msg._id || idx} className="mb-4 flex items-start gap-3">
                <span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${getAvatarColor(msg.sender?.name || msg.sender || 'Unknown')}`}>{String(msg.sender?.name || msg.sender || 'U').charAt(0).toUpperCase()}</span>
                <div className="flex flex-col">
                  <span className="text-sm text-blue-200 font-semibold mb-1">
                    {typeof msg.sender === 'object' && msg.sender.username
                      ? msg.sender.username
                      : typeof msg.sender === 'string'
                        ? msg.sender
                        : 'Unknown'}
                  </span>
                  <span className="bg-blue-950 text-white rounded-2xl px-4 py-2 inline-block max-w-xs break-words shadow-md text-base">{msg.text}</span>
                  <span className="text-xs text-gray-500 mt-1">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                </div>
              </div>
            )) : <div className="text-gray-500">No messages yet.</div>}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex-1"
            />
            <button type="submit" className="bg-pink-700 hover:bg-pink-800 text-white rounded px-6 py-2 font-bold shadow transition disabled:opacity-50">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

Groups.defaultProps = {
  people: [],
  messages: [],
};

export default Groups;
