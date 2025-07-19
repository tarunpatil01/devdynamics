import React, { useState } from 'react';

const Groups = ({ group, people, onAddPerson, messages, onSendMessage }) => {
  const [newPerson, setNewPerson] = useState('');
  const [message, setMessage] = useState('');

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
    <div className="flex flex-col h-full w-full max-w-lg mx-auto p-2 md:p-4 bg-black text-white rounded-2xl shadow-2xl border-2 border-blue-900 animate-fadein">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">{group?.name ? `Group: ${group.name}` : 'Select a group'}</h2>
      <div className="flex flex-col md:flex-row gap-6 mb-4">
        {/* People in Group */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">People in Group</h3>
          <ul className="mb-2 flex flex-wrap gap-2">
            {people && people.length > 0 ? people.map((person, idx) => (
              <li key={person._id || person.name || idx} className="flex items-center gap-2 py-1 px-2 bg-gray-900 rounded shadow text-white">
                {person.avatar ? (
                  <img src={person.avatar} alt={person.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-700 text-white font-bold text-xs">
                    {person.initials || (person.name ? person.name.slice(0,2).toUpperCase() : '?')}
                  </span>
                )}
                <span>{person.name || person}</span>
              </li>
            )) : <li className="text-gray-500">No people in group.</li>}
          </ul>
          <form onSubmit={handleAddPerson} className="flex gap-2 mt-2">
            <input
              type="text"
              value={newPerson}
              onChange={e => setNewPerson(e.target.value)}
              placeholder="Add person"
              className="border border-gray-700 bg-black text-white rounded px-2 py-1 flex-1"
            />
            <button type="submit" className="bg-blue-700 text-white px-3 py-1 rounded">Add</button>
          </form>
        </div>
        {/* Group Chat */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Group Chat</h3>
          <div className="flex-1 overflow-y-auto bg-gray-900 rounded p-2 mb-2 border border-gray-800 max-h-80 md:max-h-96">
            {messages && messages.length > 0 ? messages.map((msg, idx) => (
              <div key={msg._id || idx} className="mb-2 flex items-start gap-2">
                {msg.sender && msg.sender.avatar ? (
                  <img src={msg.sender.avatar} alt={msg.sender.name} className="w-6 h-6 rounded-full mt-1" />
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-pink-700 text-white font-bold text-xs mt-1">
                    {msg.sender && msg.sender.initials ? msg.sender.initials : (msg.sender && msg.sender.name ? msg.sender.name.slice(0,2).toUpperCase() : '?')}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-blue-200 font-semibold">{msg.sender && msg.sender.name ? msg.sender.name : (msg.sender || 'Unknown')}</span>
                  <span className="bg-gray-800 text-white rounded px-2 py-1 inline-block max-w-xs">{msg.text}</span>
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
              className="border border-gray-700 bg-black text-white rounded px-2 py-1 flex-1"
            />
            <button type="submit" className="bg-pink-700 text-white px-3 py-1 rounded">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Groups;
