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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-blue-950">
      <div className="text-blue-300 text-xl">Loading analytics...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-blue-950">
      <div className="text-red-400 text-xl">{error}</div>
    </div>
  );
  
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-blue-950">
      <div className="text-gray-400 text-xl">No data available</div>
    </div>
  );

  // Chart.js data with proper formatting
  const categoryLabels = Object.keys(data.categoryTotals || {});
  const categoryValues = Object.values(data.categoryTotals || {});
  const monthLabels = Object.keys(data.monthly || {});
  const monthValues = Object.values(data.monthly || {});

  // Only show charts if we have data
  const hasCategoryData = categoryLabels.length > 0 && categoryValues.some(v => v > 0);
  const hasMonthlyData = monthLabels.length > 0 && monthValues.some(v => v > 0);

  const pieData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: COLORS.slice(0, categoryLabels.length),
        borderWidth: 2,
        borderColor: '#1f2937',
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
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ₹${context.parsed.toLocaleString('en-IN')} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Total: ₹${context.parsed.y.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: 'white',
          font: {
            size: 12
          },
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-blue-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-blue-900 p-8 text-white">
          <h2 className="text-4xl font-bold text-blue-400 mb-8 text-center">Analytics & Reports</h2>
          
          {hasCategoryData && (
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-green-300 mb-4">Category-wise Totals</h3>
              <div className="w-full max-w-md mx-auto" style={{ height: '300px' }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          )}
          
          {hasMonthlyData && (
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-purple-300 mb-4">Monthly Summaries</h3>
              <div className="w-full max-w-2xl mx-auto" style={{ height: '300px' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          )}
          
          {data.mostExpensiveCategories && data.mostExpensiveCategories.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-pink-300 mb-4">Most Expensive Categories</h3>
              <ul className="list-disc pl-6 space-y-2">
                {data.mostExpensiveCategories.map(([cat, total], index) => (
                  <li key={cat} className="text-lg">
                    <span className="font-semibold">{cat}:</span> ₹{total.toLocaleString('en-IN')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {data.topTransactions && data.topTransactions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-yellow-300 mb-4">Top 5 Transactions</h3>
              <ul className="list-decimal pl-6 space-y-2">
                {data.topTransactions.map((exp, idx) => (
                  <li key={exp._id || idx} className="text-lg">
                    <span className="font-semibold">{exp.description || 'Unknown'}</span> - 
                    ₹{Number(exp.amount || 0).toLocaleString('en-IN')} 
                    <span className="text-gray-400 ml-2">
                      ({exp.category || 'Other'}, {exp.created_at ? new Date(exp.created_at).toLocaleDateString('en-IN') : 'Unknown date'})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {!hasCategoryData && !hasMonthlyData && (!data.mostExpensiveCategories || data.mostExpensiveCategories.length === 0) && (!data.topTransactions || data.topTransactions.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-2">No Analytics Data</h3>
              <p className="text-gray-500">Start adding expenses to see your analytics and reports!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 