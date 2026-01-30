import { useEffect, useState, useCallback } from 'react';
import { Calendar, FileText, TrendingUp, Package, DollarSign, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDailyReport, getStockValuation, getJournalReport, getGlobalCapital } from '../api/services';
import { formatCurrency } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [capitalData, setCapitalData] = useState({ liquidAssets: 0, stockValue: 0, globalCapital: 0 });

  // Journal State
  const [journalData, setJournalData] = useState({ entries: [], totalCount: 0, totalPages: 0, currentPage: 1 });
  const [journalSearch, setJournalSearch] = useState('');
  const [journalPage, setJournalPage] = useState(1);
  const [journalLoading, setJournalLoading] = useState(false);

  // Stock State
  const [stockData, setStockData] = useState({ items: [], totalCount: 0, totalPages: 0, currentPage: 1, totalValue: 0 });
  const [stockSearch, setStockSearch] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [stockLoading, setStockLoading] = useState(false);

  const toast = useToast();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [reportRes, capitalRes] = await Promise.all([
        getDailyReport(selectedDate),
        getGlobalCapital()
      ]);
      setDailyReport(reportRes.data);
      setCapitalData(capitalRes.data);
    } catch (err) {
      console.error(err);
      setError('Échec du chargement du résumé');
      toast.error('Échec du chargement du résumé');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, toast]);

  const fetchJournal = useCallback(async (page = 1, search = '') => {
    try {
      setJournalLoading(true);
      const res = await getJournalReport({ date: selectedDate, page, limit: 10, search });
      setJournalData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Échec du chargement du journal');
    } finally {
      setJournalLoading(false);
    }
  }, [selectedDate, toast]);

  const fetchStock = useCallback(async (page = 1, search = '') => {
    try {
      setStockLoading(true);
      const res = await getStockValuation({ date: selectedDate, page, limit: 10, search });
      setStockData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Échec du chargement du stock');
    } finally {
      setStockLoading(false);
    }
  }, [selectedDate, toast]);

  // Initial fetch and summary update on date change
  useEffect(() => {
    fetchSummary();
    setJournalPage(1);
    setStockPage(1);
  }, [fetchSummary]);

  // Debounced search for Journal
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchJournal(journalPage, journalSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchJournal, journalPage, journalSearch]);

  // Debounced search for Stock
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStock(stockPage, stockSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchStock, stockPage, stockSearch]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports Financiers</h1>
          <p className="text-gray-600 mt-1">Journal comptable et résumés quotidiens</p>
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
            Imprimer
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Global Capital Indicator (Banner style for visibility) */}
      <div className="bg-white rounded-lg p-6 mb-6 text-slate-900 shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-1">Capital Global du Bar</h2>
            <div className="text-4xl font-extrabold">{formatCurrency(capitalData.globalCapital)}</div>
          </div>
          <div className="flex gap-8 border-l border-slate-400 pl-8 h-full">
            <div>
              <p className="text-slate-900 text-xs font-medium uppercase mb-1">Liquidités (Caisse)</p>
              <p className="text-xl font-bold">{formatCurrency(capitalData.liquidAssets)}</p>
            </div>
            <div>
              <p className="text-slate-700 text-xs font-medium uppercase mb-1">Valeur du Stock</p>
              <p className="text-xl font-bold">{formatCurrency(capitalData.stockValue)}</p>
            </div>
          </div>
        </div>
        {/* Decorative background circle */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-500 rounded-full opacity-20"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 no-print">
        <StatCard
          title="Ventes du Jour"
          value={formatCurrency(dailyReport?.totalDailySales || dailyReport?.totalRevenue || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Bénéfice Total"
          value={formatCurrency(dailyReport?.totalProfit || 0)}
          icon={TrendingUp}
        />
        <StatCard
          title="Transactions"
          value={dailyReport?.transactionCount || 0}
          icon={FileText}
        />
        <StatCard
          title="Avoir en Stock"
          value={formatCurrency(stockData?.totalValue || 0)}
          icon={Package}
        />
      </div>

      {/* Accounting Journal */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Journal Général</h2>
              <p className="text-sm text-gray-600 mt-1">Date : {new Date(selectedDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={journalSearch}
                onChange={(e) => { setJournalSearch(e.target.value); setJournalPage(1); }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[200px]">
          {journalLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <LoadingSpinner />
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Heure</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Débit (FBu)</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Crédit (FBu)</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Solde (FBu)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {journalData.entries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <p>Aucune transaction trouvée</p>
                  </td>
                </tr>
              ) : (
                <>
                  {journalData.entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{entry.description}</div>
                        <div className="text-xs text-gray-500">{entry.reference}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {entry.debit > 0 ? <span className="text-green-600">{formatCurrency(entry.debit)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {entry.credit > 0 ? <span className="text-red-600">{formatCurrency(entry.credit)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan="2" className="px-6 py-4 text-sm text-gray-900">Totaux du jour</td>
                    <td className="px-6 py-4 text-right text-green-700">{formatCurrency(journalData.totalDebit)}</td>
                    <td className="px-6 py-4 text-right text-red-700">{formatCurrency(journalData.totalCredit)}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(journalData.totalDebit - journalData.totalCredit)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Journal Pagination */}
        {journalData.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between no-print">
            <div className="text-sm text-gray-600">
              Affichage de {journalData.entries.length} sur {journalData.totalCount} transactions
            </div>
            <div className="flex gap-2">
              <button
                disabled={journalPage === 1}
                onClick={() => setJournalPage(p => p - 1)}
                className="p-2 border rounded hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 py-2 text-sm font-medium">Page {journalPage} sur {journalData.totalPages}</span>
              <button
                disabled={journalPage === journalData.totalPages}
                onClick={() => setJournalPage(p => p + 1)}
                className="p-2 border rounded hover:bg-white disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stock Valuation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Valorisation du Stock (Achat)</h2>
              <p className="text-sm text-gray-600 mt-1">Valeur totale : {formatCurrency(stockData.totalValue)}</p>
            </div>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={stockSearch}
                onChange={(e) => { setStockSearch(e.target.value); setStockPage(1); }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto relative min-h-[200px]">
          {stockLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <LoadingSpinner />
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Produit</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Quantité</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">PMP Achat</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Valeur Totale</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockData.items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <p>Aucun produit trouvé</p>
                  </td>
                </tr>
              ) : (
                stockData.items.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">{formatCurrency(item.unitCost)}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-indigo-600">{formatCurrency(item.totalValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stock Pagination */}
        {stockData.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between no-print">
            <div className="text-sm text-gray-600">
              Affichage de {stockData.items.length} sur {stockData.totalCount} produits
            </div>
            <div className="flex gap-2">
              <button
                disabled={stockPage === 1}
                onClick={() => setStockPage(p => p - 1)}
                className="p-2 border rounded hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 py-2 text-sm font-medium">Page {stockPage} sur {stockData.totalPages}</span>
              <button
                disabled={stockPage === stockData.totalPages}
                onClick={() => setStockPage(p => p + 1)}
                className="p-2 border rounded hover:bg-white disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
