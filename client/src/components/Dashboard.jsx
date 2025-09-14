import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ExpenseForm from './ExpenseForm';
import ExpensesList from './ExpensesList';
import Balances from './Balances';
import Settlements from './Settlements';
import Toast from './Toast';
import useToast from '../hooks/useToast';
import GroupManager from './GroupManager';
import Sidebar from './Sidebar';
import Groups from './Groups';
import { socket } from '../socket';
import ErrorBoundary from './ErrorBoundary';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import { API_BASE } from '../utils/apiBase';
import authFetch from '../utils/authFetch';

function Dashboard() {
  const categories = ['Food', 'Travel', 'Utilities', 'Entertainment', 'Other'];
  const splitTypes = ['equal', 'percentage', 'exact', 'shares'];
  // Hamburger sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Always read token from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [expenses, setExpenses] = useState([]);
  const [editExpense, setEditExpense] = useState(null);
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast, showToast, closeToast } = useToast();
  // Removed unused user state (was not referenced)
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [groupPeople, setGroupPeople] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [globalError, setGlobalError] = useState('');
  const navigate = useNavigate();
  // TODO: re-enable recurring expenses if feature revived
  // const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [users, setUsers] = useState([]);
  // const [usersLoading, setUsersLoading] = useState(false); // unused

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // React to auth token changes fired elsewhere (e.g., Login component)
  useEffect(() => {
    const handleTokenChange = () => {
      setToken(localStorage.getItem('token') || '');
    };
    window.addEventListener('auth-token-changed', handleTokenChange);
    window.addEventListener('storage', handleTokenChange);
    return () => {
      window.removeEventListener('auth-token-changed', handleTokenChange);
      window.removeEventListener('storage', handleTokenChange);
    };
  }, []);

  useEffect(() => {
    if (token && selectedGroup) {
      socket.auth = { token };
      socket.connect();
      socket.emit('joinGroup', selectedGroup);
      socket.on('groupMessage', (msg) => {
        setGroupMessages((prev) => [...prev, msg]);
      });
    }
    return () => {
      socket.off('groupMessage');
      socket.disconnect();
    };
  }, [token, selectedGroup]);

  // Listen for new group creation
  useEffect(() => {
    socket.on('groupCreated', () => {
      fetchAll(); // Refetch groups
    });
    // Listen for new expense in the current group
    socket.on('expenseCreated', (expense) => {
      if (expense.group === selectedGroup) {
        fetchAll(); // Refetch expenses, balances, etc.
      }
    });
    socket.on('expenseUpdated', (expense) => {
      if (expense.group === selectedGroup) {
        fetchAll();
      }
    });
    socket.on('expenseDeleted', (payload) => {
      if (payload.group === selectedGroup) {
        fetchAll();
      }
    });
    socket.on('groupUpdated', () => {
      fetchAll();
    });
    return () => {
      socket.off('groupCreated');
      socket.off('expenseCreated');
      socket.off('expenseUpdated');
      socket.off('expenseDeleted');
      socket.off('groupUpdated');
    };
    // fetchAll intentionally excluded to avoid ref re-creation churn; stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);

  // Fetch all data for selected group
  const fetchAll = React.useCallback(async () => {
    if (!token || !selectedGroup) {
      setLoading(false); // Hide spinner if no group is selected
      return;
    }
    setLoading(true);
    setError('');
    try {
      const isValidGroup = typeof selectedGroup === 'string' && selectedGroup.trim() !== '' && /^[0-9a-fA-F]{24}$/.test(selectedGroup.trim());
      const groupParam = isValidGroup ? `?group=${selectedGroup}` : '';
      const [expRes, balRes, setRes, grpRes] = await Promise.all([
        authFetch(`/expenses${groupParam}`),
        authFetch(`/balances${groupParam}`),
        authFetch(`/settlements${groupParam}`),
        authFetch('/groups'),
      ]);
      if (!expRes.ok || !balRes.ok || !setRes.ok || !grpRes.ok) throw new Error('Failed to fetch data');
      const expData = await expRes.json();
      const balData = await balRes.json();
      const setData = await setRes.json();
      const grpData = await grpRes.json();
      setExpenses(Array.isArray(expData.data) ? expData.data : []);
      setBalances(balData.data && typeof balData.data === 'object' ? balData.data : {});
      setSettlements(Array.isArray(setData.data) ? setData.data : []);
      setGroups(Array.isArray(grpData.data) ? grpData.data : []);
      if (isValidGroup) {
        const pplRes = await authFetch(`/people${groupParam}`);
        const pplData = pplRes.ok ? await pplRes.json() : { data: [] };
        setGroupPeople(Array.isArray(pplData.data) ? pplData.data : []);
        const msgRes = await authFetch(`/groups/${selectedGroup}/messages`);
        const msgData = msgRes.ok ? await msgRes.json() : { data: [] };
        setGroupMessages(Array.isArray(msgData.data) ? msgData.data : []);
      }
    } catch (err) {
      console.error('fetchAll error', err);
      setError('Failed to load data.');
      showToast('Failed to load data.', 'error');
    }
    setLoading(false);
  }, [token, selectedGroup, showToast]);

  // Add person to group
  const handleAddPersonToGroup = async (personName) => {
    try {
      const res = await authFetch(`/groups/${selectedGroup}/add-person`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: personName })
      });
      if (!res.ok) throw new Error('Failed to add person');
      await fetchAll();
      showToast('Person added to group!', 'success');
    } catch (err) {
      console.error('handleAddPersonToGroup error', err);
      showToast('Failed to add person.', 'error');
    }
  };

  // Send message in group
  const handleSendGroupMessage = async (message) => {
    try {
      const res = await authFetch(`/groups/${selectedGroup}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      if (!res.ok) throw new Error('Failed to send message');
      const { data: msg } = await res.json();
      // Use username from localStorage for sender name
      const username = localStorage.getItem('username') || 'Unknown';
      socket.emit('groupMessage', {
        groupId: selectedGroup,
        sender: username,
        text: msg.text,
        created_at: msg.created_at
      });
      showToast('Message sent!', 'success');
    } catch (err) {
      console.error('handleSendGroupMessage error', err);
      showToast('Failed to send message.', 'error');
    }
  };

  useEffect(() => {
    if (token) fetchAll();
  }, [fetchAll, token]);

  const addExpense = async (expense, isEdit = false) => {
    setError('');
    // Optimistic UI: add expense immediately
    if (!isEdit) {
      const tempId = 'temp-' + Date.now();
      const optimisticExpense = { ...expense, _id: tempId, optimistic: true };
      setExpenses(prev => [optimisticExpense, ...prev]);
    }
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const endpoint = isEdit ? `/expenses/${expense._id}` : '/expenses';
      // Defensive: ensure split_with is array, split_details is object, group is present, amount is number
      const payload = {
        ...expense,
        amount: Number(expense.amount),
        split_with: Array.isArray(expense.split_with) ? expense.split_with : [],
        split_details: (expense.split_details && typeof expense.split_details === 'object') ? expense.split_details : {},
        group: (expense.group && expense.group !== '{{groupId}}' && expense.group !== '') ? expense.group : selectedGroup,
      };
      console.log('Sending payload to backend:', JSON.stringify(payload, null, 2));
      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        if (res.status === 404) {
          showToast('Expense not found. It may have been deleted.', 'error');
          setError('Expense not found. It may have been deleted.');
        } else {
          showToast('Failed to save expense.', 'error');
          setError('Failed to save expense.');
        }
        // Revert optimistic update
        if (!isEdit) setExpenses(prev => prev.filter(e => !e.optimistic));
        setEditExpense(null);
        await fetchAll();
        return;
      }
      setEditExpense(null);
      await fetchAll();
      if (!isEdit) showToast('Expense added!', 'success');
      // Remove optimistic expense (will be replaced by real one from server)
      if (!isEdit) setExpenses(prev => prev.filter(e => !e.optimistic));
    } catch (err) {
      console.error('addExpense error', err);
      setError('Failed to save expense.');
      showToast('Failed to save expense.', 'error');
      // Revert optimistic update
      if (!isEdit) setExpenses(prev => prev.filter(e => !e.optimistic));
      throw err;
    }
  };

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
      const headers = { 'Content-Type': 'application/json' };
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
      const res = await authFetch(`/expenses/${editExpense._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update expense');
      setEditExpense(null);
      showToast('Expense updated!', 'success');
      await fetchAll();
    } catch (err) {
      console.error('handleEditSubmit error', err);
      showToast('Failed to update expense.', 'error');
    }
  };

  const handleEdit = (expense) => {
    setEditExpense(expense);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const res = await authFetch(`/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        if (res.status === 404) {
          showToast('Expense not found. It may have been deleted.', 'error');
          setError('Expense not found. It may have been deleted.');
        } else {
          showToast('Failed to delete expense.', 'error');
          setError('Failed to delete expense.');
        }
        await fetchAll();
        return;
      }
      await fetchAll();
      showToast('Expense deleted!', 'success');
    } catch (err) {
      console.error('handleDelete error', err);
      setError('Failed to delete expense.');
      showToast('Failed to delete expense.', 'error');
    }
  };

  // Recurring expenses feature disabled (pending reintroduction)

  // Fetch group members for edit form
  useEffect(() => {
    const fetchUsers = async () => {
  // usersLoading state removed
      try {
        const res = await authFetch(`/people?group=${selectedGroup}`);
        const data = await res.json();
        setUsers(Array.isArray(data.data) ? data.data : []);
      } catch {
        setUsers([]);
      }
  // usersLoading state removed
    };
    if (selectedGroup && token && editExpense) fetchUsers();
  }, [selectedGroup, token, editExpense]);

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

  const SkeletonCard = () => (
    <div className="w-full bg-zinc-900/80 rounded-2xl shadow-2xl border-2 border-blue-900 p-6 md:p-10 flex flex-col gap-6 animate-pulse min-h-[400px]">
      <div className="h-10 bg-zinc-800 rounded mb-4"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <ErrorMessage message={error} onRetry={fetchAll} />
      </div>
    );
  }

  // Show group selection UI when showGroups is true
  return (
    <ErrorBoundary>
      {globalError && <Toast message={globalError} type="error" onClose={() => setGlobalError('')} />}
      {loading && <Spinner />}
      <div className="min-h-screen w-full overflow-x-hidden flex flex-row bg-gradient-to-br from-black via-zinc-900 to-blue-950">
        {/* Hamburger button for mobile only */}
        <button
          className="fixed top-4 left-4 z-40 bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-lg shadow-lg focus:outline-none md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          style={{ display: 'block' }}
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect y="5" width="24" height="2" rx="1" fill="currentColor"/><rect y="11" width="24" height="2" rx="1" fill="currentColor"/><rect y="17" width="24" height="2" rx="1" fill="currentColor"/></svg>
        </button>
        {/* Sidebar overlay for mobile only */}
        {sidebarOpen && (
          <div className="fixed top-5 inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}
        {/* Sidebar always visible on desktop, overlay on mobile */}
        <Sidebar showGroups={showGroups} setShowGroups={setShowGroups} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 w-full md:ml-4">
          <div className="w-full max-w-6xl bg-zinc-900/90 rounded-2xl shadow-2xl border border-blue-800 p-8 flex flex-col gap-8">
            <header className="mb-8 text-center relative">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow">Split App</h1>
                <Link to="/analytics" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow transition-all duration-200">Analytics</Link>
              </div>
              <p className="text-xl text-gray-300">Track group expenses, balances, and settlements easily.</p>
            </header>
            {/* Sticky group context header */}
            {selectedGroup && (
              <div className="sticky top-0 z-20 bg-blue-950/90 border-b border-blue-800 rounded-2xl px-6 py-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl animate-fadein">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white text-3xl font-extrabold shadow">{(groups.find(g => g._id === selectedGroup)?.name || '?').charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="text-2xl font-bold text-white drop-shadow">{groups.find(g => g._id === selectedGroup)?.name || 'Group'}</div>
                    <div className="text-blue-200 text-sm font-semibold">
                      {Array.isArray(groupPeople) && groupPeople.length > 0
                        ? groupPeople.join(', ')
                        : (Array.isArray(groups) && groups.find(g => g._id === selectedGroup) && Array.isArray(groups.find(g => g._id === selectedGroup).members)
                          ? groups.find(g => g._id === selectedGroup).members.filter(m => typeof m === 'string' && !/^[0-9a-fA-F]{24}$/.test(m)).join(', ') || 'No members'
                          : 'No members')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  {groups.map(group => (
                    <button
                      key={group._id}
                      className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 border-2 shadow text-lg ${selectedGroup === group._id ? 'bg-blue-700 text-white border-blue-400' : 'bg-zinc-800 text-blue-300 border-blue-700 hover:bg-blue-900'}`}
                      onClick={() => {
                        setSelectedGroup(group._id);
                        localStorage.setItem('selectedGroup', group._id);
                      }}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showGroups ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-blue-400">Your Groups</h3>
                  <button
                    className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-bold shadow transition-all duration-200"
                    onClick={() => setShowGroupManager(v => !v)}
                  >
                    {showGroupManager ? 'Close' : 'Create Group'}
                  </button>
                </div>
                {showGroupManager && (
                  <div className="mb-6">
                    <GroupManager token={token} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />
                  </div>
                )}
                <div className="flex flex-wrap gap-4 mb-6">
                  {groups.length === 0 ? (
                    <div className="text-gray-400">No groups found.</div>
                  ) : (
                    groups.map(group => (
                      <button
                        key={group._id}
                        className={`flex flex-col items-center px-4 py-2 rounded-lg shadow font-bold transition-all duration-200 w-32 h-32 justify-center gap-2 ${selectedGroup === group._id ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-blue-300 hover:bg-blue-900'}`}
                        onClick={() => {
                          setSelectedGroup(group._id);
                          localStorage.setItem('selectedGroup', group._id);
                        }}
                      >
                        <span className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white text-2xl font-extrabold mb-1">
                          {group.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                        <span className="truncate w-full text-center">{group.name}</span>
                        <span className="text-xs text-blue-200">{Array.isArray(group.members) ? group.members.length : 0} members</span>
                      </button>
                    ))
                  )}
                </div>
                {selectedGroup ? (
                  <Groups
                    group={Array.isArray(groups) ? groups.find(g => g._id === selectedGroup) : null}
                    people={groupPeople}
                    onAddPerson={handleAddPersonToGroup}
                    messages={groupMessages}
                    onSendMessage={handleSendGroupMessage}
                    onAddExpense={addExpense}
                  />
                ) : (
                  <div className="text-center text-2xl text-white font-bold">Select a group</div>
                )}
              </div>
            ) : (
              <>
                <GroupManager token={token} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />
                <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                  <ExpenseForm
                    onAdd={addExpense}
                    group={selectedGroup}
                    groups={groups}
                    editExpense={editExpense}
                    setEditExpense={setEditExpense}
                    recentExpenses={Array.isArray(expenses) ? expenses.slice(0, 5) : []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
                {/* Only show balances and settlements if a group is selected and groupId is valid */}
                {selectedGroup && typeof selectedGroup === 'string' && selectedGroup.length > 0 ? (
                  <>
                    <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                      <Balances balances={balances} loading={loading} groupId={selectedGroup} />
                    </div>
                    <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                      <Settlements settlements={settlements} loading={loading} groupId={selectedGroup} />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-2xl text-white font-bold flex flex-col items-center gap-4 py-12">
                    <span className="text-5xl">👥</span>
                    <span>
                      {groups.length === 0
                        ? 'No groups found. Create a group to get started!'
                        : 'Select a group to view balances and settlements.'}
                    </span>
                    <span className="text-lg text-blue-200 font-normal">No expenses or balances yet? Add a group and start tracking your shared costs!</span>
                  </div>
                )}
              </>
            )}
            <footer className="mt-8 text-center text-xs text-pink-400">
              <p>Made with <span className="text-blue-200 font-bold">Vite</span> + <span className="text-purple-200 font-bold">React</span> + <span className="text-pink-200 font-bold">Tailwind CSS</span></p>
            </footer>
            <Toast message={toast.message} type={toast.type} onClose={closeToast} />
          </div>
        </main>
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
              <label className="text-blue-200 font-semibold">Split Details (JSON: {'{'} username: amountOrPercent {'}'})
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
    </ErrorBoundary>
  );
}

export default Dashboard; 