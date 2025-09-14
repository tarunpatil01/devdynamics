import React, { useEffect, useState } from 'react';
import ExpensesList from './ExpensesList';
import Spinner from './Spinner';
import Toast from './Toast';
import useToast from '../hooks/useToast';
import Sidebar from './Sidebar';
import { API_BASE } from '../utils/apiBase';
import authFetch from '../utils/authFetch';

const PAGE_SIZE = 5;

const categories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'];
// splitTypes not used on this page (removing to satisfy linter)

const ExpensesPage = () => {
  const token = localStorage.getItem('token');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast, closeToast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState(localStorage.getItem('selectedGroup') || '');
  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [search, setSearch] = useState('');
  const [paidByOptions, setPaidByOptions] = useState([]);
  const [editExpense, setEditExpense] = useState(null);
  // Removed unused users/usersLoading state
  const [showGroups, setShowGroups] = useState(false);
  // Move editFields & its effect before any conditional return to preserve hook order
  const [editFields, setEditFields] = useState({});
  useEffect(() => {
    if (editExpense) {
      setEditFields({
        amount: editExpense.amount ?? '',
        description: editExpense.description ?? '',
      });
    }
  }, [editExpense]);

  // Fetch groups and set default selected group if needed
  useEffect(() => {
    const fetchGroups = async () => {
      try {
  const res = await authFetch('/groups');
        const data = await res.json();
        setGroups(Array.isArray(data.data) ? data.data : []);
        if ((!selectedGroup || selectedGroup === '') && Array.isArray(data.data) && data.data.length > 0) {
          setSelectedGroup(data.data[0]._id);
          localStorage.setItem('selectedGroup', data.data[0]._id);
        }
      } catch (err) {
        console.error('fetchGroups error', err);
      }
    };
    if (token) fetchGroups();
  }, [token, selectedGroup]);

  // Fetch expenses with pagination and filters
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError('');
      try {
        let query = `?group=${selectedGroup}&page=${page}&limit=${PAGE_SIZE}`;
        if (category) query += `&category=${encodeURIComponent(category)}`;
        if (paidBy) query += `&paid_by=${encodeURIComponent(paidBy)}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
  const res = await authFetch(`/expenses${query}`);
        if (!res.ok) throw new Error('Failed to fetch expenses');
        const data = await res.json();
        setExpenses(Array.isArray(data.data) ? data.data : []);
        setTotal(data.total || 0);
        // Collect paid_by options from results
        const uniquePaidBy = Array.from(new Set((data.data || []).map(e => e.paid_by && e.paid_by.username ? e.paid_by.username : '').filter(Boolean)));
        setPaidByOptions(uniquePaidBy);
      } catch (err) {
        console.error('fetchExpenses error', err);
        setError('Failed to load expenses.');
        showToast('Failed to load expenses.', 'error');
      }
      setLoading(false);
    };
    if (token && selectedGroup) fetchExpenses();
  }, [token, selectedGroup, page, category, paidBy, search, showToast]);

  // Fallback UI if no group is selected (after all hooks declared)
  if (!selectedGroup) {
    return (
      <div className="min-h-screen w-full flex flex-row bg-gradient-to-br from-black via-zinc-900 to-blue-950">
        <Sidebar showGroups={showGroups} setShowGroups={setShowGroups} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-2xl">Please select a group to view expenses.</div>
        </div>
      </div>
    );
  }

  const handleEdit = (expense) => {
    setEditExpense(expense);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const res = await authFetch(`/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      setExpenses(prev => prev.filter(e => e._id !== id));
      showToast('Expense deleted!', 'success');
    } catch (err) {
      console.error('handleDelete error', err);
      setError('Failed to delete expense.');
      showToast('Failed to delete expense.', 'error');
    }
  };

  // Pagination controls
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // (editFields state & effect moved above)

  const handleEditFieldChange = (field, value) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFields.amount || isNaN(editFields.amount) || Number(editFields.amount) <= 0) {
      showToast('Amount must be a positive number.', 'error');
      return;
    }
    if (!editFields.description || !editFields.description.trim()) {
      showToast('Description is required.', 'error');
      return;
    }
    try {
      const payload = {
        amount: Number(editFields.amount),
        description: editFields.description,
      };
      const res = await authFetch(`/expenses/${editExpense._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
          if (paidBy) query += `&paid_by=${encodeURIComponent(paidBy)}`;
          if (search) query += `&search=${encodeURIComponent(search)}`;
          const res = await authFetch(`/expenses${query}`);
          if (!res.ok) throw new Error('Failed to fetch expenses');
          const data = await res.json();
          setExpenses(Array.isArray(data.data) ? data.data : []);
          setTotal(data.total || 0);
        } catch (err) {
          console.error('fetchExpenses refresh error', err);
          setError('Failed to load expenses.');
          showToast('Failed to load expenses.', 'error');
        }
        setLoading(false);
      };
      fetchExpenses();
    } catch (err) {
      console.error('handleEditSubmit error', err);
      showToast('Failed to update expense.', 'error');
    }
  };
  return (
    <div className="min-h-screen w-full flex flex-row bg-gradient-to-br from-black via-zinc-900 to-blue-950">
      <Sidebar showGroups={showGroups} setShowGroups={setShowGroups} />
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">All Expenses</h1>
          {/* Group Selector Dropdown */}
          {groups.length > 0 && (
            <div className="mb-6 flex items-center gap-4">
              <label className="text-blue-200 font-semibold">Group:</label>
              <select
                value={selectedGroup}
                onChange={e => {
                  setSelectedGroup(e.target.value);
                  localStorage.setItem('selectedGroup', e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded bg-zinc-800 text-blue-200 border border-blue-700"
              >
                {groups.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}
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
              {paidByOptions.map((p, idx) => <option key={`${p}-${idx}`} value={p}>{p}</option>)}
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
                  <input type="number" step="0.01" className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.amount ?? ''} onChange={e => handleEditFieldChange('amount', e.target.value)} required />
                </label>
                <label className="text-blue-200 font-semibold">Description
                  <input type="text" className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-blue-700" value={editFields.description ?? ''} onChange={e => handleEditFieldChange('description', e.target.value)} required />
                </label>
                <div className="flex gap-4 justify-end mt-4">
                  <button type="button" className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-bold" onClick={() => setEditExpense(null)}>Cancel</button>
                  <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold">Save</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;