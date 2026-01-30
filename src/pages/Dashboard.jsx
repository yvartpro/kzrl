import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import ErrorMessage from '../components/ErrorMessage';
import { getDailyReport, getCashBalance, getProducts } from '../api/services';
import { formatCurrency, getStockStatus } from '../utils/format';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayProfit: 0,
    cashBalance: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const [dailyReport, cashData, productsData] = await Promise.all([
        getDailyReport(today),
        getCashBalance(),
        getProducts(),
      ]);

      const lowStock = productsData.data.filter(p => {
        const status = getStockStatus(p.Stock?.quantity || 0);
        return status === 'LOW' || status === 'OUT';
      });

      setStats({
        todaySales: dailyReport.data.totalRevenue || 0,
        todayProfit: dailyReport.data.totalProfit || 0,
        cashBalance: cashData.data.balance || 0,
        lowStockCount: lowStock.length,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600 mt-1">Bienvenue ! Voici ce qui se passe aujourd'hui.</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatCard
          title="Ventes du Jour"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Bénéfice du Jour"
          value={formatCurrency(stats.todayProfit)}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Caisse Actuelle"
          value={formatCurrency(stats.cashBalance)}
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          title="Articles en Stock Faible"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          loading={loading}
        />
      </div>

      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/sales"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <DollarSign className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Nouvelle Vente</h3>
            <p className="text-sm text-gray-600 mt-1">Traiter une nouvelle transaction</p>
          </a>
          <a
            href="/purchases"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <DollarSign className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Enregistrer un Achat</h3>
            <p className="text-sm text-gray-600 mt-1">Ajouter un nouvel inventaire</p>
          </a>
          <a
            href="/reports"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <DollarSign className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Voir les Rapports</h3>
            <p className="text-sm text-gray-600 mt-1">Vérifier les performances</p>
          </a>
        </div>
      </div>
    </div>
  );
}
