import { useEffect, useState, useCallback } from 'react';
import { User, DollarSign, History, Calendar, CheckCircle2 } from 'lucide-react';
import { getUsers, payStaff, getCashBalance } from '../api/services';
import { formatCurrency } from '../utils/format';
import { useToast } from '../components/Toast';
import { useStore } from '../contexts/StoreContext';
import ErrorMessage from '../components/ErrorMessage';
import { TableSkeleton, CardSkeleton } from '../components/Skeletons';
import StatCard from '../components/StatCard';

export default function Salaries() {
  const { currentStore } = useStore();
  const [users, setUsers] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    period: '',
    description: ''
  });

  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      if (!currentStore) return;
      setLoading(true);
      setError(null);
      const [usersRes, cashRes] = await Promise.all([
        getUsers(),
        getCashBalance(currentStore.id)
      ]);
      setUsers(usersRes.data);
      setCashBalance(cashRes.data.balance);
    } catch {
      setError('Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [currentStore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (parseFloat(paymentForm.amount) > cashBalance) {
      toast.error('Solde de caisse insuffisant');
      return;
    }

    try {
      setSubmitting(true);
      await payStaff({
        userId: selectedUser.id,
        storeId: currentStore.id,
        amount: parseFloat(paymentForm.amount),
        period: paymentForm.period,
        description: paymentForm.description
      });
      toast.success(`Paiement effectué pour ${selectedUser.username}`);
      setShowPayModal(false);
      setPaymentForm({ amount: '', period: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  const openPayModal = (user) => {
    setSelectedUser(user);
    // Default period: Current month
    const now = new Date();
    const currentPeriod = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    setPaymentForm(prev => ({ ...prev, period: currentPeriod }));
    setShowPayModal(true);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Salaires</h1>
        <p className="text-gray-600 mt-1">Payer le personnel via la caisse du magasin : <span className="font-bold text-indigo-600">{currentStore?.name}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {loading ? (
          <CardSkeleton count={2} />
        ) : (
          <>
            <StatCard
              title="Solde de Caisse Actuel"
              value={formatCurrency(cashBalance)}
              icon={DollarSign}
              className="bg-indigo-50 border-indigo-100"
            />
            <StatCard
              title="Masse Salariale Estimée"
              value="Propulsé par la Caisse"
              icon={User}
              className="bg-gray-50 border-gray-100"
            />
          </>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Personnel</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Dernier Paiement</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-gray-900">{u.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                        {u.Role?.name || 'Inconnu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Non spécifié
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openPayModal(u)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                      >
                        <DollarSign className="h-4 w-4" />
                        Payer Salaire
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-50 text-center">
              <div className="h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Paiement Salaire</h2>
              <p className="text-gray-500 mt-1">Personnel : <span className="font-bold text-gray-900">{selectedUser?.username}</span></p>
            </div>

            <form onSubmit={handlePay} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Période (Mois/Année)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={paymentForm.period}
                    onChange={(e) => setPaymentForm({ ...paymentForm, period: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="ex: Janvier 2026"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Montant (FBu)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg"
                    placeholder="0"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> Solde dispo: {formatCurrency(cashBalance)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notes / Commentaire</label>
                <textarea
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                  placeholder="Notes optionnelles..."
                  rows="2"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
