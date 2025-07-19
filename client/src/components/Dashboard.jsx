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

function Dashboard() {
  // Hamburger sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Always read token from localStorage
  const token = localStorage.getItem('token') || '';
  const [expenses, setExpenses] = useState([]);
  const [editExpense, setEditExpense] = useState(null);
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast, showToast, closeToast } = useToast();
  const [user, setUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [groupPeople, setGroupPeople] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [globalError, setGlobalError] = useState('');
  const navigate = useNavigate();
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [showGroupManager, setShowGroupManager] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

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
    socket.on('groupCreated', (group) => {
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
    socket.on('groupUpdated', (group) => {
      fetchAll();
    });
    return () => {
      socket.off('groupCreated');
      socket.off('expenseCreated');
      socket.off('expenseUpdated');
      socket.off('expenseDeleted');
      socket.off('groupUpdated');
    };
  }, [selectedGroup]);

  // Fetch all data for selected group
  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const groupParam = selectedGroup ? `?group=${selectedGroup}` : '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [expRes, balRes, setRes, grpRes] = await Promise.all([
        fetch(`${baseURL}/expenses${groupParam}`, { headers }),
        fetch(`${baseURL}/balances${groupParam}`, { headers }),
        fetch(`${baseURL}/settlements${groupParam}`, { headers }),
        fetch(`${baseURL}/groups`, { headers }),
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
      if (selectedGroup) {
        const pplRes = await fetch(`${baseURL}/people${groupParam}`, { headers });
        const pplData = pplRes.ok ? await pplRes.json() : { data: [] };
        setGroupPeople(Array.isArray(pplData.data) ? pplData.data : []);
        const msgRes = await fetch(`${baseURL}/groups/${selectedGroup}/messages`, { headers });
        const msgData = msgRes.ok ? await msgRes.json() : { data: [] };
        setGroupMessages(Array.isArray(msgData.data) ? msgData.data : []);
      }
    } catch (err) {
      setError('Failed to load data.');
      showToast('Failed to load data.', 'error');
    }
    setLoading(false);
  };

  // Add person to group
  const handleAddPersonToGroup = async (personName) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      const res = await fetch(`${baseURL}/groups/${selectedGroup}/add-person`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: personName })
      });
      if (!res.ok) throw new Error('Failed to add person');
      await fetchAll();
      showToast('Person added to group!', 'success');
    } catch (err) {
      showToast('Failed to add person.', 'error');
    }
  };

  // Send message in group
  const handleSendGroupMessage = async (message) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devynamics-yw9g.onrender.com';
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      const res = await fetch(`${baseURL}/groups/${selectedGroup}/messages`, {
        method: 'POST',
        headers,
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
      showToast('Failed to send message.', 'error');
    }
  };

  useEffect(() => {
    if (token) {
      (async () => {
        await fetchAll();
      })();
    }
    // eslint-disable-next-line
  }, [selectedGroup, token]);

  const addExpense = async (expense, isEdit = false) => {
    setError('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${baseURL}/expenses/${expense._id}` : `${baseURL}/expenses`;
      // Defensive: ensure split_with is array, split_details is object, group is present, amount is number
      const payload = {
        ...expense,
        amount: Number(expense.amount),
        split_with: Array.isArray(expense.split_with) ? expense.split_with : [],
        split_details: (expense.split_details && typeof expense.split_details === 'object') ? expense.split_details : {},
        group: expense.group || selectedGroup,
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
        setEditExpense(null);
        await fetchAll();
        return;
      }
      setEditExpense(null);
      await fetchAll();
      if (!isEdit) showToast('Expense added!', 'success');
    } catch (err) {
      setError('Failed to save expense.');
      showToast('Failed to save expense.', 'error');
      throw err;
    }
  };

  const handleEdit = (expense) => {
    // Prompt user for which field to edit and the new value
    const field = window.prompt('Which field do you want to edit? (amount, description, category)', 'amount');
    if (!field || !['amount', 'description', 'category'].includes(field)) {
      return;
    }
    const newValue = window.prompt(`Enter new value for ${field}:`, String(expense[field]));
    if (newValue === null) return;
    // Prepare updated expense
    let updatedExpense = { ...expense };
    if (field === 'amount') {
      updatedExpense.amount = Number(newValue);
    } else {
      updatedExpense[field] = newValue;
    }
    // Call addExpense with edit flag
    setEditExpense(updatedExpense);
    addExpense(updatedExpense, true);
    setEditExpense(null);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const res = await fetch(`${baseURL}/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
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
      setError('Failed to delete expense.');
      showToast('Failed to delete expense.', 'error');
    }
  };

  // Fetch recurring expenses
  const fetchRecurring = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${baseURL}/expenses?recurringOnly=true`, { headers });
      const data = await res.json();
      if (data.success) setRecurringExpenses(Array.isArray(data.data) ? data.data : []);
    } catch {}
  };
  useEffect(() => { fetchRecurring(); }, []);

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
                  />
                </div>
                <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                  {Array.isArray(expenses) && (!expenses || expenses.length === 0) ? (
                    <div className="text-gray-500 text-center py-8">
                      <span className="block text-2xl mb-2">🧾</span>
                      No expenses found.
                    </div>
                  ) : (
                    <ExpensesList expenses={Array.isArray(expenses) ? expenses : []} onEdit={handleEdit} onDelete={handleDelete} />
                  )}
                </div>
                <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                  {!balances || Object.keys(balances || {}).length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      <span className="block text-2xl mb-2">💰</span>
                      No balances found.
                    </div>
                  ) : (
                    <Balances balances={balances} loading={loading} />
                  )}
                </div>
                <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                  <Settlements settlements={settlements} loading={loading} />
                </div>
              </>
            )}
            <footer className="mt-8 text-center text-xs text-pink-400">
              <p>Made with <span className="text-blue-200 font-bold">Vite</span> + <span className="text-purple-200 font-bold">React</span> + <span className="text-pink-200 font-bold">Tailwind CSS</span></p>
            </footer>
            <Toast message={toast.message} type={toast.type} onClose={closeToast} />
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard; 