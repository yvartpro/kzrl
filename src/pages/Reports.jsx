import { useEffect, useState } from 'react';
import { Calendar, FileText, TrendingUp, Package, DollarSign, Download } from 'lucide-react';
import { getDailyReport, getStockValuation, getCashMovements, getSales, getExpenses } from '../api/services';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState(null);
  const [stockValue, setStockValue] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toast = useToast();

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dailyRes, stockRes] = await Promise.all([
        getDailyReport(selectedDate),
        getStockValuation(),
      ]);

      setDailyReport(dailyRes.data);
      setStockValue(stockRes.data);

      // Fetch journal entries (sales, expenses, cash movements)
      await fetchJournalEntries();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      const [salesRes, expensesRes, movementsRes] = await Promise.all([
        getSales(),
        getExpenses({ startDate: selectedDate, endDate: selectedDate }),
        getCashMovements({ startDate: selectedDate, endDate: selectedDate }),
      ]);

      // Combine and format all transactions as journal entries
      const entries = [];
      let runningBalance = 0;

      // Add sales (Debit: Cash, Credit: Sales Revenue)
      salesRes.data.forEach(sale => {
        if (sale.createdAt.startsWith(selectedDate)) {
          const amount = parseFloat(sale.totalAmount);
          runningBalance += amount;
          entries.push({
            date: sale.createdAt,
            description: `Sale - ${sale.paymentMethod} `,
            reference: `INV - ${sale.id} `,
            debit: amount,
            credit: 0,
            balance: runningBalance,
            type: 'SALE',
          });
        }
      });

      // Add expenses (Debit: Expense, Credit: Cash)
      expensesRes.data.forEach(expense => {
        const amount = parseFloat(expense.amount);
        runningBalance -= amount;
        entries.push({
          date: expense.createdAt,
          description: expense.description,
          reference: `EXP - ${expense.id} `,
          debit: 0,
          credit: amount,
          balance: runningBalance,
          type: 'EXPENSE',
        });
      });

      // Sort by date
      entries.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Recalculate running balance after sorting
      let balance = 0;
      entries.forEach(entry => {
        balance += entry.debit - entry.credit;
        entry.balance = balance;
      });

      setJournalEntries(entries);
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner />;

  const totalDebit = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Accounting journal and daily summaries</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Print
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 no-print">
        <StatCard
          title="Total Sales"
          value={formatCurrency(dailyReport?.totalSales || 0)}
          icon={DollarSign}
          className="card-glass hover-lift"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(dailyReport?.totalProfit || 0)}
          icon={TrendingUp}
          className="card-glass hover-lift"
        />
        <StatCard
          title="Transactions"
          value={dailyReport?.salesCount || 0}
          icon={FileText}
          className="card-glass hover-lift"
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(stockValue?.totalValue || 0)}
          icon={Package}
          className="card-glass hover-lift"
        />
      </div>

      {/* Accounting Journal */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">General Journal</h2>
              <p className="text-sm text-gray-600 mt-1">Date: {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Debit (FBu)
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Credit (FBu)
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Balance (FBu)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {journalEntries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p>No transactions recorded for this date</p>
                  </td>
                </tr>
              ) : (
                <>
                  {journalEntries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(entry.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {entry.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {entry.debit > 0 ? (
                          <span className="text-green-600">{formatCurrency(entry.debit)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {entry.credit > 0 ? (
                          <span className="text-red-600">{formatCurrency(entry.credit)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="3" className="px-6 py-4 text-sm text-gray-900 uppercase">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(totalDebit - totalCredit)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Valuation */}
      {stockValue && stockValue.items && stockValue.items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Stock Valuation</h2>
            <p className="text-sm text-gray-600 mt-1">Current inventory value</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Unit Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockValue.items.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(item.unitCost)}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(item.totalValue)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan="3" className="px-6 py-4 text-sm text-gray-900 uppercase">Total Stock Value</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(stockValue.totalValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
