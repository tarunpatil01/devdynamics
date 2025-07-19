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
  if (settlements && Array.isArray(settlements)) {
    settlements.forEach(s => {
      if (s.from === username) {
        owedByYou[s.to] = (owedByYou[s.to] || 0) + s.amount;
      }
      if (s.to === username) {
        owedToYou[s.from] = (owedToYou[s.from] || 0) + s.amount;
      }
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-indigo-700 mb-4">Settlements</h2>
      {status === 'loading' ? (
        <div className="text-indigo-400">Loading settlements...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="mb-4 flex gap-8">
            <div className="w-1/2">
              <h3 className="text-lg font-semibold text-red-500 mb-2">Owed by you</h3>
              {Object.keys(owedByYou).length === 0 ? (
                <div className="text-gray-400">You owe nothing.</div>
              ) : (
                <ul>
                  {Object.entries(owedByYou).map(([person, amount]) => (
                    <li key={person} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium text-purple-700">{person}</span>
                      <span className="text-red-500 font-bold">₹{amount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="w-1/2">
              <h3 className="text-lg font-semibold text-green-600 mb-2">Owed to you</h3>
              {Object.keys(owedToYou).length === 0 ? (
                <div className="text-gray-400">No one owes you.</div>
              ) : (
                <ul>
                  {Object.entries(owedToYou).map(([person, amount]) => (
                    <li key={person} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium text-indigo-700">{person}</span>
                      <span className="text-green-600 font-bold">₹{amount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <hr className="my-4" />
          <h3 className="text-md font-semibold text-gray-700 mb-2">All Settlements</h3>
          <ul>
            {settlements.length === 0 ? (
              <li className="text-green-600 font-semibold">All settled!</li>
            ) : (
              settlements.map((s, idx) => (
                <li key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-red-500 font-bold">{s.from}</span>
                  <span className="text-gray-700">pays</span>
                  <span className="text-indigo-600 font-bold">{s.to}</span>
                  <span className="text-green-600 font-bold">₹{s.amount}</span>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default Settlements;
