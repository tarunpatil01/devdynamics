import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSettlements } from '../store/settlementsSlice';
import { socket } from '../socket';
import useToast from '../hooks/useToast';
import Toast from './Toast';

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

const Settlements = ({ groupId, group, people, loading }) => {
  const dispatch = useDispatch();
  const { items: settlements, status, error } = useSelector(state => state.settlements);
  const [settling, setSettling] = useState(null); // user being settled with
  const [confirm, setConfirm] = useState(null); // { user, direction, amount }
  const [filter, setFilter] = useState('all'); // all, owe, owed
  const [sort, setSort] = useState('amount'); // amount, name
  const { toast, showToast, closeToast } = useToast();
  const [optimisticRemoved, setOptimisticRemoved] = useState([]); // settlement keys removed optimistically

  // Use normalized username for comparison
  const username = (localStorage.getItem('username') || '').trim().toLowerCase();
  useEffect(() => {
    if (username && groupId) {
      dispatch(fetchSettlements(groupId));
    }
    // Real-time updates via sockets
    if (groupId) {
      socket.on('expenseCreated', (expense) => {
        if (expense.group === groupId) dispatch(fetchSettlements(groupId));
      });
      socket.on('expenseUpdated', (expense) => {
        if (expense.group === groupId) dispatch(fetchSettlements(groupId));
      });
      socket.on('expenseDeleted', (payload) => {
        if (payload.group === groupId) dispatch(fetchSettlements(groupId));
      });
    }
    return () => {
      socket.off('expenseCreated');
      socket.off('expenseUpdated');
      socket.off('expenseDeleted');
    };
  }, [dispatch, username, groupId]);

  // Aggregate owed by you and owed to you
  const safeSettlements = Array.isArray(settlements) ? settlements : [];
  let owedByYou = Array.isArray(safeSettlements) ? safeSettlements.filter(s => (s.from || '').trim().toLowerCase() === username) : [];
  let owedToYou = Array.isArray(safeSettlements) ? safeSettlements.filter(s => (s.to || '').trim().toLowerCase() === username) : [];
  // Optimistic UI: filter out any settlements in optimisticRemoved
  owedByYou = owedByYou.filter(s => !optimisticRemoved.includes(`pay-${s.to}`));
  owedToYou = owedToYou.filter(s => !optimisticRemoved.includes(`receive-${s.from}`));
  // Filtering
  if (filter === 'owe') owedByYou = owedByYou; else if (filter === 'owed') owedByYou = [];
  if (filter === 'owed') owedToYou = owedToYou; else if (filter === 'owe') owedToYou = [];
  // Sorting
  if (sort === 'amount') {
    owedByYou = owedByYou.sort((a, b) => b.amount - a.amount);
    owedToYou = owedToYou.sort((a, b) => b.amount - a.amount);
  } else if (sort === 'name') {
    owedByYou = owedByYou.sort((a, b) => a.to.localeCompare(b.to));
    owedToYou = owedToYou.sort((a, b) => a.from.localeCompare(b.from));
  }
  const totalOwedByYou = Array.isArray(owedByYou) ? owedByYou.reduce((sum, s) => sum + s.amount, 0) : 0;
  const totalOwedToYou = Array.isArray(owedToYou) ? owedToYou.reduce((sum, s) => sum + s.amount, 0) : 0;

  // Get all unique people for avatars (from settlements)
  const allPeople = Array.from(new Set([
    ...(Array.isArray(owedByYou) ? owedByYou.map(s => s.to) : []),
    ...(Array.isArray(owedToYou) ? owedToYou.map(s => s.from) : []),
    username
  ]));

  // Settle up handler with confirmation
  const handleSettle = (user, direction, amount) => {
    setConfirm({ user, direction, amount });
  };
  const doSettle = async () => {
    if (!confirm) return;
    setSettling(confirm.user);
    // Optimistic UI: remove settlement immediately
    setOptimisticRemoved(prev => [...prev, `${confirm.direction}-${confirm.user}`]);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      const res = await fetch(`${baseURL}/settlements/settle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user: username,
          counterparty: confirm.user,
          direction: confirm.direction,
          group: groupId
        })
      });
      if (!res.ok) throw new Error('Failed to settle up');
      dispatch(fetchSettlements(groupId));
      showToast('Settlement recorded!', 'success');
    } catch (err) {
      showToast('Failed to settle up. Please try again.', 'error');
      // Revert optimistic update
      setOptimisticRemoved(prev => prev.filter(key => key !== `${confirm.direction}-${confirm.user}`));
      dispatch(fetchSettlements(groupId));
    }
    setSettling(null);
    setConfirm(null);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 border-2 border-blue-900 flex flex-col gap-4 min-w-[320px]">
            <div className="text-xl font-bold text-white mb-2">Confirm Settlement</div>
            <div className="text-blue-200 mb-4">
              {confirm.direction === 'pay'
                ? `You are about to settle ₹${confirm.amount.toLocaleString('en-IN')} with ${confirm.user}. Are you sure?`
                : `${confirm.user} is about to settle ₹${confirm.amount.toLocaleString('en-IN')} with you. Are you sure?`}
            </div>
            <div className="flex gap-4 justify-end">
              <button className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-bold" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold" onClick={doSettle} disabled={!!settling}>
                {settling ? 'Settling...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-2xl mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl border-2 border-blue-900 p-6 mb-8 animate-fadein">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {(Array.isArray(allPeople) ? allPeople : []).map((person, idx) => {
              const display = typeof person === 'string' ? person : '';
              return (
                <span key={display || idx} className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg text-white border-2 border-blue-800 ${getAvatarColor(display)}`}>{display.charAt(0).toUpperCase()}</span>
              );
            })}
          </div>
          <div className="flex flex-col items-center md:items-end">
            <span className="text-lg text-blue-200 font-semibold mb-1 flex items-center gap-2">
              Total Settlements
              <Tooltip text="This is the net amount you owe or are owed in this group, after all expenses and settlements.">
                <span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span>
              </Tooltip>
            </span>
            <span className="text-3xl font-extrabold text-white">₹{(totalOwedToYou - totalOwedByYou).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="flex flex-row gap-4 mb-4 items-center">
          <label className="text-blue-200 font-semibold">Filter:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-zinc-800 text-blue-200 rounded px-2 py-1 border border-blue-700" aria-label="Filter settlements">
            <option value="all">All</option>
            <option value="owe">I Owe</option>
            <option value="owed">Owed to Me</option>
          </select>
          <label className="text-blue-200 font-semibold ml-4">Sort:</label>
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-zinc-800 text-blue-200 rounded px-2 py-1 border border-blue-700" aria-label="Sort settlements">
            <option value="amount">By Amount</option>
            <option value="name">By Name</option>
          </select>
        </div>
        {/* Settlements sections */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* You owe */}
          <div className="flex-1">
            <div className="text-lg font-bold text-red-400 mb-2">You owe</div>
            {Array.isArray(owedByYou) && owedByYou.length === 0 ? (
              <div className="text-gray-400 flex flex-col items-center gap-2">
                <span className="text-3xl">🧾</span>
                No settlements to show.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {Array.isArray(owedByYou) ? owedByYou.map((s, idx) => {
                  const toDisplay = typeof s.to === 'string' ? s.to : '';
                  return (
                    <li key={idx} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 shadow">
                      <span className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg text-white ${getAvatarColor(toDisplay)}`}>{toDisplay.charAt(0).toUpperCase()}</span>
                      <span className="flex-1 text-blue-200 font-semibold">{toDisplay}</span>
                      <span className="text-red-400 font-bold text-lg">₹{s.amount.toLocaleString('en-IN')}</span>
                      <button
                        className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 font-bold shadow transition disabled:opacity-50"
                        disabled={settling === s.to || s.amount <= 0}
                        onClick={() => handleSettle(s.to, 'pay', s.amount)}
                        aria-label={`Settle up with ${s.to}`}
                      >
                        <Tooltip text="Click to settle your balance with this person. You will record a payment and your balances will update.">
                        {settling === s.to ? 'Settling...' : 'Settle up'}
                        </Tooltip>
                      </button>
                    </li>
                  );
                }) : null}
              </ul>
            )}
          </div>
          {/* Owes you */}
          <div className="flex-1">
            <div className="text-lg font-bold text-green-400 mb-2">Owes you</div>
            {Array.isArray(owedToYou) && owedToYou.length === 0 ? (
              <div className="text-gray-400">No settlements to show.</div>
            ) : (
              <ul className="flex flex-col gap-3">
                {Array.isArray(owedToYou) ? owedToYou.map((s, idx) => {
                  const fromDisplay = typeof s.from === 'string' ? s.from : '';
                  return (
                    <li key={idx} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 shadow">
                      <span className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg text-white ${getAvatarColor(fromDisplay)}`}>{fromDisplay.charAt(0).toUpperCase()}</span>
                      <span className="flex-1 text-blue-200 font-semibold">{fromDisplay}</span>
                      <span className="text-green-400 font-bold text-lg">₹{s.amount.toLocaleString('en-IN')}</span>
                      <button
                        className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2 font-bold shadow transition disabled:opacity-50"
                        disabled={settling === s.from || s.amount <= 0}
                        onClick={() => handleSettle(s.from, 'receive', s.amount)}
                        aria-label={`Settle up with ${s.from}`}
                      >
                        {settling === s.from ? 'Settling...' : 'Settle up'}
                      </button>
                    </li>
                  );
                }) : null}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settlements;
