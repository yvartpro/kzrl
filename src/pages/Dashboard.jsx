import { useEffect, useState, useCallback } from 'react';
import { DollarSign, AlertTriangle, ShoppingBag, Landmark, Briefcase, Calculator, ShieldCheck } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import { getSales, getProducts, getGlobalCapital } from '../api/services';
import { formatCurrency, getStockStatus } from '../utils/format';
import { CardSkeleton, TableSkeleton } from '../components/Skeletons';

import { useStore } from '../contexts/StoreContext';

export default function Dashboard() {
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaySales, setTodaySales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [capitalData, setCapitalData] = useState({ liquidAssets: 0, stockValue: 0, globalCapital: 0 });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const [salesRes, productsRes, capitalRes] = await Promise.all([
        getSales(), // Would need storeId filter in backend too, but keeping it simple for now if it's already filtered
        getProducts(currentStore?.id),
        getGlobalCapital() // Global capital stays global
      ]);

      // Filter Sales for Today
      const salesToday = salesRes.data.filter(s =>
        s.createdAt.startsWith(today)
      );
      setTodaySales(salesToday);

      // Filter Low Stock
      const lowStock = productsRes.data.map(p => ({
        ...p,
        Stock: Array.isArray(p.Stocks) ? p.Stocks[0] : p.Stock
      })).filter(p => {
        const status = getStockStatus(p.Stock?.quantity || 0);
        return status === 'LOW' || status === 'OUT';
      }).map(p => ({
        ...p,
        status: getStockStatus(p.Stock?.quantity || 0)
      }));
      setLowStockProducts(lowStock);

      // Set Capital Data
      setCapitalData(capitalRes.data);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    if (currentStore) {
      fetchDashboardData();
    }
  }, [currentStore, fetchDashboardData]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600 mt-1">Aperçu opérationnel du {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <>
          <CardSkeleton count={3} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <TableSkeleton rows={5} cols={3} />
            <TableSkeleton rows={5} cols={3} />
          </div>
        </>
      ) : (
        <>
          {/* Capital Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover-lift">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Liquidités (Caisse)</span>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Landmark className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(capitalData.liquidAssets)}</div>
              <p className="text-xs text-gray-400 mt-1">Argent disponible immédiatement</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover-lift">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valeur du Stock</span>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(capitalData.stockValue)}</div>
              <p className="text-xs text-gray-400 mt-1">Basée sur le prix d'achat</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-50 hover-lift bg-gradient-to-br from-indigo-50/50 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Capital Global</span>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calculator className="h-5 w-5 text-indigo-700" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-indigo-900">{formatCurrency(capitalData.globalCapital)}</div>
              <p className="text-xs text-indigo-600/70 mt-1 font-medium italic">Liquidités + Valeur Stock</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Sales Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full shadow-sm">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  Ventes d'Aujourd'hui
                </h2>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                  {todaySales.length} ventes
                </span>
              </div>
              <div className="overflow-auto flex-grow">
                {todaySales.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium italic">Aucune vente enregistrée aujourd'hui.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Heure</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Méthode</th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {todaySales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${sale.paymentMethod === 'MOBILE_MONEY'
                              ? 'bg-orange-50 text-orange-600 border border-orange-100'
                              : 'bg-green-50 text-green-600 border border-green-100'
                              }`}>
                              {sale.paymentMethod === 'MOBILE_MONEY' ? 'MoMo' : 'CASH'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {todaySales.length > 0 && (
                <div className="p-4 border-t border-gray-50 bg-gray-50/30 flex justify-between font-bold text-gray-900">
                  <span className="text-gray-500 uppercase text-xs tracking-widest mt-1">Total Cumulé</span>
                  <span className="text-xl">
                    {formatCurrency(todaySales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0))}
                  </span>
                </div>
              )}
            </div>

            {/* Low Stock Alerts Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full shadow-sm">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Alertes Stock Faible
                </h2>
                <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-100">
                  {lowStockProducts.length} articles
                </span>
              </div>
              <div className="overflow-auto flex-grow max-h-[500px]">
                {lowStockProducts.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-green-200" />
                    <p className="font-medium italic">Tout est en ordre. Aucun stock critique.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Produit</th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priorité</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {lowStockProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                            {p.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-red-600 font-extrabold tracking-tighter">
                            {p.Stock?.quantity || 0}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${p.status === 'OUT'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-100 text-amber-700'
                              }`}>
                              {p.status === 'OUT' ? 'CRITIQUE' : 'À COMMANDER'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
