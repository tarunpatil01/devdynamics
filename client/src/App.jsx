import React, { useState, useEffect } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpensesList from './components/ExpensesList';
import Balances from './components/Balances';
import Settlements from './components/Settlements';
import Toast from './components/Toast';
import useToast from './hooks/useToast';
import GroupManager from './components/GroupManager';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import Groups from './components/Groups';
import { socket } from './socket';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // Hamburger sidebar state
  // Hamburger sidebar state (always available)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Logout handler
  const handleLogout = () => {
    setToken('');
    setUser(null);
    sessionStorage.removeItem('token');
    window.location.replace('/login');
  };
  // State declarations (move token above useEffect)
  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [expenses, setExpenses] = useState([]);
  const [editExpense, setEditExpense] = useState(null);
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast, showToast, closeToast } = useToast();
  const [user, setUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [groupPeople, setGroupPeople] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  // Add a global error state for unhandled errors
  const [globalError, setGlobalError] = useState('');

  // Socket.io setup
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

  const handleLogin = (jwt, userInfo) => {
    setToken(jwt);
    setUser(userInfo);
    sessionStorage.setItem('token', jwt);
    setShowRegister(false);
  };
  const handleShowRegister = () => setShowRegister(true);
  const handleShowLogin = () => setShowRegister(false);

  // Fetch all data for selected group
  const fetchAll = async () => {
    if (!token) return; // Prevent fetch if not logged in
    setLoading(true);
    setError('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const groupParam = selectedGroup ? `?group=${selectedGroup}` : '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [expRes, balRes, setRes, pplRes, grpRes] = await Promise.all([
        fetch(`${baseURL}/expenses${groupParam}`, { headers }),
        fetch(`${baseURL}/balances${groupParam}`, { headers }),
        fetch(`${baseURL}/settlements${groupParam}`, { headers }),
        fetch(`${baseURL}/people${groupParam}`, { headers }),
        fetch(`${baseURL}/groups`, { headers }),
      ]);
      if (!expRes.ok || !balRes.ok || !setRes.ok || !pplRes.ok || !grpRes.ok) throw new Error('Failed to fetch data');
      const expData = await expRes.json();
      const balData = await balRes.json();
      const setData = await setRes.json();
      const pplData = await pplRes.json();
      const grpData = await grpRes.json();
      setExpenses(expData.data || []);
      setBalances(balData.data || {});
      setSettlements(setData.data || []);
      setPeople(pplData.data || []);
      setGroups(grpData.data || []);
      // Fetch group people and messages if group selected
      if (selectedGroup) {
        setGroupPeople(pplData.data || []);
        const msgRes = await fetch(`${baseURL}/groups/${selectedGroup}/messages`, { headers });
        const msgData = msgRes.ok ? await msgRes.json() : { data: [] };
        setGroupMessages(msgData.data || []);
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
      const baseURL = import.meta.env.VITE_API_URL || 'https://devynamics-yw9g.onrender.com';
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
      // Send to backend for persistence
      const baseURL = import.meta.env.VITE_API_URL || 'https://devynamics-yw9g.onrender.com';
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      const res = await fetch(`${baseURL}/groups/${selectedGroup}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: message })
      });
      if (!res.ok) throw new Error('Failed to send message');
      const { data: msg } = await res.json();
      // Emit real-time message
      socket.emit('groupMessage', {
        groupId: selectedGroup,
        sender: user,
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

  const addExpense = async (expense) => {
    setError('');
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
      const method = editExpense ? 'PUT' : 'POST';
      const url = editExpense ? `${baseURL}/expenses/${editExpense._id}` : `${baseURL}/expenses`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...expense, group: selectedGroup })
      });
      if (!res.ok) throw new Error('Failed to save expense');
      setEditExpense(null);
      await fetchAll();
      showToast(editExpense ? 'Expense updated!' : 'Expense added!', 'success');
    } catch (err) {
      setError('Failed to save expense.');
      showToast('Failed to save expense.', 'error');
      throw err;
    }
  };

  const handleEdit = (expense) => {
    setEditExpense(expense);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const res = await fetch(`/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to delete expense');
      await fetchAll();
      showToast('Expense deleted!', 'success');
    } catch (err) {
      setError('Failed to delete expense.');
      showToast('Failed to delete expense.', 'error');
    }
  };

  // Skeleton loader for main content
  const SkeletonCard = () => (
    <div className="w-full bg-zinc-900/80 rounded-2xl shadow-2xl border-2 border-blue-900 p-6 md:p-10 flex flex-col gap-6 animate-pulse min-h-[400px]">
      <div className="h-10 bg-zinc-800 rounded mb-4"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
      <div className="h-6 bg-zinc-800 rounded mb-2"></div>
    </div>
  );

  // Error boundary/fallback UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="bg-white p-8 rounded shadow-xl border-2 border-red-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => { setError(''); fetchAll(); }}>Retry</button>
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      </div>
    );
  }

  if (!token) {
    return showRegister ? (
      <Register onRegister={handleShowLogin} onSwitchToLogin={handleShowLogin} />
    ) : (
      <Login onLogin={handleLogin} onSwitchToRegister={handleShowRegister} />
    );
  }

  return (
    <ErrorBoundary>
      {globalError && <Toast message={globalError} type="error" onClose={() => setGlobalError('')} />}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <SkeletonCard />
        </div>
      )}
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
          <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}
        {/* Sidebar always visible on desktop, overlay on mobile */}
        <aside className="hidden md:block">
          <Sidebar showGroups={showGroups} setShowGroups={setShowGroups} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </aside>
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 w-full">
          <div className="w-full max-w-6xl bg-zinc-900/90 rounded-2xl shadow-2xl border border-blue-800 p-8 flex flex-col gap-8">
            <header className="mb-8 text-center relative">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow">Split App</h1>
                <button
                  className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-xl shadow ml-0 md:ml-4 transition-all duration-200 text-lg md:static absolute top-4 right-4 md:top-auto md:right-auto text-sm px-3 py-1"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
              <p className="text-xl text-gray-300">Track group expenses, balances, and settlements easily.</p>
            </header>
            <main className="flex flex-col gap-6" aria-live="polite">
              {showGroups ? (
                <Groups
                  group={Array.isArray(groups) ? groups.find(g => g._id === selectedGroup) : null}
                  people={groupPeople}
                  onAddPerson={handleAddPersonToGroup}
                  messages={groupMessages}
                  onSendMessage={handleSendGroupMessage}
                />
              ) : (
                <>
                  <GroupManager token={token} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />
                  <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                    <ExpenseForm
                      onAdd={addExpense}
                      people={people}
                      group={selectedGroup}
                      editExpense={editExpense}
                      setEditExpense={setEditExpense}
                    />
                  </div>
                  <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                    {expenses.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        <span className="block text-2xl mb-2">🧾</span>
                        No expenses found.
                      </div>
                    ) : (
                      <ExpensesList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
                    )}
                  </div>
                  <div className="bg-zinc-900/80 rounded-2xl p-4 mb-4">
                    {Object.keys(balances).length === 0 ? (
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
            </main>
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

export default App;
