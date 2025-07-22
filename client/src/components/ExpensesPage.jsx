import React, { useEffect, useState } from 'react';
import ExpensesList from './ExpensesList';
import Spinner from './Spinner';
import Toast from './Toast';
import useToast from '../hooks/useToast';

const ExpensesPage = () => {
  const token = localStorage.getItem('token');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast, showToast, closeToast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState(localStorage.getItem('selectedGroup') || '');

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError('');
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const groupParam = selectedGroup ? `?group=${selectedGroup}` : '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/expenses${groupParam}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch expenses');
        const data = await res.json();
        setExpenses(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError('Failed to load expenses.');
        showToast('Failed to load expenses.', 'error');
      }
      setLoading(false);
    };
    if (token && selectedGroup) fetchExpenses();
  }, [token, selectedGroup]);

  const handleEdit = (expense) => {
    // Optionally implement edit logic or navigate to edit page
    showToast('Edit functionality coming soon!', 'info');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">All Expenses</h1>
        {loading && <Spinner />}
        {error && <Toast message={error} type="error" onClose={closeToast} />}
        <ExpensesList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ExpensesPage; 