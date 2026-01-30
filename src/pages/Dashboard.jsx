import { useEffect, useState } from 'react';
import { DollarSign, AlertTriangle, ShoppingBag } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSales, getProducts } from '../api/services';
import { formatCurrency, formatDateTime, getStockStatus } from '../utils/format';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaySales, setTodaySales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const [salesRes, productsRes] = await Promise.all([
        getSales(), // Note: Ideally backend should support date filtering
        getProducts(),
      ]);

      // Filter Sales for Today
      const salesToday = salesRes.data.filter(s =>
        s.createdAt.startsWith(today)
      );
      setTodaySales(salesToday);

      // Filter Low Stock
      const lowStock = productsRes.data.filter(p => {
        const status = getStockStatus(p.Stock?.quantity || 0);
        return status === 'LOW' || status === 'OUT';
      }).map(p => ({
        ...p,
        status: getStockStatus(p.Stock?.quantity || 0)
      }));
      setLowStockProducts(lowStock);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600 mt-1">Aperçu opérationnel du {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Today's Sales Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              Ventes d'Aujourd'hui
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {todaySales.length} ventes
            </span>
          </div>
          <div className="overflow-auto flex-grow">
            {todaySales.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune vente enregistrée aujourd'hui.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todaySales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(sale.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        {sale.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Espèces'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {todaySales.length > 0 && (
            <div className="p-4 border-t bg-gray-50 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>
                {formatCurrency(todaySales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0))}
              </span>
            </div>
          )}
        </div>

        {/* Low Stock Alerts Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertes Stock Faible
            </h2>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {lowStockProducts.length} articles
            </span>
          </div>
          <div className="overflow-auto flex-grow max-h-[500px]">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Tout est en ordre. Aucun stock critique.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantité</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                        {p.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900">
                        {p.Stock?.quantity || 0}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'OUT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {p.status === 'OUT' ? 'Épuisé' : 'Faible'}
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
    </div>
  );
}
