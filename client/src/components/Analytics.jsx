import React, { useEffect, useState } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const COLORS = [
  '#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#f87171', '#818cf8', '#2dd4bf'
];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseURL}/expenses/analytics`, { headers });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || 'Failed to fetch analytics');
        setData(result.data);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-4 md:p-8 flex items-center justify-center">
      <div className="text-blue-300 text-lg">Loading analytics...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-4 md:p-8 flex items-center justify-center">
      <div className="bg-red-900/50 rounded-2xl p-6 border border-red-800">
        <div className="text-red-400 text-lg mb-2">Analytics Error</div>
        <div className="text-red-300">{error}</div>
      </div>
    </div>
  );
  
  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-4 md:p-8 flex items-center justify-center">
      <div className="text-gray-400">No analytics data available</div>
    </div>
  );

  // Chart.js data
  const categoryLabels = data.categoryBreakdown?.map(item => item.category) || Object.keys(data.categoryTotals || {});
  const categoryValues = data.categoryBreakdown?.map(item => item.total) || Object.values(data.categoryTotals || {});
  const monthLabels = Object.keys(data.monthly || {});
  const monthValues = Object.values(data.monthly || {});

  const pieData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: COLORS.slice(0, categoryLabels.length),
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthValues,
        backgroundColor: '#60a5fa',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
    ],
  };

  const spendingPatternsData = {
    labels: ['Individual', 'Group'],
    datasets: [
      {
        data: [data.spendingPatterns?.individual?.total || 0, data.spendingPatterns?.group?.total || 0],
        backgroundColor: ['#34d399', '#f472b6'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-2 sm:p-4 md:p-6 responsive-container">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 md:mb-6 text-center">Analytics & Reports</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 md:mb-6">
          <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800">
            <h3 className="text-blue-400 font-semibold mb-1 text-xs sm:text-sm">Total Expenses</h3>
            <p className="text-lg sm:text-2xl font-bold text-white">{data.summary?.totalExpenses || 0}</p>
          </div>
          <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800">
            <h3 className="text-green-400 font-semibold mb-1 text-xs sm:text-sm">Total Amount</h3>
            <p className="text-lg sm:text-2xl font-bold text-white">₹{data.summary?.totalAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800">
            <h3 className="text-purple-400 font-semibold mb-1 text-xs sm:text-sm">Average Amount</h3>
            <p className="text-lg sm:text-2xl font-bold text-white">₹{data.summary?.averageAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800">
            <h3 className="text-pink-400 font-semibold mb-1 text-xs sm:text-sm">Top Category</h3>
            <p className="text-lg sm:text-2xl font-bold text-white">{data.categoryBreakdown?.[0]?.category || 'N/A'}</p>
          </div>
        </div>

        {/* Spending Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800">
            <h3 className="text-purple-400 font-bold mb-3 text-base sm:text-lg">Individual vs Group Spending</h3>
            <div className="h-48">
              <Doughnut data={spendingPatternsData} options={{ maintainAspectRatio: false }} />
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-green-400">Individual: ₹{data.spendingPatterns?.individual?.total?.toLocaleString() || 0}</span>
                <span className="text-white">{data.spendingPatterns?.individual?.percentage || 0}%</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-pink-400">Group: ₹{data.spendingPatterns?.group?.total?.toLocaleString() || 0}</span>
                <span className="text-white">{data.spendingPatterns?.group?.percentage || 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800">
            <h3 className="text-green-400 font-bold mb-3 text-base sm:text-lg">Category-wise Totals</h3>
            <div className="h-48">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Monthly Spending */}
        <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800 mb-4 md:mb-6">
          <h3 className="text-purple-400 font-bold mb-3 text-base sm:text-lg">Monthly Spending Summaries</h3>
          <div className="h-48">
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800 mb-4 md:mb-6">
          <h3 className="text-yellow-400 font-bold mb-3 text-base sm:text-lg">Category Breakdown</h3>
          <div className="responsive-table">
            <table className="w-full text-white text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-blue-800">
                  <th className="text-left py-2 px-1 sm:px-2">Category</th>
                  <th className="text-right py-2 px-1 sm:px-2">Amount</th>
                  <th className="text-right py-2 px-1 sm:px-2 mobile-hidden">Count</th>
                  <th className="text-right py-2 px-1 sm:px-2 mobile-hidden">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.categoryBreakdown?.map((item, index) => (
                  <tr key={index} className="border-b border-zinc-800">
                    <td className="py-2 px-1 sm:px-2">{item.category}</td>
                    <td className="text-right py-2 px-1 sm:px-2">₹{item.total.toLocaleString()}</td>
                    <td className="text-right py-2 px-1 sm:px-2 mobile-hidden">{item.count}</td>
                    <td className="text-right py-2 px-1 sm:px-2 mobile-hidden">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Group Analytics */}
        {data.groupAnalytics && data.groupAnalytics.length > 0 && (
          <div className="bg-zinc-900/80 rounded-xl p-3 sm:p-4 border border-blue-800 mb-4 md:mb-6">
            <h3 className="text-blue-400 font-bold mb-3 text-base sm:text-lg">Group-wise Analytics</h3>
            <div className="space-y-3">
              {data.groupAnalytics.map((group, index) => (
                <div key={index} className="bg-zinc-800/50 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="text-white font-semibold text-sm sm:text-base">{group.name}</h4>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm">
                      <span className="text-green-400">Total: ₹{group.total?.toLocaleString() || 0}</span>
                      <span className="text-blue-400 mobile-hidden">Count: {group.count || 0}</span>
                      <span className="text-purple-400 mobile-hidden">{group.percentage || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Transactions */}
        <div className="bg-zinc-900/80 rounded-xl p-4 border border-blue-800 mb-6">
          <h3 className="text-yellow-400 font-bold mb-3 text-lg">Top 5 Transactions</h3>
          <div className="space-y-2">
            {data.topTransactions?.map((transaction, index) => (
              <div key={index} className="flex justify-between items-center bg-zinc-800/50 rounded-lg p-3">
                <div>
                  <div className="text-white font-semibold text-sm">{transaction.description}</div>
                  <div className="text-xs text-gray-400">
                    {transaction.category} • {transaction.paid_by} • {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-green-400 font-bold text-sm">₹{transaction.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 