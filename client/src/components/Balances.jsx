import React, { useEffect, useState } from 'react';

const Balances = () => {
  const [balances, setBalances] = useState({});

  useEffect(() => {
    fetch('/balances')
      .then(res => res.json())
      .then(data => setBalances(data.data || {}));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-indigo-700 mb-4">Balances</h2>
      <ul>
        {Object.entries(balances).map(([person, balance]) => (
          <li key={person} className="flex justify-between items-center py-2 border-b last:border-b-0">
            <span className="font-medium text-gray-700">{person}</span>
            <span className={balance < 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
              {balance}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Balances;
