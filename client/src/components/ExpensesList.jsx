import React from 'react';

const ExpensesList = ({ expenses, onEdit, onDelete }) => {
  // Always treat expenses as an array, never call .length or .map on null
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  if (!safeExpenses || safeExpenses.length === 0) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border-2 border-blue-900 text-white animate-fadein">
        <h2 className="text-2xl font-extrabold text-white mb-4 drop-shadow">Expenses</h2>
        <div className="text-gray-500">No expenses found.</div>
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
          {safeExpenses.map(exp => (
            <li key={exp._id} className="flex flex-col md:flex-row justify-between items-center py-2 border-b border-blue-900 last:border-b-0 gap-2 transition-all duration-200 hover:bg-zinc-800/60 rounded-xl">
              <div className="flex flex-col md:flex-row gap-2 items-center w-full">
                <span className="font-bold text-blue-200 text-lg">{exp.description}</span>
                <span className="ml-2 text-white">₹{exp.amount}</span>
                <span className="ml-2 text-pink-400">Paid by: {exp.paid_by}</span>
                <span className="ml-2 text-gray-400">Split: {exp.split_type}</span>
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
