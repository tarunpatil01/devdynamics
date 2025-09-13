import React, { useState, useEffect, useMemo } from 'react';
import Toast from './Toast';
import useToast from '../hooks/useToast';
import ExpensesList from './ExpensesList';

// Tooltip component
const Tooltip = ({ text, children }) => (
  <span className="relative group">
    {children}
    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs px-3 py-2 rounded bg-zinc-800 text-blue-100 text-xs shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity z-50">
      {text}
    </span>
  </span>
);

const ExpenseForm = ({ onAdd, group, groups = [], editExpense, setEditExpense, recentExpenses = [], onEdit, onDelete }) => {
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
  const [paidByInput, setPaidByInput] = useState('');
  const [splitWithInput, setSplitWithInput] = useState('');
  const [splitWithSuggestions, setSplitWithSuggestions] = useState([]);

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
      // For editing, populate split_with from split_details keys if split_with is empty
      const splitWithFromDetails = Object.keys(editExpense.split_details || {});
      const splitWithFromExpense = Array.isArray(editExpense.split_with) ? editExpense.split_with : [];
      setSplitWith(splitWithFromExpense.length > 0 ? splitWithFromExpense : splitWithFromDetails);
      setCategory(editExpense.category || 'Food');
      setSelectedGroup(editExpense.group || group || '');
      if (editExpense.recurring && editExpense.recurring.type) {
        setRecurringType(editExpense.recurring.type);
        setNextDue(editExpense.recurring.next_due || '');
      } else {
        setRecurringType('none');
        setNextDue('');
      }
    }
  }, [editExpense, group]);

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
        ...(editExpense && editExpense._id ? { _id: editExpense._id } : {}),
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

  // Memoize safeSplitWith to avoid accidental ReferenceError and unnecessary recalculations
  const safeSplitWith = useMemo(() => (Array.isArray(splitWith) ? splitWith : []), [splitWith]);
  // Deduplicate usernames (case-insensitive) and filter out userId-like strings
  const safeUsers = Array.isArray(users)
    ? Array.from(new Set(users
        .filter(user => typeof user === 'string' && user.trim().length > 0 && !user.match(/^[0-9a-fA-F]{24}$/))
        .map(u => u.trim().toLowerCase())
      ))
      .map(u => users.find(orig => typeof orig === 'string' && orig.trim().toLowerCase() === u))
    : [];

  // Auto-complete for Paid By
  const paidBySuggestions = safeUsers.filter(u => u.toLowerCase().includes(paidByInput.toLowerCase()));
  // Auto-complete for Split With
  useEffect(() => {
    if (splitWithInput) {
      setSplitWithSuggestions(safeUsers.filter(u => u.toLowerCase().includes(splitWithInput.toLowerCase()) && !safeSplitWith.includes(u)));
    } else {
      setSplitWithSuggestions([]);
    }
  }, [splitWithInput, safeUsers, safeSplitWith]);

  return (
    <>
    <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-blue-700 mb-2 flex items-center gap-2">
        Add Expense
        <Tooltip text="Fill out the form to add a new group expense. All fields are required."><span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span></Tooltip>
      </h2>
      {Array.isArray(groups) && groups.length > 1 && (
        <div className="mb-2">
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative min-w-[120px] max-w-[180px]">
          <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className={`border ${error.includes('Amount') ? 'border-red-500' : 'border-blue-500'} bg-zinc-800 text-white placeholder:text-blue-300 rounded px-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2`} />
          <span className="absolute right-2 top-2">
            <Tooltip text="Enter the total amount for this expense."><span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span></Tooltip>
          </span>
          {error.includes('Amount') && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
        <div className="flex-[2] relative min-w-[200px]">
          <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required className={`border ${error.includes('Description') ? 'border-red-500' : 'border-purple-300'} rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-700 placeholder-purple-300 w-full`} />
          <span className="absolute right-2 top-2">
            <Tooltip text="Describe what this expense is for (e.g., Dinner, Taxi, etc.)"><span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span></Tooltip>
          </span>
          {error.includes('Description') && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
        <div className="flex-1 min-w-[160px] max-w-[220px]">
          <select value={category} onChange={e => setCategory(e.target.value)} required className="border border-green-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 w-full mb-2">
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Utilities">Utilities</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <label className="block font-semibold mb-1 text-blue-200 flex items-center gap-2">
            Paid By
            <Tooltip text="Who paid for this expense? Start typing to search group members."><span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span></Tooltip>
          </label>
          <input
            type="text"
            value={paidByInput || paidBy}
            onChange={e => {
              setPaidByInput(e.target.value);
              setPaidBy(e.target.value);
            }}
            className={`border ${paidByError ? 'border-red-500' : 'border-blue-500'} bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2`}
            placeholder="Type to search..."
            autoComplete="off"
          />
          {paidByInput && paidBySuggestions.length > 0 && (
            <ul className="absolute z-10 bg-zinc-900 border border-blue-700 rounded w-full mt-1 max-h-32 overflow-y-auto">
              {paidBySuggestions.map(u => (
                <li key={u} className="px-3 py-1 hover:bg-blue-800 cursor-pointer" onClick={() => { setPaidBy(u); setPaidByInput(u); }}>
                  {u}
                </li>
              ))}
            </ul>
          )}
          {paidByError && <div className="text-red-500 text-xs mt-1">{paidByError}</div>}
        </div>
        <div className="flex-1 relative">
          <label className="block font-semibold mb-1 text-blue-200 flex items-center gap-2">
            Split With
            <Tooltip text="Select group members to split this expense with. Type to search and add."><span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span></Tooltip>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {safeSplitWith.map(user => (
              <span key={user} className="bg-blue-700 text-white rounded-full px-3 py-1 flex items-center gap-1">
                {user}
                <button type="button" className="ml-1 text-white hover:text-red-400" onClick={() => handleSplitWithChange(user)}>&times;</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={splitWithInput}
            onChange={e => setSplitWithInput(e.target.value)}
            className="border border-blue-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 w-full mb-2"
            placeholder="Type to add member..."
            autoComplete="off"
          />
          {splitWithInput && splitWithSuggestions.length > 0 && (
            <ul className="absolute z-10 bg-zinc-900 border border-blue-700 rounded w-full mt-1 max-h-32 overflow-y-auto">
              {splitWithSuggestions.map(u => (
                <li key={u} className="px-3 py-1 hover:bg-blue-800 cursor-pointer" onClick={() => { setSplitWith([...safeSplitWith, u]); setSplitWithInput(''); }}>
                  {u}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-2 text-blue-200 flex items-center gap-2">
          Split Type
          <Tooltip text="Choose how to split the expense: equally, by percentage, by amount, or by shares."><span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span></Tooltip>
        </label>
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
        {safeSplitWith.length > 0 ? safeSplitWith.map(person => (
          <div key={typeof person === 'string' ? person : JSON.stringify(person)} className="flex items-center gap-2 mb-2">
            <span className="text-purple-700 font-medium w-24">{typeof person === 'string' ? person : ''}</span>
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
            {splitType === 'exact' && <span className="text-gray-500">₹</span>}
            {splitType === 'shares' && <span className="text-gray-500">shares</span>}
          </div>
        )) : null}
      </div>
      <div>
        <label className="block font-semibold mb-2 text-blue-200">Recurring</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={recurringType} onChange={e => setRecurringType(e.target.value)} className="border border-yellow-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200 w-full sm:w-48">
            <option value="none">None</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {recurringType !== 'none' && (
            <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} className="border border-yellow-500 bg-zinc-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200 w-full sm:w-48" required />
          )}
        </div>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white rounded px-4 py-2 font-bold shadow transition disabled:opacity-50 mt-2" disabled={loading}>
        {loading ? 'Adding...' : editExpense ? 'Update Expense' : 'Add Expense'}
      </button>
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
    </form>
    {/* Improve empty state for no users or no group */}
    {(!selectedGroup || safeUsers.length === 0) && (
      <div className="text-gray-400 flex flex-col items-center gap-2 mt-4">
        <span className="text-3xl">👥</span>
        {(!selectedGroup) ? 'Please select a group to add expenses.' : 'No group members found.'}
      </div>
    )}
    {/* Recent Activity Feed */}
    <div className="bg-zinc-900/80 rounded-2xl shadow-2xl border-2 border-blue-900 p-4 mt-4">
      <h3 className="text-xl font-bold text-blue-400 mb-2">Recent Activity</h3>
      <ExpensesList expenses={recentExpenses.slice(0, 5)} onEdit={onEdit} onDelete={onDelete} />
    </div>
    </>
  );
};

export default ExpenseForm;
