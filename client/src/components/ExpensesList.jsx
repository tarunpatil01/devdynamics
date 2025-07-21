import React from 'react';

const ExpensesList = ({ expenses, onEdit, onDelete }) => {
  // Always treat expenses as an array, never call .length or .map on null
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  // Tooltip component
  const Tooltip = ({ text, children }) => (
    <span className="relative group">
      {children}
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs px-3 py-2 rounded bg-zinc-800 text-blue-100 text-xs shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity z-50">
        {text}
      </span>
    </span>
  );
  if (!safeExpenses || safeExpenses.length === 0) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein">
        <h2 className="text-2xl font-extrabold text-white mb-4 drop-shadow flex items-center gap-2">
          Expenses
          <Tooltip text="This is a feed of the most recent expenses and settlements in your group."><span className="bg-blue-700 text-white rounded-full px-2 cursor-help" tabIndex={0}>?</span></Tooltip>
        </h2>
        <div className="text-gray-500 flex flex-col items-center gap-2">
          <span className="text-3xl">🧾</span>
          No expenses found.
        </div>
      </div>
    );
  }
  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein">
      <h2 className="text-2xl font-extrabold text-white mb-4 drop-shadow">Expenses</h2>
      {safeExpenses.length === 0 ? (
        <div className="text-gray-500">No expenses found.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {safeExpenses.map((exp, idx) => (
            <li key={exp._id && exp._id.toString ? exp._id.toString() : idx} className="flex flex-col md:flex-row justify-between items-center py-2 border-b border-blue-900 last:border-b-0 gap-2 transition-all duration-200 hover:bg-zinc-800/60 rounded-xl">
              <div className="flex flex-col md:flex-row gap-2 items-center w-full">
                <span className="font-bold text-blue-200 text-lg">{typeof exp.description === 'string' ? exp.description : ''}</span>
                <span className="ml-2 text-white">₹{typeof exp.amount === 'number' || typeof exp.amount === 'string' ? exp.amount : ''}</span>
                <span className="ml-2 text-pink-400">Paid by: {typeof exp.paid_by === 'string' ? exp.paid_by : ''}</span>
                <span className="ml-2 text-gray-400">Split: {typeof exp.split_type === 'string' ? exp.split_type : ''}</span>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button className="bg-yellow-700 hover:bg-yellow-800 text-white px-3 py-1 rounded-lg shadow transition-all duration-200" onClick={() => onEdit(exp)}>Edit</button>
                <button className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded-lg shadow transition-all duration-200" onClick={() => onDelete(exp._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExpensesList;
