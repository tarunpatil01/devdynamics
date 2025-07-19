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
  const hasBalances = Object.keys(safeBalances).length > 0 && Object.values(safeBalances).some(v => v !== 0);

  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-xl shadow-2xl p-3 md:p-4 mb-3 md:mb-4 border-2 border-blue-900 text-white animate-fadein">
      <div className="flex flex-col md:flex-row justify-between items-center mb-3 md:mb-4 gap-2">
        <h2 className="text-xl md:text-2xl font-extrabold text-white drop-shadow">Balances</h2>
      </div>
      {status === 'loading' ? (
        <div className="text-blue-200 text-sm">Loading balances...</div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : !hasBalances ? (
        <div className="text-gray-500 text-sm">No balances found.</div>
      ) : (
        <ul className="flex flex-col gap-1 md:gap-2">
          {Object.entries(safeBalances).map(([person, balance]) => (
            <li key={person} className="flex justify-between items-center py-1 md:py-2 border-b border-blue-900 last:border-b-0 transition-all duration-200 hover:bg-zinc-800/60 rounded-lg md:rounded-xl">
              <span className="font-medium text-blue-200 text-sm md:text-lg truncate">{person}</span>
              <span className={`${balance < 0 ? 'text-red-400' : 'text-green-400'} font-bold text-sm md:text-lg`}>
                ₹{balance.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Balances;
