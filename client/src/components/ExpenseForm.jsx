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
      showToast('Expense added!', 'success');
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
    <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein flex flex-col gap-4 w-full overflow-hidden">
      <h2 className="text-2xl font-bold text-blue-700 mb-2">Add Expense</h2>
      {Array.isArray(groups) && groups.length > 1 && (
        <div className="mb-2 w-full">
          <label className="block font-semibold mb-1 text-blue-200">Group</label>
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2"
            required
          >
            <option value="" disabled>Select group</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className="border border-blue-500 bg-zinc-800 text-white placeholder:text-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full" />
        <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required className="border border-purple-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-700 placeholder-purple-300 w-full" />
        <select value={category} onChange={e => setCategory(e.target.value)} required className="border border-green-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 w-full">
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Utilities">Utilities</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-blue-200">Paid By</label>
          <select
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full"
          >
            {usersLoading ? (
              <option>Loading users...</option>
            ) : (
              safeUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))
            )}
          </select>
          {paidByError && <div className="text-red-400 text-sm mt-1">{paidByError}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-blue-200">Split Type</label>
          <select
            value={splitType}
            onChange={e => handleSplitTypeChange(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full"
          >
            <option value="equal">Equal</option>
            <option value="percentage">Percentage</option>
            <option value="exact">Exact Amount</option>
            <option value="shares">Shares</option>
          </select>
        </div>
      </div>
      <div className="w-full">
        <label className="block font-semibold mb-2 text-blue-200">Split With</label>
        <div className="flex flex-wrap gap-2 mb-4 max-w-full">
          {safeUsers.map(user => (
            <label key={user} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-zinc-700 transition-all duration-200">
              <input
                type="checkbox"
                checked={safeSplitWith.includes(user)}
                onChange={() => handleSplitWithChange(user)}
                className="rounded border-blue-500 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-white truncate">{user}</span>
            </label>
          ))}
        </div>
      </div>
      {safeSplitWith.length > 0 && (
        <div className="w-full">
          <label className="block font-semibold mb-2 text-blue-200">Split Details</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeSplitWith.map(person => (
              <div key={person} className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 truncate">{person}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={splitType === 'percentage' ? 'Percentage' : splitType === 'exact' ? 'Amount' : 'Shares'}
                  value={splitDetails[person] || ''}
                  onChange={e => setSplitDetails(prev => ({ ...prev, [person]: e.target.value }))}
                  className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-blue-200">Recurring</label>
          <select
            value={recurringType}
            onChange={e => setRecurringType(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full"
          >
            <option value="none">None</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        {recurringType !== 'none' && (
          <div className="flex-1 min-w-0">
            <label className="block font-semibold mb-1 text-blue-200">Next Due</label>
            <input
              type="date"
              value={nextDue}
              onChange={e => setNextDue(e.target.value)}
              className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full"
            />
          </div>
        )}
      </div>
      {error && <div className="text-red-400 text-center">{error}</div>}
      <div className="flex gap-4 justify-end">
        {editExpense && (
          <button
            type="button"
            onClick={() => setEditExpense(null)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold shadow transition-all duration-200"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded font-bold shadow transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Adding...' : (editExpense ? 'Update Expense' : 'Add Expense')}
        </button>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </form>
  );
};

export default ExpenseForm;
