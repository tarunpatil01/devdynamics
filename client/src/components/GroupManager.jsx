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
    <div className="mb-4 md:mb-6 responsive-container">
      <h2 className="text-base sm:text-lg font-bold mb-2 text-white">Groups</h2>
      
      {/* Group Name Input */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="New group name"
          className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex-1 min-w-0 touch-target"
        />
      </div>
      
      {/* Add Members */}
      <div className="mb-3">
        <label className="block text-blue-200 font-semibold mb-2 text-sm sm:text-base">Add Members</label>
        <div className="flex flex-wrap gap-2 responsive-flex">
          {usersLoading ? (
            <span className="text-gray-400 text-sm">Loading users...</span>
          ) : (Array.isArray(users) && users.length > 0) ? users.map(user => (
            <button
              key={user}
              type="button"
              className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full border transition-all duration-200 font-semibold shadow touch-target text-sm ${selectedUsers.includes(user) ? 'bg-blue-700 text-white border-blue-500' : 'bg-zinc-800 text-blue-300 border-blue-300'}`}
              onClick={() => handleUserSelect(user)}
            >
              <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs sm:text-sm">
                {user.charAt(0).toUpperCase()}
              </span>
              <span className="truncate max-w-20 sm:max-w-none">{user}</span>
            </button>
          )) : (
            <span className="text-gray-400 text-sm">No users found.</span>
          )}
        </div>
      </div>
      
      {/* Create Button */}
      <button
        onClick={handleCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-all duration-200 font-semibold shadow mt-2 touch-target w-full sm:w-auto"
      >
        Create Group
      </button>
      
      {/* Groups List */}
      {status === 'loading' ? (
        <div className="text-gray-400 text-sm mt-3">Loading groups...</div>
      ) : error ? (
        <div className="text-red-500 text-sm mt-3">{error}</div>
      ) : (
        <div className="mt-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-200 mb-2">Your Groups</h3>
          <div className="flex flex-wrap gap-2 responsive-flex">
            {(Array.isArray(groups) && groups.length > 0) ? groups.map(group => (
              <button
                key={group._id}
                className={`px-3 py-2 rounded border transition-all duration-200 touch-target text-sm ${selectedGroup === group._id ? 'bg-blue-700 text-white border-blue-500' : 'bg-zinc-800 text-gray-300 border-gray-600 hover:bg-zinc-700'}`}
                onClick={() => setSelectedGroup(group._id)}
              >
                {group.name}
              </button>
            )) : (
              <span className="text-gray-400 text-sm">No groups created yet.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManager;
