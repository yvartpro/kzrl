import { useEffect, useState, useCallback } from 'react';
import { Wallet, Plus, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { getCashBalance, getCashMovements, createExpense, getExpenses } from '../api/services';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { CardSkeleton, TableSkeleton } from '../components/Skeletons';

import { useStore } from '../contexts/StoreContext';

export default function CashExpenses() {
  const { currentStore } = useStore();
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
      if (!currentStore) return;
      setLoading(true);
      setError(null);
      const [balanceRes, expensesRes, movementsRes] = await Promise.all([
        getCashBalance(currentStore.id),
        getExpenses({ ...dateRange, storeId: currentStore.id }),
        getCashMovements({ ...dateRange, storeId: currentStore.id }),
      ]);
      setCashBalance(balanceRes.data.balance);
      setExpenses(expensesRes.data);
      setMovements(movementsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du chargement des données de caisse');
    } finally {
      setLoading(false);
    }
  }, [dateRange, currentStore]);

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
        storeId: currentStore?.id
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


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
            <span className="p-2 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100">
              <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            Caisse & Dépenses
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">Gérer les flux de trésorerie et les dépenses</p>
        </div>
        <button
          onClick={() => setShowExpenseForm(!showExpenseForm)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-xl text-sm w-full sm:w-auto ${showExpenseForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'}`}
        >
          {showExpenseForm ? 'Annuler' : (
            <>
              <Plus className="h-5 w-5" />
              Nouvelle Dépense
            </>
          )}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {loading ? (
          <CardSkeleton count={3} />
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        {/* Expense Form */}
        <div className="lg:col-span-2">
          {showExpenseForm ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-scale-in h-full">
              <div className="flex items-center gap-2 mb-6 text-red-600">
                <TrendingDown className="h-5 w-5" />
                <h2 className="text-lg font-bold">Nouvelle Dépense</h2>
              </div>
              <form onSubmit={handleSubmitExpense} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                      placeholder="ex: Facture électricité, Loyer..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                      Montant (FBu) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest mt-2"
                >
                  {submitting ? 'TRAITEMENT...' : (
                    <>
                      <Plus className="h-5 w-5" />
                      CONFIRMER LA DÉPENSE
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-center h-full">
              <TrendingDown className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">Cliquez sur "Enregistrer Dépense" pour ajouter un frais.</p>
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-6 text-gray-700">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-bold">Filtrer par Date</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Date Début
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Date Fin
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 italic text-center pt-2">
                Les rapports et transactions seront mis à jour automatiquement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          Dépenses
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
          {loading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
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
          )}
        </div>
      </div>

      {/* Cash Movements */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          Mouvements de Caisse
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
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
          )}
        </div>
      </div>
    </div>
  );
}
