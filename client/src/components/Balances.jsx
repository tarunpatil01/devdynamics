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
    <div className="min-h-screen w-full max-w-2xl mx-auto bg-zinc-900/80 backdrop-blur-lg rounded-lg shadow-2xl p-2 md:p-4 mb-2 md:mb-4 border-2 border-blue-900 text-white animate-fadein overflow-x-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-3 gap-1 md:gap-2 w-full">
        <h2 className="text-lg md:text-xl font-extrabold text-white drop-shadow">Balances</h2>
      </div>
      {status === 'loading' ? (
        <div className="text-blue-200 text-xs">Loading balances...</div>
      ) : error ? (
        <div className="text-red-400 text-xs">{error}</div>
      ) : !hasBalances ? (
        <div className="text-gray-500 text-xs">No balances found.</div>
      ) : (
        <ul className="flex flex-col gap-1 w-full">
          {Object.entries(safeBalances).map(([person, balance]) => (
            <li key={person} className="flex justify-between items-center py-1 border-b border-blue-900 last:border-b-0 transition-all duration-200 hover:bg-zinc-800/60 rounded-lg w-full">
              <span className="font-medium text-blue-200 text-xs md:text-sm truncate max-w-[50%]">{person}</span>
              <span className={`${balance < 0 ? 'text-red-400' : 'text-green-400'} font-bold text-xs md:text-sm text-right max-w-[40%]`}>
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
