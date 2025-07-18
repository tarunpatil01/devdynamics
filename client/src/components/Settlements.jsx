import React, { useEffect, useState } from 'react';

const Settlements = () => {
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    fetch('/settlements')
      .then(res => res.json())
      .then(data => setSettlements(data.data || []));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-indigo-700 mb-4">Settlements</h2>
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
    </div>
  );
};

export default Settlements;
