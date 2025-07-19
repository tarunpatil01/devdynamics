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
      <div className="w-full max-w-2xl mx-auto bg-zinc-900/80 rounded-lg shadow-2xl border-2 border-blue-900 p-2 md:p-3 mb-2 md:mb-3 animate-fadein">
        {/* Card summary with avatars and group name */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-1 md:gap-2">
            {(Array.isArray(allPeople) ? allPeople : []).map((person, idx) => {
              const display = typeof person === 'string' ? person : '';
              return (
                <span key={display || idx} className={`w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full font-bold text-xs md:text-sm lg:text-lg text-white border-2 border-blue-800 ${getAvatarColor(display)}`}>{display.charAt(0).toUpperCase()}</span>
              );
            })}
          </div>
          <div className="flex flex-col items-center md:items-end">
            <span className="text-xs md:text-sm lg:text-lg text-blue-200 font-semibold mb-1">Total Settlements</span>
            <span className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white">₹{(totalOwedToYou - totalOwedByYou).toLocaleString('en-IN')}</span>
          </div>
        </div>
        {/* Settlements sections */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-6">
          {/* You owe */}
          <div className="flex-1">
            <div className="text-sm md:text-base lg:text-lg font-bold text-red-400 mb-1 md:mb-2">You owe</div>
            {Array.isArray(owedByYou) && owedByYou.length === 0 ? (
              <div className="text-gray-400 text-xs">No settlements to show.</div>
            ) : (
              <ul className="flex flex-col gap-1 md:gap-2">
                {Array.isArray(owedByYou) ? owedByYou.map((s, idx) => {
                  const toDisplay = typeof s.to === 'string' ? s.to : '';
                  return (
                    <li key={idx} className="flex items-center gap-1 md:gap-2 bg-zinc-800 rounded-lg px-2 md:px-3 py-1 md:py-2 shadow">
                      <span className={`w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full font-bold text-xs md:text-sm text-white ${getAvatarColor(toDisplay)}`}>{toDisplay.charAt(0).toUpperCase()}</span>
                      <span className="flex-1 text-blue-200 font-semibold text-xs md:text-sm truncate">{toDisplay}</span>
                      <span className="text-red-400 font-bold text-xs md:text-sm">₹{s.amount.toLocaleString('en-IN')}</span>
                      <button
                        className="bg-blue-700 hover:bg-blue-800 text-white rounded px-1 md:px-2 py-1 font-bold shadow transition disabled:opacity-50 text-xs"
                        disabled={settling === s.to}
                        onClick={() => handleSettle(s.to, 'pay')}
                      >
                        {settling === s.to ? 'Settling...' : 'Settle up'}
                      </button>
                    </li>
                  );
                }) : null}
              </ul>
            )}
          </div>
          {/* Owes you */}
          <div className="flex-1">
            <div className="text-sm md:text-base lg:text-lg font-bold text-green-400 mb-1 md:mb-2">Owes you</div>
            {Array.isArray(owedToYou) && owedToYou.length === 0 ? (
              <div className="text-gray-400 text-xs">No settlements to show.</div>
            ) : (
              <ul className="flex flex-col gap-1 md:gap-2">
                {Array.isArray(owedToYou) ? owedToYou.map((s, idx) => {
                  const fromDisplay = typeof s.from === 'string' ? s.from : '';
                  return (
                    <li key={idx} className="flex items-center gap-1 md:gap-2 bg-zinc-800 rounded-lg px-2 md:px-3 py-1 md:py-2 shadow">
                      <span className={`w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full font-bold text-xs md:text-sm text-white ${getAvatarColor(fromDisplay)}`}>{fromDisplay.charAt(0).toUpperCase()}</span>
                      <span className="flex-1 text-blue-200 font-semibold text-xs md:text-sm truncate">{fromDisplay}</span>
                      <span className="text-green-400 font-bold text-xs md:text-sm">₹{s.amount.toLocaleString('en-IN')}</span>
                      <button
                        className="bg-green-700 hover:bg-green-800 text-white rounded px-1 md:px-2 py-1 font-bold shadow transition disabled:opacity-50 text-xs"
                        disabled={settling === s.from}
                        onClick={() => handleSettle(s.from, 'receive')}
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
