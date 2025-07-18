import React, { useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import Balances from './components/Balances';
import Settlements from './components/Settlements';

function App() {
  const [expenses, setExpenses] = useState([]);

  const addExpense = async (expense) => {
    const res = await fetch('/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    if (res.ok) {
      const data = await res.json();
      setExpenses([...expenses, data.data]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Split App</h1>
          <p className="text-gray-500">Track group expenses, balances, and settlements easily.</p>
        </header>
        <main>
          <ExpenseForm onAdd={addExpense} />
          <Balances />
          <Settlements />
        </main>
        <footer className="mt-8 text-center text-xs text-gray-400">
          <p>Made with Vite + React + Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
