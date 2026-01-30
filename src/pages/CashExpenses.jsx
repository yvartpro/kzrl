import { useEffect, useState, useCallback } from 'react';
import { Wallet, Plus, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { getCashBalance, getCashMovements, createExpense, getExpenses } from '../api/services';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

export default function CashExpenses() {
  const [cashBalance, setCashBalance] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
  });

  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [balanceRes, expensesRes, movementsRes] = await Promise.all([
        getCashBalance(),
        getExpenses(dateRange),
        getCashMovements(dateRange),
      ]);
      setCashBalance(balanceRes.data.balance);
      setExpenses(expensesRes.data);
      setMovements(movementsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du chargement des données de caisse');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await createExpense({
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
      });
      toast.success('Dépense enregistrée avec succès');
      setShowExpenseForm(false);
      setExpenseForm({ description: '', amount: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'enregistrement de la dépense');
      toast.error('Échec de l\'enregistrement de la dépense');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caisse & Dépenses</h1>
          <p className="text-gray-600 mt-1">Gérer les flux de trésorerie et les dépenses</p>
        </div>
        <button
          onClick={() => setShowExpenseForm(!showExpenseForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {showExpenseForm ? 'Annuler' : 'Enregistrer Dépense'}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Solde Caisse"
          value={formatCurrency(cashBalance)}
          icon={Wallet}
          className="card-glass hover-lift"
        />
        <StatCard
          title="Dépenses du Jour"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          className="card-glass hover-lift"
        />
        <StatCard
          title="Transactions"
          value={movements.length}
          icon={DollarSign}
          className="card-glass hover-lift"
        />
      </div>

      {/* Expense Form */}
      {showExpenseForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 animate-scale-in">
          <h2 className="text-lg font-semibold mb-4">Enregistrer Nouvelle Dépense</h2>
          <form onSubmit={handleSubmitExpense}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ex: Facture électricité, Loyer, Fournitures"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FBu) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer Dépense'}
            </button>
          </form>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtrer par Date</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Début
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dépenses</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    <TrendingDown className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p>Aucune dépense enregistrée</p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(expense.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Movements */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mouvements de Caisse</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p>Aucun mouvement de caisse</p>
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${movement.type === 'IN'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-600'
                        }`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {movement.reason}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {movement.type === 'IN' ? '+' : '-'}{formatCurrency(movement.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
