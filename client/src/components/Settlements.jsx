import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSettlements } from '../store/settlementsSlice';

const Settlements = () => {
  const dispatch = useDispatch();
  const { items: settlements, status, error } = useSelector(state => state.settlements);

  const token = localStorage.getItem('token');
  useEffect(() => {
    if (token) {
      dispatch(fetchSettlements());
    }
  }, [dispatch, token]);

  // Get current user
  const username = localStorage.getItem('username');
  // Aggregate owed by you and owed to you
  const owedByYou = {};
  const owedToYou = {};
  let totalOwedByYou = 0;
  let totalOwedToYou = 0;
  if (settlements && Array.isArray(settlements)) {
    settlements.forEach(s => {
      if (s.from === username) {
        owedByYou[s.to] = (owedByYou[s.to] || 0) + s.amount;
        totalOwedByYou += s.amount;
      }
      if (s.to === username) {
        owedToYou[s.from] = (owedToYou[s.from] || 0) + s.amount;
        totalOwedToYou += s.amount;
      }
    });
  }

  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein">
      <h2 className="text-2xl font-extrabold text-white drop-shadow mb-6 text-center">Settlements</h2>
      {/* Top summary bar */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-red-400">Owed by you</span>
          <span className="text-2xl font-bold text-red-500">₹{totalOwedByYou}</span>
        </div>
        <div className="border-l border-blue-700 mx-4"></div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-green-400">Owed to you</span>
          <span className="text-2xl font-bold text-green-500">₹{totalOwedToYou}</span>
        </div>
      </div>
      {/* Lists */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Owed by you */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-400 mb-2">You owe</h3>
          {Object.keys(owedByYou).length === 0 ? (
            <div className="text-gray-400">You owe nothing.</div>
          ) : (
            <ul className="divide-y divide-blue-900">
              {Object.entries(owedByYou).map(([person, amount]) => (
                <li key={person} className="flex justify-between items-center py-3">
                  <span className="font-medium text-blue-200 text-lg">{person}</span>
                  <span className="text-red-400 font-bold text-lg">₹{amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Owed to you */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Owes you</h3>
          {Object.keys(owedToYou).length === 0 ? (
            <div className="text-gray-400">No one owes you.</div>
          ) : (
            <ul className="divide-y divide-blue-900">
              {Object.entries(owedToYou).map(([person, amount]) => (
                <li key={person} className="flex justify-between items-center py-3">
                  <span className="font-medium text-blue-200 text-lg">{person}</span>
                  <span className="text-green-400 font-bold text-lg">₹{amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settlements;
