import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import useToast from '../hooks/useToast';

const ExpenseForm = ({ onAdd, group, editExpense, setEditExpense }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splitDetails, setSplitDetails] = useState({});
  const [splitWith, setSplitWith] = useState([]); // Initialize splitWith as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const { toast, showToast, closeToast } = useToast();
  const [paidByError, setPaidByError] = useState('');

  // Fetch all users from backend 
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const token = sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/people/users`, { headers });
        const data = await res.json();
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setUsers([]);
      }
      setUsersLoading(false);
    };
    fetchUsers();
  }, []);

  // Default paidBy to logged-in user
  useEffect(() => {
    const user = sessionStorage.getItem('username');
    if (user) setPaidBy(user);
  }, []);

  // Handle checkbox change for splitWith
  const handleSplitWithChange = (person) => {
    setSplitWith(prev => prev.includes(person) ? prev.filter(p => p !== person) : [...prev, person]);
  };

  // Handle split type change
  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    setSplitDetails({});
  };

  // Validate split details
  const validateSplitDetails = () => {
    const safeSplitWith = Array.isArray(splitWith) ? splitWith : [];
    if (safeSplitWith.length === 0) return 'Select at least one person to split with.';
    if (splitType === 'percentage') {
      const total = safeSplitWith.reduce((sum, p) => sum + Number(splitDetails[p] || 0), 0);
      if (total !== 100) return 'Percentages must add up to 100.';
    }
    if (splitType === 'exact') {
      const total = safeSplitWith.reduce((sum, p) => sum + Number(splitDetails[p] || 0), 0);
      if (Number(amount) !== total) return 'Amounts must add up to total.';
    }
    if (splitType === 'shares') {
      const totalShares = safeSplitWith.reduce((sum, p) => sum + Number(splitDetails[p] || 0), 0);
      if (totalShares === 0) return 'Total shares must be greater than 0.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPaidByError('');
    if (!paidBy) {
      setPaidByError('Please select who paid.');
      showToast('Please select who paid.', 'error');
      return;
    }
    const splitErr = validateSplitDetails();
    if (splitErr) {
      setError(splitErr);
      showToast(splitErr, 'error');
      return;
    }
    setLoading(true);
    try {
      // For 'equal' split, build split_details as { person: 1, ... }
      const splitDetailsToSend = splitType === 'equal'
        ? Object.fromEntries(splitWith.map(person => [person, 1]))
        : splitDetails;
      await onAdd({
        amount: Number(amount),
        description,
        paid_by: paidBy,
        split_type: splitType,
        split_details: splitDetailsToSend,
        split_with: splitWith,
        group
      });
      setAmount(''); setDescription(''); setSplitDetails({}); setSplitWith([]); setEditExpense && setEditExpense(null);
      showToast('Expense added!', 'success');
    } catch (err) {
      setError('Failed to add expense.');
      showToast('Failed to add expense.', 'error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-blue-700 mb-2">Add Expense</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2" />
        <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required className="border border-purple-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-700 placeholder-purple-300 flex-1" />
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <label className="block font-semibold mb-1 text-blue-200">Paid By</label>
          <select
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2"
          >
            {usersLoading ? (
              <option>Loading users...</option>
            ) : Array.isArray(users) && users.length > 0 ? (
              users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))
            ) : (
              <option disabled>No users found</option>
            )}
          </select>
        </div>
        {paidByError && <div className="text-red-500 text-xs mt-1">{paidByError}</div>}
        <div className="flex-1">
          <label className="block font-semibold mb-1 text-blue-200">Split With</label>
          <div className="flex flex-wrap gap-2">
            {usersLoading ? <div>Loading users...</div> : Array.isArray(users) && users.length > 0 ? users.map(user => (
              <label key={user} className="flex items-center gap-1">
                <input type="checkbox" checked={Array.isArray(splitWith) && splitWith.includes(user)} onChange={() => handleSplitWithChange(user)} className="accent-blue-500" />
                <span className="text-blue-200">{user}</span>
              </label>
            )) : <span className="text-gray-400">No users found.</span>}
          </div>
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-2 text-blue-200">Split Type</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="splitType" value="equal" checked={splitType === 'equal'} onChange={() => handleSplitTypeChange('equal')} className="accent-blue-500" />
            <span>Evenly</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="splitType" value="percentage" checked={splitType === 'percentage'} onChange={() => handleSplitTypeChange('percentage')} className="accent-blue-500" />
            <span>By Percentage</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="splitType" value="exact" checked={splitType === 'exact'} onChange={() => handleSplitTypeChange('exact')} className="accent-blue-500" />
            <span>By Amount</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="splitType" value="shares" checked={splitType === 'shares'} onChange={() => handleSplitTypeChange('shares')} className="accent-blue-500" />
            <span>By Shares</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-2">Split Details</label>
        {Array.isArray(splitWith) && splitWith.length > 0 ? splitWith.map(person => (
          <div key={person} className="flex items-center gap-2 mb-2">
            <span className="text-purple-700 font-medium w-24">{person}</span>
            {splitType === 'equal' ? (
              <input
                type="number"
                value={1}
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
            {splitType === 'exact' && <span className="text-gray-500">9</span>}
            {splitType === 'shares' && <span className="text-gray-500">shares</span>}
          </div>
        )) : null}
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white rounded px-4 py-2 font-bold shadow transition disabled:opacity-50 mt-2" disabled={loading}>
        {loading ? 'Adding...' : editExpense ? 'Update Expense' : 'Add Expense'}
      </button>
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </form>
  );
};

export default ExpenseForm;
