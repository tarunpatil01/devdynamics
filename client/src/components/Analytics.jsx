import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
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

  if (loading) return <div className="text-blue-300">Loading analytics...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!data) return null;

  // Chart.js data
  const categoryLabels = Object.keys(data.categoryTotals);
  const categoryValues = Object.values(data.categoryTotals);
  const monthLabels = Object.keys(data.monthly);
  const monthValues = Object.values(data.monthly);

  const pieData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: COLORS,
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Monthly Total',
        data: monthValues,
        backgroundColor: '#60a5fa',
      },
    ],
  };

  return (
    <div className="bg-zinc-900/80 rounded-2xl shadow-2xl border-2 border-blue-900 p-6 mb-8 text-white animate-fadein max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-blue-400 mb-6">Analytics & Reports</h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-green-300 mb-2">Category-wise Totals</h3>
        <div className="w-full max-w-md mx-auto mb-4">
          <Pie data={pieData} options={{ plugins: { legend: { labels: { color: 'white' } } } }} />
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-purple-300 mb-2">Monthly Summaries</h3>
        <div className="w-full max-w-xl mx-auto mb-4">
          <Bar data={barData} options={{
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } }
          }} />
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-pink-300 mb-2">Most Expensive Categories</h3>
        <ul className="list-disc pl-6">
          {data.mostExpensiveCategories.map(([cat, total]) => (
            <li key={cat}>{cat}: ₹{total.toLocaleString('en-IN')}</li>
          ))}
        </ul>
      </div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-yellow-300 mb-2">Top 5 Transactions</h3>
        <ul className="list-decimal pl-6">
          {data.topTransactions.map((exp, idx) => (
            <li key={exp._id && exp._id.toString ? exp._id.toString() : idx}>
              {typeof exp.description === 'string' ? exp.description : ''} - ₹{typeof exp.amount === 'number' || typeof exp.amount === 'string' ? Number(exp.amount).toLocaleString('en-IN') : ''} ({typeof exp.category === 'string' ? exp.category : ''}, {exp.created_at ? new Date(exp.created_at).toLocaleDateString() : ''})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Analytics; 