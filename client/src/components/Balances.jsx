import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBalances } from '../store/balancesSlice';

const avatarColors = [
  'bg-blue-700', 'bg-pink-700', 'bg-green-700', 'bg-yellow-700', 'bg-purple-700', 'bg-red-700', 'bg-indigo-700', 'bg-teal-700'
];
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// Tooltip component (add aria-label and tabIndex)
const Tooltip = ({ text, children }) => (
  <span className="relative group" tabIndex={0} aria-label={text}>
    {children}
    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs px-3 py-2 rounded bg-zinc-800 text-blue-100 text-xs shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity z-50" role="tooltip">
      {text}
    </span>
  </span>
);

const Balances = ({ groupId }) => {
  const dispatch = useDispatch();
  const { items: balances, status, error } = useSelector(state => state.balances);
  const [filter, setFilter] = useState('all'); // all, owe, owed
  const [sort, setSort] = useState('name'); // name, amount

  const token = localStorage.getItem('token');
  useEffect(() => {
    if (token && groupId) {
      dispatch(fetchBalances(groupId));
    }
  }, [dispatch, token, groupId]);

  const safeBalances = balances && typeof balances === 'object' ? balances : {};
  const hasBalances = Object.keys(safeBalances).length > 0 && Object.values(safeBalances).some(v => v !== 0);
  const username = (localStorage.getItem('username') || '').trim().toLowerCase();

  // Filtering
  let filtered = Object.entries(safeBalances);
  if (filter === 'owe') filtered = filtered.filter(([person, balance]) => balance < 0 && person !== username);
  if (filter === 'owed') filtered = filtered.filter(([person, balance]) => balance > 0 && person !== username);
  // Sorting
  if (sort === 'name') filtered = filtered.sort((a, b) => a[0].localeCompare(b[0]));
  if (sort === 'amount') filtered = filtered.sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-extrabold text-white drop-shadow flex items-center gap-2">
          Balances
          <Tooltip text="This shows how much each person owes or is owed in the group, after all expenses.">
            <span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span>
          </Tooltip>
        </h2>
        <div className="flex gap-2 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-zinc-800 text-blue-200 rounded px-2 py-1 border border-blue-700" aria-label="Filter balances">
            <option value="all">All</option>
            <option value="owe">I Owe</option>
            <option value="owed">Owed to Me</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-zinc-800 text-blue-200 rounded px-2 py-1 border border-blue-700" aria-label="Sort balances">
            <option value="name">Sort by Name</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>
      {status === 'loading' ? (
        <div className="text-blue-200">Loading balances...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : !hasBalances ? (
        <div className="text-gray-500 flex flex-col items-center gap-2">
          <span className="text-3xl">💰</span>
          No balances found.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map(([person, balance]) => (
            <li key={person} className="flex justify-between items-center py-2 border-b border-blue-900 last:border-b-0 transition-all duration-200 hover:bg-zinc-800/60 rounded-xl">
              <span className={`flex items-center gap-2 font-medium text-lg`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${getAvatarColor(person)}`}>{person.charAt(0).toUpperCase()}</span>
                <span className="text-blue-200">{person}</span>
              </span>
              <span className={balance < 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                {balance}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Balances;
