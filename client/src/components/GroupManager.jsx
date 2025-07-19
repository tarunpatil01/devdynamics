import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGroups } from '../store/groupsSlice';

const GroupManager = ({ token, selectedGroup, setSelectedGroup }) => {
  const dispatch = useDispatch();
  const { items: groups, status, error } = useSelector(state => state.groups);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (token) dispatch(fetchGroups(token));
  }, [dispatch, token]);

  const handleCreate = async () => {
    if (!groupName) return;
    const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
    const res = await fetch(`${baseURL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: groupName }),
    });
    if (res.ok) {
      setGroupName('');
      dispatch(fetchGroups(token));
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-2 text-white">Groups</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="New group name"
          className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex-1 min-w-0"
        />
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-all duration-200 font-semibold shadow"
        >
          Create
        </button>
      </div>
      {status === 'loading' ? (
        <div>Loading groups...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <ul className="flex gap-2 flex-wrap">
          {groups.map(group => (
            <li key={group._id}>
              <button
                className={`px-3 py-1 rounded border ${selectedGroup === group._id ? 'bg-blue-200 border-blue-500' : 'bg-gray-100 border-gray-300'}`}
                onClick={() => setSelectedGroup(group._id)}
              >
                {group.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupManager;
