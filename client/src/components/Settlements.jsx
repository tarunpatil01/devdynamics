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
    <div className="w-full flex flex-col items-center responsive-container">
      <div className="w-full max-w-2xl mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl border-2 border-blue-900 p-3 sm:p-4 md:p-6 mb-4 md:mb-8 animate-fadein">
        {/* Card summary with avatars and group name */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {(Array.isArray(allPeople) ? allPeople : []).map((person, idx) => {
              const display = typeof person === 'string' ? person : '';
              return (
                <span key={display || idx} className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full font-bold text-sm sm:text-lg text-white border-2 border-blue-800 ${getAvatarColor(display)}`}>{display.charAt(0).toUpperCase()}</span>
              );
            })}
          </div>
          <div className="flex flex-col items-center md:items-end">
            <span className="text-sm sm:text-lg text-blue-200 font-semibold mb-1">Total Settlements</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">₹{(totalOwedToYou - totalOwedByYou).toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        {/* Settlements sections */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* You owe */}
          <div className="flex-1">
            <div className="text-base sm:text-lg font-bold text-red-400 mb-2">You owe</div>
            {Array.isArray(owedByYou) && owedByYou.length === 0 ? (
              <div className="text-gray-400 text-sm sm:text-base">No settlements to show.</div>
            ) : (
              <ul className="flex flex-col gap-2 sm:gap-3">
                {Array.isArray(owedByYou) ? owedByYou.map((s, idx) => {
                  const toDisplay = typeof s.to === 'string' ? s.to : '';
                  return (
                    <li key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full font-bold text-sm sm:text-lg text-white ${getAvatarColor(toDisplay)}`}>{toDisplay.charAt(0).toUpperCase()}</span>
                        <span className="text-blue-200 font-semibold text-sm sm:text-base truncate">{toDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <span className="text-red-400 font-bold text-sm sm:text-lg">₹{s.amount.toLocaleString('en-IN')}</span>
                        <button
                          className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-3 sm:px-4 py-1 sm:py-2 font-bold shadow transition disabled:opacity-50 touch-target text-xs sm:text-sm w-full sm:w-auto"
                          disabled={settling === s.to}
                          onClick={() => handleSettle(s.to, 'pay')}
                        >
                          {settling === s.to ? 'Settling...' : 'Settle up'}
                        </button>
                      </div>
                    </li>
                  );
                }) : null}
              </ul>
            )}
          </div>
          
          {/* Owes you */}
          <div className="flex-1">
            <div className="text-base sm:text-lg font-bold text-green-400 mb-2">Owes you</div>
            {Array.isArray(owedToYou) && owedToYou.length === 0 ? (
              <div className="text-gray-400 text-sm sm:text-base">No settlements to show.</div>
            ) : (
              <ul className="flex flex-col gap-2 sm:gap-3">
                {Array.isArray(owedToYou) ? owedToYou.map((s, idx) => {
                  const fromDisplay = typeof s.from === 'string' ? s.from : '';
                  return (
                    <li key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-zinc-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full font-bold text-sm sm:text-lg text-white ${getAvatarColor(fromDisplay)}`}>{fromDisplay.charAt(0).toUpperCase()}</span>
                        <span className="text-blue-200 font-semibold text-sm sm:text-base truncate">{fromDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <span className="text-green-400 font-bold text-sm sm:text-lg">₹{s.amount.toLocaleString('en-IN')}</span>
                        <button
                          className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-3 sm:px-4 py-1 sm:py-2 font-bold shadow transition disabled:opacity-50 touch-target text-xs sm:text-sm w-full sm:w-auto"
                          disabled={settling === s.from}
                          onClick={() => handleSettle(s.from, 'receive')}
                        >
                          {settling === s.from ? 'Settling...' : 'Settle up'}
                        </button>
                      </div>
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
