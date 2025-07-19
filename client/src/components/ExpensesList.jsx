import React from 'react';

const ExpensesList = ({ expenses, onEdit, onDelete }) => {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  return (
    <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-3 sm:p-4 md:p-6 mb-4 md:mb-6 border-2 border-blue-900 text-white animate-fadein w-full responsive-container">
      <h2 className="text-xl md:text-2xl font-extrabold text-white mb-4 drop-shadow">Expenses</h2>
      {safeExpenses.length === 0 ? (
        <div className="text-gray-500 text-center py-6 md:py-8">
          <span className="block text-xl md:text-2xl mb-2">🧾</span>
          No expenses found.
        </div>
      ) : (
        <div className="responsive-table">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-blue-900">
                <th className="text-left py-2 px-1 sm:px-2">Description</th>
                <th className="text-right py-2 px-1 sm:px-2">Amount</th>
                <th className="text-left py-2 px-1 sm:px-2 mobile-hidden">Category</th>
                <th className="text-left py-2 px-1 sm:px-2 mobile-hidden">Paid By</th>
                <th className="text-left py-2 px-1 sm:px-2 mobile-hidden">Split Type</th>
                <th className="text-center py-2 px-1 sm:px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeExpenses.map((expense, index) => (
                <tr key={expense._id || index} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-all duration-200">
                  <td className="py-2 px-1 sm:px-2">
                    <div className="max-w-20 sm:max-w-32 md:max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </div>
                    {/* Mobile-only info */}
                    <div className="sm:hidden text-xs text-gray-400 mt-1">
                      <div>{expense.category || 'Other'}</div>
                      <div>{expense.paid_by}</div>
                    </div>
                  </td>
                  <td className="text-right py-2 px-1 sm:px-2 font-bold text-green-400">
                    <div className="text-xs sm:text-sm">₹{Number(expense.amount).toLocaleString()}</div>
                  </td>
                  <td className="text-left py-2 px-1 sm:px-2 mobile-hidden">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      expense.category === 'Food' ? 'bg-green-900 text-green-200' :
                      expense.category === 'Travel' ? 'bg-blue-900 text-blue-200' :
                      expense.category === 'Utilities' ? 'bg-yellow-900 text-yellow-200' :
                      expense.category === 'Entertainment' ? 'bg-purple-900 text-purple-200' :
                      'bg-gray-900 text-gray-200'
                    }`}>
                      {expense.category || 'Other'}
                    </span>
                  </td>
                  <td className="text-left py-2 px-1 sm:px-2 mobile-hidden">
                    <div className="max-w-16 sm:max-w-24 truncate" title={expense.paid_by}>
                      {expense.paid_by}
                    </div>
                  </td>
                  <td className="text-left py-2 px-1 sm:px-2 mobile-hidden">
                    <span className="text-xs text-gray-400 capitalize">
                      {expense.split_type}
                    </span>
                  </td>
                  <td className="text-center py-2 px-1 sm:px-2">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                      <button
                        onClick={() => onEdit(expense)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold transition-all duration-200 touch-target"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(expense._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-bold transition-all duration-200 touch-target"
                      >
                        Delete
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
