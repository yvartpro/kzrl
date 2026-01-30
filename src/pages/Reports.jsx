import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Package } from 'lucide-react';
import { getDailyReport, getStockValuation } from '../api/services';
import { formatCurrency, formatDate } from '../utils/format';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

export default function Reports() {
  const [dailyReport, setDailyReport] = useState(null);
  const [stockReport, setStockReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [daily, stock] = await Promise.all([
        getDailyReport(selectedDate),
        getStockValuation(),
      ]);
      setDailyReport(daily.data);
      setStockReport(stock.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View sales, profit, and stock reports</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Date Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Daily Report */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Daily Report - {formatDate(selectedDate)}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dailyReport?.totalRevenue || 0)}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Profit"
            value={formatCurrency(dailyReport?.totalProfit || 0)}
            icon={TrendingUp}
          />
          <StatCard
            title="Transactions"
            value={dailyReport?.transactionCount || 0}
            icon={BarChart3}
          />
          <StatCard
            title="Items Sold"
            value={dailyReport?.itemsSold || 0}
            icon={Package}
          />
        </div>
      </div>

      {/* Stock Valuation */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Valuation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Total Cost Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(stockReport?.totalValuation || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Current inventory cost</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Potential Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(stockReport?.totalPotentialRevenue || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">If all stock sold</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Potential Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockReport?.details?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity} units
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.unitCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.totalCostValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(item.potentialRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
