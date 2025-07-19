import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import useToast from '../hooks/useToast';

const ExpenseForm = ({ onAdd, group, groups = [], editExpense, setEditExpense }) => {
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
  const [category, setCategory] = useState('Food');
  const [recurringType, setRecurringType] = useState('none');
  const [nextDue, setNextDue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(group || (Array.isArray(groups) && groups.length === 1 ? groups[0]._id : ''));

  // Default paidBy to logged-in user
  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) setPaidBy(user);
  }, []);

  useEffect(() => {
    if (group) setSelectedGroup(group);
  }, [group]);

  // Populate form when editing an expense
  useEffect(() => {
    if (editExpense) {
      setAmount(String(editExpense.amount || ''));
      setDescription(editExpense.description || '');
      setPaidBy(editExpense.paid_by || '');
      setSplitType(editExpense.split_type || 'equal');
      setSplitDetails(editExpense.split_details || {});
      setSplitWith(Array.isArray(editExpense.split_with) ? editExpense.split_with : []);
      setCategory(editExpense.category || 'Food');
      setSelectedGroup(editExpense.group || group || '');
      if (editExpense.recurring && typeof editExpense.recurring === 'object') {
        setRecurringType(editExpense.recurring.type || 'none');
        setNextDue(editExpense.recurring.next_due || '');
      } else {
        setRecurringType('none');
        setNextDue('');
      }
    }
  }, [editExpense, group]);

  // Fetch group members for selected group, or all users if no group is selected
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let url;
        if (selectedGroup) {
          url = `${baseURL}/people/group/${selectedGroup}`;
        } else {
          url = `${baseURL}/people/users`;
        }
        const res = await fetch(url, { headers });
        const data = await res.json();
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setUsers([]);
      }
      setUsersLoading(false);
    };
    fetchUsers();
  }, [selectedGroup]);

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
    // Frontend validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Amount must be a positive number.');
      showToast('Amount must be a positive number.', 'error');
      return;
    }
    if (!description || !description.trim()) {
      setError('Description is required.');
      showToast('Description is required.', 'error');
      return;
    }
    if (!paidBy) {
      setPaidByError('Please select who paid.');
      showToast('Please select who paid.', 'error');
      return;
    }
    if (!category) {
      setError('Category is required.');
      showToast('Category is required.', 'error');
      return;
    }
    if (!selectedGroup) {
      setError('Please select a group before adding an expense.');
      showToast('Please select a group before adding an expense.', 'error');
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
      const recurring = { type: recurringType };
      if (recurringType !== 'none' && nextDue) {
        recurring.next_due = nextDue;
      }
      const splitDetailsToSend = splitType === 'equal'
        ? Object.fromEntries((Array.isArray(splitWith) ? splitWith : []).map(person => [person, 1]))
        : splitDetails;
      await onAdd({
        _id: editExpense?._id, // Include ID for editing
        amount: Number(amount),
        description,
        paid_by: paidBy,
        split_type: splitType,
        split_details: splitDetailsToSend,
        split_with: splitWith,
        group: selectedGroup,
        category,
        recurring
      });
      setAmount(''); setDescription(''); setSplitDetails({}); setSplitWith([]); setEditExpense && setEditExpense(null);
      setCategory('Food'); setRecurringType('none'); setNextDue('');
      showToast(editExpense ? 'Expense updated!' : 'Expense added!', 'success');
    } catch (err) {
      setError('Failed to add expense.');
      showToast('Failed to add expense.', 'error');
    }
    setLoading(false);
  };

  const safeSplitWith = Array.isArray(splitWith) ? splitWith : [];
  const safeUsers = Array.isArray(users) ? users.filter(user => 
    typeof user === 'string' && 
    user.trim().length > 0 && 
    !user.match(/^[0-9a-fA-F]{24}$/) // Filter out ObjectId strings
  ) : [];

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-lg rounded-lg shadow-2xl p-2 md:p-3 mb-3 md:mb-4 border-2 border-blue-900 text-white animate-fadein flex flex-col gap-2 md:gap-3 w-full overflow-hidden">
      <h2 className="text-lg md:text-xl font-bold text-blue-700 mb-1">{editExpense ? 'Edit Expense' : 'Add Expense'}</h2>
      {Array.isArray(groups) && groups.length > 1 && (
        <div className="mb-1 w-full">
          <label className="block font-semibold mb-1 text-blue-200 text-xs">Group</label>
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-xs"
            required
          >
            <option value="" disabled>Select group</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-1 md:gap-2 w-full">
        <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-xs" />
        <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required className="border border-purple-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-700 placeholder-purple-300 w-full text-xs" />
        <select value={category} onChange={e => setCategory(e.target.value)} required className="border border-green-500 bg-zinc-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 w-full text-xs">
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Utilities">Utilities</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="flex flex-col lg:flex-row gap-1 md:gap-2 items-start w-full">
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-blue-200 text-xs">Paid By</label>
          <select
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-xs"
          >
            {usersLoading ? (
              <option>Loading users...</option>
            ) : (
              safeUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))
            )}
          </select>
          {paidByError && <div className="text-red-400 text-xs mt-1">{paidByError}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-blue-200 text-xs">Split Type</label>
          <select
            value={splitType}
            onChange={e => handleSplitTypeChange(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-xs"
          >
            <option value="equal">Equal</option>
            <option value="percentage">Percentage</option>
            <option value="exact">Exact Amount</option>
            <option value="shares">Shares</option>
          </select>
        </div>
      </div>
      <div className="w-full">
        <label className="block font-semibold mb-1 text-blue-200 text-xs">Split With</label>
        <div className="flex flex-wrap gap-1 mb-2 max-w-full">
          {safeUsers.map(user => (
            <label key={user} className="flex items-center gap-1 bg-zinc-800 rounded px-2 py-1 cursor-pointer hover:bg-zinc-700 transition-all duration-200">
              <input
                type="checkbox"
                checked={safeSplitWith.includes(user)}
                onChange={() => handleSplitWithChange(user)}
                className="rounded border-blue-500 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-white truncate text-xs">{user}</span>
            </label>
          ))}
        </div>
      </div>
      {safeSplitWith.length > 0 && (
        <div className="w-full">
          <label className="block font-semibold mb-1 text-blue-200 text-xs">Split Details</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2">
            {safeSplitWith.map(person => (
              <div key={person} className="flex flex-col gap-1">
                <label className="text-xs text-gray-300 truncate">{person}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={splitType === 'percentage' ? 'Percentage' : splitType === 'exact' ? 'Amount' : 'Shares'}
                  value={splitDetails[person] || ''}
                  onChange={e => setSplitDetails(prev => ({ ...prev, [person]: e.target.value }))}
                  className="border border-blue-500 bg-zinc-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-1 md:gap-2 w-full">
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-blue-200 text-xs">Recurring</label>
          <select
            value={recurringType}
            onChange={e => setRecurringType(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-xs"
          >
            <option value="none">None</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        {recurringType !== 'none' && (
          <div className="flex-1 min-w-0">
            <label className="block font-semibold mb-1 text-blue-200 text-xs">Next Due</label>
            <input
              type="date"
              value={nextDue}
              onChange={e => setNextDue(e.target.value)}
              className="border border-blue-500 bg-zinc-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full text-xs"
            />
          </div>
        )}
      </div>
      {error && <div className="text-red-400 text-center text-xs">{error}</div>}
      <div className="flex gap-1 md:gap-2 justify-end">
        {editExpense && (
          <button
            type="button"
            onClick={() => setEditExpense(null)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded font-bold shadow transition-all duration-200 text-xs"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded font-bold shadow transition-all duration-200 disabled:opacity-50 text-xs"
        >
          {loading ? (editExpense ? 'Updating...' : 'Adding...') : (editExpense ? 'Update Expense' : 'Add Expense')}
        </button>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </form>
  );
};

export default ExpenseForm;
