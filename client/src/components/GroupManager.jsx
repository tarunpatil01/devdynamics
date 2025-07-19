import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGroups } from '../store/groupsSlice';

const GroupManager = ({ token, selectedGroup, setSelectedGroup }) => {
  const dispatch = useDispatch();
  const { items: groups, status, error } = useSelector(state => state.groups);
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    if (token) dispatch(fetchGroups(token));
  }, [dispatch, token]);

  // Fetch all users for group creation
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/people/users`, { headers });
        const data = await res.json();
        setUsers(Array.isArray(data.data) ? data.data : []);
      } catch {
        setUsers([]);
      }
      setUsersLoading(false);
    };
    fetchUsers();
  }, [token]);

  const handleUserSelect = (user) => {
    setSelectedUsers(prev => prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]);
  };

  const handleCreate = async () => {
    if (!groupName) return;
    const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
    const res = await fetch(`${baseURL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: groupName, members: selectedUsers }),
    });
    if (res.ok) {
      setGroupName('');
      setSelectedUsers([]);
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
      </div>
      <div className="mb-2">
        <label className="block text-blue-200 font-semibold mb-1">Add Members</label>
        <div className="flex flex-wrap gap-2">
          {usersLoading ? <span className="text-gray-400">Loading users...</span> : users.length > 0 ? users.map(user => (
            <button
              key={user}
              type="button"
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 font-semibold shadow ${selectedUsers.includes(user) ? 'bg-blue-700 text-white border-blue-500' : 'bg-zinc-800 text-blue-300 border-blue-300'}`}
              onClick={() => handleUserSelect(user)}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                {user.charAt(0).toUpperCase()}
              </span>
              {user}
            </button>
          )) : <span className="text-gray-400">No users found.</span>}
        </div>
      </div>
      <button
        onClick={handleCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-all duration-200 font-semibold shadow mt-2"
      >
        Create
      </button>
      {status === 'loading' ? (
        <div>Loading groups...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <ul className="flex gap-2 flex-wrap mt-4">
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
