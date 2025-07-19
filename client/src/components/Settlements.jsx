import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSettlements } from '../store/settlementsSlice';

const avatarColors = [
  'bg-blue-700', 'bg-pink-700', 'bg-green-700', 'bg-yellow-700', 'bg-purple-700', 'bg-red-700', 'bg-indigo-700', 'bg-teal-700'
];
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

const Settlements = ({ group, people, loading }) => {
  const dispatch = useDispatch();
  const { items: settlements, status, error } = useSelector(state => state.settlements);
  console.log('Settlements from backend:', settlements);
  const [settling, setSettling] = useState(null); // user being settled with

  // Use normalized username for comparison
  const username = (localStorage.getItem('username') || '').trim().toLowerCase();
  useEffect(() => {
    if (username) {
      dispatch(fetchSettlements());
    }
  }, [dispatch, username]);

  // Aggregate owed by you and owed to you
  const safeSettlements = Array.isArray(settlements) ? settlements : [];
  const owedByYou = Array.isArray(safeSettlements) ? safeSettlements.filter(s => (s.from || '').trim().toLowerCase() === username) : [];
  const owedToYou = Array.isArray(safeSettlements) ? safeSettlements.filter(s => (s.to || '').trim().toLowerCase() === username) : [];
  const totalOwedByYou = Array.isArray(owedByYou) ? owedByYou.reduce((sum, s) => sum + s.amount, 0) : 0;
  const totalOwedToYou = Array.isArray(owedToYou) ? owedToYou.reduce((sum, s) => sum + s.amount, 0) : 0;

  // Get all unique people for avatars (from settlements)
  const allPeople = Array.from(new Set([
    ...(Array.isArray(owedByYou) ? owedByYou.map(s => s.to) : []),
    ...(Array.isArray(owedToYou) ? owedToYou.map(s => s.from) : []),
    username
  ]));

  // Settle up handler
  const handleSettle = async (user, direction) => {
    setSettling(user);
    try {
      // Call backend API to settle up
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      // direction: 'pay' (you pay user), 'receive' (user pays you)
      const res = await fetch(`${baseURL}/settlements/settle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user: username,
          counterparty: user,
          direction
        })
      });
      if (!res.ok) throw new Error('Failed to settle up');
      dispatch(fetchSettlements());
    } catch (err) {
      alert('Failed to settle up.');
    }
    setSettling(null);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-2xl mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl border-2 border-blue-900 p-6 mb-8 animate-fadein">
        {/* Card summary with avatars and group name */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {(Array.isArray(allPeople) ? allPeople : []).map((person, idx) => (
              <span key={person} className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg text-white border-2 border-blue-800 ${getAvatarColor(person)}`}>{person.charAt(0).toUpperCase()}</span>
            ))}
          </div>
          <div className="flex flex-col items-center md:items-end">
            <span className="text-lg text-blue-200 font-semibold mb-1">Total Settlements</span>
            <span className="text-3xl font-extrabold text-white">₹{(totalOwedToYou - totalOwedByYou).toLocaleString('en-IN')}</span>
          </div>
        </div>
        {/* Settlements sections */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* You owe */}
          <div className="flex-1">
            <div className="text-lg font-bold text-red-400 mb-2">You owe</div>
            {Array.isArray(owedByYou) && owedByYou.length === 0 ? (
              <div className="text-gray-400">No settlements to show.</div>
            ) : (
              <ul className="flex flex-col gap-3">
                {Array.isArray(owedByYou) ? owedByYou.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 shadow">
                    <span className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg text-white ${getAvatarColor(s.to)}`}>{s.to.charAt(0).toUpperCase()}</span>
                    <span className="flex-1 text-blue-200 font-semibold">{s.to}</span>
                    <span className="text-red-400 font-bold text-lg">₹{s.amount.toLocaleString('en-IN')}</span>
                    <button
                      className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 font-bold shadow transition disabled:opacity-50"
                      disabled={settling === s.to}
                      onClick={() => handleSettle(s.to, 'pay')}
                    >
                      {settling === s.to ? 'Settling...' : 'Settle up'}
                    </button>
                  </li>
                )) : null}
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
                {Array.isArray(owedToYou) ? owedToYou.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 shadow">
                    <span className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg text-white ${getAvatarColor(s.from)}`}>{s.from.charAt(0).toUpperCase()}</span>
                    <span className="flex-1 text-blue-200 font-semibold">{s.from}</span>
                    <span className="text-green-400 font-bold text-lg">₹{s.amount.toLocaleString('en-IN')}</span>
                    <button
                      className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2 font-bold shadow transition disabled:opacity-50"
                      disabled={settling === s.from}
                      onClick={() => handleSettle(s.from, 'receive')}
                    >
                      {settling === s.from ? 'Settling...' : 'Settle up'}
                    </button>
                  </li>
                )) : null}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settlements;
