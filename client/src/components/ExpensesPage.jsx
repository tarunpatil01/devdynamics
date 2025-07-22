import React, { useEffect, useState } from 'react';
import ExpensesList from './ExpensesList';
import Spinner from './Spinner';
import Toast from './Toast';
import useToast from '../hooks/useToast';

const PAGE_SIZE = 5;

const categories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'];
const splitTypes = ['equal', 'percentage', 'exact', 'shares'];

const ExpensesPage = () => {
  const token = localStorage.getItem('token');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast, showToast, closeToast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState(localStorage.getItem('selectedGroup') || '');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [search, setSearch] = useState('');
  const [paidByOptions, setPaidByOptions] = useState([]);
  const [editExpense, setEditExpense] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch group members for edit form
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/people?group=${selectedGroup}`, { headers });
        const data = await res.json();
        setUsers(Array.isArray(data.data) ? data.data : []);
      } catch {
        setUsers([]);
      }
      setUsersLoading(false);
    };
    if (selectedGroup && token && editExpense) fetchUsers();
  }, [selectedGroup, token, editExpense]);

  // Fetch expenses with pagination and filters
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError('');
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        let query = `?group=${selectedGroup}&page=${page}&limit=${PAGE_SIZE}`;
        if (category) query += `&category=${encodeURIComponent(category)}`;
        if (paidBy) query += `&paid_by=${encodeURIComponent(paidBy)}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/expenses${query}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch expenses');
        const data = await res.json();
        setExpenses(Array.isArray(data.data) ? data.data : []);
        setTotal(data.total || 0);
        // Collect paid_by options from results
        const uniquePaidBy = Array.from(new Set((data.data || []).map(e => e.paid_by && e.paid_by.username ? e.paid_by.username : '').filter(Boolean)));
        setPaidByOptions(uniquePaidBy);
      } catch (err) {
        setError('Failed to load expenses.');
        showToast('Failed to load expenses.', 'error');
      }
      setLoading(false);
    };
    if (token && selectedGroup) fetchExpenses();
  }, [token, selectedGroup, page, category, paidBy, search]);

  const handleEdit = (expense) => {
    setEditExpense(expense);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${baseURL}/expenses/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete expense');
      setExpenses(prev => prev.filter(e => e._id !== id));
      showToast('Expense deleted!', 'success');
    } catch (err) {
      setError('Failed to delete expense.');
      showToast('Failed to delete expense.', 'error');
    }
  };

  // Pagination controls
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Edit form state
  const [editFields, setEditFields] = useState({});
  useEffect(() => {
    if (editExpense) {
      setEditFields({
        amount: editExpense.amount,
        description: editExpense.description,
        category: editExpense.category,
        paid_by: editExpense.paid_by && editExpense.paid_by.username ? editExpense.paid_by.username : '',
        split_type: editExpense.split_type,
        split_details: editExpense.split_details,
        split_with: Array.isArray(editExpense.split_with) ? editExpense.split_with.map(u => u.username) : [],
      });
    }
  }, [editExpense]);

  const handleEditFieldChange = (field, value) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!editFields.amount || isNaN(editFields.amount) || Number(editFields.amount) <= 0) {
      showToast('Amount must be a positive number.', 'error');
      return;
    }
    if (!editFields.description || !editFields.description.trim()) {
      showToast('Description is required.', 'error');
      return;
    }
    if (!editFields.paid_by) {
      showToast('Please select who paid.', 'error');
      return;
    }
    if (!editFields.category) {
      showToast('Category is required.', 'error');
      return;
    }
    if (!editFields.split_type) {
      showToast('Split type is required.', 'error');
      return;
    }
    if (!Array.isArray(editFields.split_with) || editFields.split_with.length === 0) {
      showToast('Split with must have at least one person.', 'error');
      return;
    }
    // Prepare split_details for equal split
    let splitDetailsToSend = editFields.split_details;
    if (editFields.split_type === 'equal') {
      splitDetailsToSend = Object.fromEntries(editFields.split_with.map(person => [person, 1]));
    }
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const payload = {
        amount: Number(editFields.amount),
        description: editFields.description,
        paid_by: editFields.paid_by,
        split_type: editFields.split_type,
        split_details: splitDetailsToSend,
        split_with: editFields.split_with,
        group: selectedGroup,
        category: editFields.category,
        recurring: { type: 'none' },
      };
      const res = await fetch(`${baseURL}/expenses/${editExpense._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update expense');
      setEditExpense(null);
      showToast('Expense updated!', 'success');
      // Refresh list
      const fetchExpenses = async () => {
        setLoading(true);
        setError('');
        try {
          let query = `?group=${selectedGroup}&page=${page}&limit=${PAGE_SIZE}`;
          if (category) query += `&category=${encodeURIComponent(category)}`;
          if (paidBy) query += `&paid_by=${encodeURIComponent(paidBy)}`;
          if (search) query += `&search=${encodeURIComponent(search)}`;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`${baseURL}/expenses${query}`, { headers });
          if (!res.ok) throw new Error('Failed to fetch expenses');
          const data = await res.json();
          setExpenses(Array.isArray(data.data) ? data.data : []);
          setTotal(data.total || 0);
        } catch (err) {
          setError('Failed to load expenses.');
          showToast('Failed to load expenses.', 'error');
        }
        setLoading(false);
      };
      fetchExpenses();
    } catch (err) {
      showToast('Failed to update expense.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">All Expenses</h1>
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded bg-zinc-800 text-blue-200 border border-blue-700"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={paidBy}
            onChange={e => { setPaidBy(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded bg-zinc-800 text-blue-200 border border-blue-700"
          >
            <option value="">All Payers</option>
            {paidByOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {loading && <Spinner />}
        {error && <Toast message={error} type="error" onClose={closeToast} />}
        <ExpensesList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-blue-700 text-white font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-blue-200 font-semibold">Page {page} of {totalPages || 1}</span>
          <button
            className="px-4 py-2 rounded bg-blue-700 text-white font-bold disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
        {/* Edit Modal */}
        {editExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <form onSubmit={handleEditSubmit} className="bg-zinc-900 rounded-2xl shadow-2xl p-8 border-2 border-blue-900 flex flex-col gap-4 min-w-[320px] max-w-lg w-full">
              <div className="text-xl font-bold text-white mb-2">Edit Expense</div>
              <label className="text-blue-200 font-semibold">Amount
                <input type="number" step="0.01" className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.amount} onChange={e => handleEditFieldChange('amount', e.target.value)} required />
              </label>
              <label className="text-blue-200 font-semibold">Description
                <input type="text" className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.description} onChange={e => handleEditFieldChange('description', e.target.value)} required />
              </label>
              <label className="text-blue-200 font-semibold">Category
                <select className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.category} onChange={e => handleEditFieldChange('category', e.target.value)} required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </label>
              <label className="text-blue-200 font-semibold">Paid By
                <select className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.paid_by} onChange={e => handleEditFieldChange('paid_by', e.target.value)} required>
                  <option value="">Select</option>
                  {users.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
              <label className="text-blue-200 font-semibold">Split Type
                <select className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.split_type} onChange={e => handleEditFieldChange('split_type', e.target.value)} required>
                  {splitTypes.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </label>
              <label className="text-blue-200 font-semibold">Split With
                <select multiple className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.split_with} onChange={e => handleEditFieldChange('split_with', Array.from(e.target.selectedOptions, o => o.value))} required>
                  {users.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
              {/* For non-equal splits, allow editing split_details as JSON */}
              {editFields.split_type !== 'equal' && (
                <label className="text-blue-200 font-semibold">Split Details (JSON: {{user: amount/percent}})
                  <input type="text" className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={typeof editFields.split_details === 'string' ? editFields.split_details : JSON.stringify(editFields.split_details || {})} onChange={e => handleEditFieldChange('split_details', e.target.value)} />
                </label>
              )}
              <div className="flex gap-4 justify-end mt-4">
                <button type="button" className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-bold" onClick={() => setEditExpense(null)}>Cancel</button>
                <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesPage; 