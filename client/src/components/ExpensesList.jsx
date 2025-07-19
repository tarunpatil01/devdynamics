import React from 'react';

const ExpensesList = ({ expenses, onEdit, onDelete }) => {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-lg shadow-2xl p-2 md:p-3 mb-3 md:mb-4 border-2 border-blue-900 text-white animate-fadein w-full overflow-hidden">
      <h2 className="text-lg md:text-xl font-extrabold text-white mb-2 md:mb-3 drop-shadow">Expenses</h2>
      {safeExpenses.length === 0 ? (
        <div className="text-gray-500 text-center py-3 md:py-4">
          <span className="block text-lg mb-1">🧾</span>
          No expenses found.
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-blue-900">
                <th className="text-left py-1 px-1">Description</th>
                <th className="text-right py-1 px-1">Amount</th>
                <th className="text-left py-1 px-1">Category</th>
                <th className="text-left py-1 px-1">Paid By</th>
                <th className="text-left py-1 px-1">Split</th>
                <th className="text-center py-1 px-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeExpenses.map((expense, index) => (
                <tr key={expense._id || index} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
                  <td className="py-1 px-1">
                    <div className="max-w-20 md:max-w-24 lg:max-w-32 truncate" title={expense.description}>
                      {expense.description}
                    </div>
                  </td>
                  <td className="text-right py-1 px-1 font-bold text-green-400">
                    ₹{Number(expense.amount).toLocaleString()}
                  </td>
                  <td className="py-1 px-1">
                    <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
                      expense.category === 'Food' ? 'bg-green-900 text-green-200' :
                      expense.category === 'Travel' ? 'bg-blue-900 text-blue-200' :
                      expense.category === 'Utilities' ? 'bg-yellow-900 text-yellow-200' :
                      expense.category === 'Entertainment' ? 'bg-purple-900 text-purple-200' :
                      'bg-gray-900 text-gray-200'
                    }`}>
                      {expense.category || 'Other'}
                    </span>
                  </td>
                  <td className="py-1 px-1">
                    <div className="max-w-12 md:max-w-16 truncate" title={expense.paid_by}>
                      {expense.paid_by}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <span className="text-xs text-gray-400 capitalize">
                      {expense.split_type}
                    </span>
                  </td>
                  <td className="py-1 px-1">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => onEdit(expense)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-1 py-0.5 rounded text-xs font-bold transition-all duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(expense._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-1 py-0.5 rounded text-xs font-bold transition-all duration-200"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpensesList;
