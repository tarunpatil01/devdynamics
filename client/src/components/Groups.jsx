import React, { useState, useRef, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';

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

  // Always treat people and messages as arrays
  const safePeople = Array.isArray(people) ? people : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

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

  return (
    <div className="flex flex-col h-full w-full bg-black text-white rounded-2xl shadow-2xl border-2 border-blue-900 animate-fadein overflow-hidden responsive-container">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 text-center drop-shadow px-2">{group?.name ? `Group: ${group.name}` : 'Select a group'}</h2>
      
      {/* Add Expense Form for this group */}
      {group?._id && (
        <div className="mb-4 md:mb-8 w-full px-2 sm:px-4">
          <ExpenseForm group={group._id} onAdd={onAddExpense} />
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 mb-4 w-full px-2 sm:px-4">
        {/* People in Group */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-3">People in Group</h3>
          <ul className="mb-4 flex flex-col gap-2 sm:gap-3">
            {safePeople.length > 0 ? safePeople.map((person, idx) => {
              const key = typeof person === 'string' ? person : (person._id || person.name || idx);
              const displayName = typeof person === 'string' ? person : (typeof person.name === 'string' ? person.name : '');
              return (
                <li key={key} className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 bg-zinc-900 rounded-xl shadow text-white">
                  <span className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full font-bold text-sm sm:text-lg ${getAvatarColor(displayName)}`}>{displayName.charAt(0).toUpperCase()}</span>
                  <span className="font-semibold text-blue-200 text-sm sm:text-base truncate">{typeof displayName === 'string' ? displayName : ''}</span>
                </li>
              );
            }) : <li className="text-gray-500 text-sm sm:text-base">No people in group.</li>}
          </ul>
          
          {/* Add Person Form */}
          <div className="mb-4">
            <h4 className="text-sm sm:text-md font-semibold text-gray-200 mb-2">Add Person</h4>
            <form onSubmit={handleAddPerson} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="Enter name"
                className="flex-1 bg-zinc-800 text-white border border-blue-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 touch-target"
                required
              />
              <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold shadow transition-all duration-200 touch-target w-full sm:w-auto">
                Add
              </button>
            </form>
          </div>
        </div>
        
        {/* Group Chat */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-3">Group Chat</h3>
          <div ref={chatRef} className="flex-1 overflow-y-auto bg-zinc-900 rounded-2xl p-3 sm:p-4 mb-3 border border-blue-800 max-h-[300px] sm:max-h-[420px] min-h-[250px] sm:min-h-[320px] shadow-inner">
            {safeMessages.length > 0 ? safeMessages.map((msg, idx) => (
              <div key={msg._id || idx} className="mb-3 sm:mb-4 flex items-start gap-2 sm:gap-3">
                <span className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full font-bold text-sm sm:text-lg ${getAvatarColor(msg.sender?.name || msg.sender || 'Unknown')}`}>{String(msg.sender?.name || msg.sender || 'U').charAt(0).toUpperCase()}</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs sm:text-sm text-blue-200 font-semibold mb-1 truncate">
                    {typeof msg.sender === 'string'
                      ? msg.sender
                      : (msg.sender && typeof msg.sender.name === 'string'
                          ? msg.sender.name
                          : 'Unknown')}
                  </span>
                  <span className="bg-blue-950 text-white rounded-2xl px-3 sm:px-4 py-2 inline-block max-w-full break-words shadow-md text-sm sm:text-base">{msg.text}</span>
                  <span className="text-xs text-gray-500 mt-1">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                </div>
              </div>
            )) : <div className="text-gray-500 text-sm sm:text-base">No messages yet.</div>}
          </div>
          
          {/* Send Message Form */}
          <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-800 text-white border border-blue-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 touch-target"
              required
            />
            <button type="submit" className="bg-pink-700 hover:bg-pink-800 text-white px-4 py-2 rounded font-bold shadow transition-all duration-200 touch-target w-full sm:w-auto">
              Send
            </button>
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
