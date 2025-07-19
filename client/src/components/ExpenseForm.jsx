import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import useToast from '../hooks/useToast';


const ExpenseForm = ({ onAdd, people, group }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splitDetails, setSplitDetails] = useState({});
  const [splitWith, setSplitWith] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast, showToast, closeToast } = useToast();

  // Default paidBy to logged-in user
  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) setPaidBy(user);
  }, []);

  // Handle checkbox change for splitWith
  const handleSplitWithChange = (person) => {
    setSplitWith(prev => prev.includes(person) ? prev.filter(p => p !== person) : [...prev, person]);
  };

  // Validate splitDetails
  const validateSplitDetails = () => {
    if (splitWith.length === 0) return 'Select at least one person to split with.';
    if (splitType === 'equal') {
      // All selected people must be present
      for (let person of splitWith) {
        if (!(person in splitDetails)) return `Missing share for ${person}`;
        if (splitDetails[person] !== 1) return `Equal split must have 1 for each person.`;
      }
      return '';
    } else if (splitType === 'percentage') {
      let total = 0;
      for (let person of splitWith) {
        const val = Number(splitDetails[person]);
        if (isNaN(val) || val < 0) return `Invalid percentage for ${person}`;
        total += val;
      }
      if (Math.abs(total - 100) > 0.01) return 'Percentages must sum to 100.';
      return '';
    } else if (splitType === 'exact') {
      for (let person of splitWith) {
        const val = Number(splitDetails[person]);
        if (isNaN(val) || val < 0) return `Invalid amount for ${person}`;
      }
      return '';
    } else if (splitType === 'shares') {
      let totalShares = 0;
      for (let person of splitWith) {
        const val = Number(splitDetails[person]);
        if (isNaN(val) || val <= 0) return `Invalid shares for ${person}`;
        totalShares += val;
      }
      if (totalShares === 0) return 'Total shares must be greater than 0.';
      return '';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const splitErr = validateSplitDetails();
    if (splitErr) {
      setError(splitErr);
      showToast(splitErr, 'error');
      return;
    }
    setLoading(true);
    try {
      await onAdd({
        amount: Number(amount),
        description,
        paid_by: paidBy,
        split_type: splitType,
        split_details: splitDetails,
        split_with: splitWith,
        group
      });
      setAmount(''); setDescription(''); setPaidBy(''); setSplitDetails({}); setSplitWith([]);
      showToast('Expense added!', 'success');
    } catch (err) {
      setError('Failed to add expense.');
      showToast('Failed to add expense.', 'error');
    }
    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-4 bg-blue-50 p-6 rounded-xl mb-8 shadow border border-blue-200" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-blue-700 mb-2">Add Expense</h2>
      <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className="border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-700 placeholder-blue-300" />
      <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required className="border border-purple-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-700 placeholder-purple-300" />
      <input type="text" placeholder="Paid By" value={paidBy} onChange={e => setPaidBy(e.target.value)} required className="border border-pink-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white text-pink-700 placeholder-pink-300" />
      <div>
        <label className="block font-semibold mb-2">Split With:</label>
        <div className="flex flex-wrap gap-2">
          {people && people.length > 0 ? people.map(person => (
            <label key={person} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={splitWith.includes(person)}
                onChange={() => handleSplitWithChange(person)}
                className="accent-blue-500"
              />
              <span className="text-blue-700">{person}</span>
            </label>
          )) : <span className="text-gray-400">No people found.</span>}
        </div>
      </div>
      <select value={splitType} onChange={e => setSplitType(e.target.value)} className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-700">
        <option value="equal">Split Evenly</option>
        <option value="percentage">Split by Percentage</option>
        <option value="exact">Split by Amount</option>
        <option value="shares">Split by Shares</option>
      </select>
      <div>
        <label className="block font-semibold mb-2">Split Details:</label>
        {splitWith.map(person => (
          <div key={person} className="flex items-center gap-2 mb-2">
            <span className="text-purple-700 font-medium w-24">{person}</span>
            {splitType === 'equal' ? (
              <input
                type="number"
                value={splitDetails[person] || 1}
                min={1}
                readOnly
                className="border border-gray-300 rounded px-2 py-1 w-20 bg-gray-100 text-gray-700"
              />
            ) : (
              <input
                type="number"
                value={splitDetails[person] || ''}
                min={splitType === 'shares' ? 1 : 0}
                step="any"
                onChange={e => setSplitDetails(prev => ({ ...prev, [person]: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 w-20 text-gray-700"
                required
              />
            )}
            {splitType === 'percentage' && <span className="text-gray-500">%</span>}
            {splitType === 'exact' && <span className="text-gray-500">₹</span>}
            {splitType === 'shares' && <span className="text-gray-500">shares</span>}
          </div>
        ))}
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded px-4 py-2 font-bold hover:from-blue-600 hover:to-pink-600 transition" disabled={loading}>
        {loading ? 'Adding...' : 'Add Expense'}
      </button>
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </form>
  );
};

export default ExpenseForm;
