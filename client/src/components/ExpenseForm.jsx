import React, { useState } from 'react';

const ExpenseForm = ({ onAdd }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splitDetails, setSplitDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let details = {};
    if (splitType === 'equal') {
      splitDetails.split(',').forEach(name => {
        details[name.trim()] = 1;
      });
    } else if (splitType === 'percentage' || splitType === 'exact') {
      splitDetails.split(',').forEach(pair => {
        const [name, value] = pair.split(':');
        details[name.trim()] = Number(value);
      });
    }
    onAdd({ amount: Number(amount), description, paid_by: paidBy, split_type: splitType, split_details: details });
    setAmount(''); setDescription(''); setPaidBy(''); setSplitDetails('');
  };

  return (
    <form className="flex flex-col gap-4 bg-indigo-50 p-6 rounded-xl mb-8 shadow" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-semibold text-indigo-700 mb-2">Add Expense</h2>
      <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className="border border-indigo-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required className="border border-indigo-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <input type="text" placeholder="Paid By" value={paidBy} onChange={e => setPaidBy(e.target.value)} required className="border border-indigo-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <select value={splitType} onChange={e => setSplitType(e.target.value)} className="border border-indigo-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400">
        <option value="equal">Equal</option>
        <option value="percentage">Percentage</option>
        <option value="exact">Exact</option>
      </select>
      <input type="text" placeholder="Split Details (e.g. Alice,Bob) or Alice:50,Bob:50" value={splitDetails} onChange={e => setSplitDetails(e.target.value)} required className="border border-indigo-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2 font-semibold hover:bg-indigo-700 transition">Add Expense</button>
    </form>
  );
};

export default ExpenseForm;
