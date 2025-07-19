import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBalances } from '../store/balancesSlice';

const Balances = () => {
  const dispatch = useDispatch();
  const { items: balances, status, error } = useSelector(state => state.balances);

  const token = localStorage.getItem('token');
  useEffect(() => {
    if (token) {
      dispatch(fetchBalances());
    }
  }, [dispatch, token]);

  const safeBalances = balances && typeof balances === 'object' ? balances : {};
  const handleEditBalance = () => {
    // TODO: Implement edit balance modal or logic
    alert('Edit balance feature coming soon!');
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-extrabold text-white drop-shadow">Balances</h2>
        <button
          className="bg-yellow-700 hover:bg-yellow-800 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200"
          onClick={handleEditBalance}
        >
          Edit Balance
        </button>
      </div>
      {status === 'loading' ? (
        <div className="text-blue-200">Loading balances...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {safeBalances && Object.entries(safeBalances).length === 0 ? (
            <li className="text-gray-500">No balances found.</li>
          ) : (
            safeBalances && Object.entries(safeBalances).map(([person, balance]) => (
              <li key={person} className="flex justify-between items-center py-2 border-b border-blue-900 last:border-b-0 transition-all duration-200 hover:bg-zinc-800/60 rounded-xl">
                <span className="font-medium text-blue-200 text-lg">{person}</span>
                <span className={balance < 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                  {balance}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default Balances;
