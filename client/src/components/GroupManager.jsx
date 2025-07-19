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
    const res = await fetch('/groups', {
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
      <h2 className="text-lg font-bold mb-2">Groups</h2>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="New group name"
          className="border px-2 py-1 rounded"
        />
        <button onClick={handleCreate} className="bg-blue-500 text-white px-3 py-1 rounded">Create</button>
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
