import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Search, ChevronRight, CheckCircle2, History, Package, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { getProductInventories, getProductInventory, startProductInventory, updateProductInventoryItem, closeProductInventory, getCategories, getProducts } from '../api/services';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { TableSkeleton } from '../components/Skeletons';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Inventory() {
  const { currentStore } = useStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('list');

  const [inventories, setInventories] = useState([]);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showStartModal, setShowStartModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });
  const [startFormData, setStartFormData] = useState({ categoryId: '', notes: '' });

  const fetchData = useCallback(async () => {
    if (!currentStore) return;
    try {
      setLoading(true);
      const [invRes, catRes, prodRes] = await Promise.all([
        getProductInventories(currentStore.id),
        getCategories(currentStore.id),
        getProducts(currentStore.id)
      ]);
      setInventories(invRes.data);
      setCategories(catRes.data);
      setProducts(prodRes.data);

    } catch (err) {
      console.error(err);
      setError('Échec du chargement des inventaires');
    } finally {
      setLoading(false);
    }
  }, [currentStore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartInventory = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await startProductInventory({
        storeId: currentStore.id,
        categoryId: startFormData.categoryId || null,
        notes: startFormData.notes
      });
      const fullInventory = await getProductInventory(res.data.id);
      setCurrentInventory(fullInventory.data);
      setActiveView('conducting');
      setShowStartModal(false);
      toast.success('Session d’inventaire démarrée');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erreur lors du démarrage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeInventory = async (inventoryId) => {
    setSubmitting(true);
    try {
      const res = await getProductInventory(inventoryId);
      setCurrentInventory(res.data);
      setActiveView('conducting');
    } catch {
      toast.error('Erreur lors de la reprise');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemId, data) => {
    try {
      // Optimistic update
      setCurrentInventory(prev => ({
        ...prev,
        ProductInventoryItems: prev.ProductInventoryItems.map(item =>
          item.id === itemId ? { ...item, ...data } : item
        )
      }));

      await updateProductInventoryItem(itemId, data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCloseInventory = async (inventoryId) => {
    const id = (inventoryId && typeof inventoryId === 'string') ? inventoryId : currentInventory?.id;
    if (!id) return;

    setConfirmModal({
      isOpen: true,
      title: 'Clôturer l’inventaire',
      message: 'Êtes-vous sûr de vouloir clôturer cet inventaire ? Les stocks seront mis à jour définitivement et la session sera verrouillée.',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await closeProductInventory(id);
          toast.success('Inventaire clôturé avec succès');
          setActiveView('list');
          fetchData();
        } catch (err) {
          console.error(err);
          toast.error('Erreur lors de la clôture');
        } finally {
          setSubmitting(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const calculateItemRow = (item) => {
    const unitsPerCrate = Math.round(Number(item.unitsPerBoxSnapshot)) || 1;
    const initialUnits = Math.round(Number(item.expectedQuantity));
    const actualUnits = (Math.round(Number(item.actualCrates)) * unitsPerCrate) + Math.round(Number(item.actualBottles));
    const gapInUnits = initialUnits - actualUnits;

    return {
      initialCrates: Math.floor(initialUnits / unitsPerCrate),
      initialBottles: initialUnits % unitsPerCrate,
      gapCrates: gapInUnits > 0 ? Math.floor(gapInUnits / unitsPerCrate) : (gapInUnits < 0 ? Math.ceil(gapInUnits / unitsPerCrate) : 0),
      gapBottles: gapInUnits % unitsPerCrate,
      gapAbsolute: gapInUnits,
      purchaseValue: (actualUnits / unitsPerCrate) * Number(item.purchasePriceSnapshot),
      lossValue: gapInUnits > 0 ? (gapInUnits / unitsPerCrate) * Number(item.purchasePriceSnapshot) : 0,
      surplusValue: gapInUnits < 0 ? (Math.abs(gapInUnits) / unitsPerCrate) * Number(item.purchasePriceSnapshot) : 0
    };
  };

  if (!currentStore) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <ClipboardList className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-xl font-medium">Veuillez sélectionner un magasin</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
              <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            Inventaire
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 font-medium text-sm sm:text-base">Contrôle des boissons ({currentStore.name})</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveView(activeView === 'history' ? 'list' : 'history')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-sm ${activeView === 'history' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
          >
            <History className="h-4 sm:h-5 w-4 sm:w-5" />
            Historique
          </button>

          {activeView === 'list' && (
            <button
              onClick={() => setShowStartModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-sm"
            >
              <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
              Nouveau
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* VIEW: STOCK LIST (Categorized) */}
      {activeView === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="relative px-4 sm:px-0">
            <Search className="absolute left-8 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-medium text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center mx-4 sm:mx-0">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-bold text-lg">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="space-y-8">
              {[...categories, { id: null, name: 'Autres / Sans Catégorie' }].map(category => {
                const filteredProducts = products.filter(p => {
                  const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory = category.id ? p.CategoryId === category.id : !p.CategoryId;
                  return matchesSearch && matchesCategory;
                });

                if (filteredProducts.length === 0) return null;

                return (
                  <div key={category.id || 'uncategorized'} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 mx-4 sm:mx-0">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-emerald-600">
                          <Package className="h-5 w-5" />
                        </span>
                        <h3 className="text-lg font-black text-gray-900">{category.name}</h3>
                      </div>

                      <button
                        onClick={() => {
                          setStartFormData({ ...startFormData, categoryId: category.id || '' });
                          setShowStartModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black hover:bg-emerald-200 transition-colors uppercase tracking-wider"
                      >
                        <ClipboardList className="h-3 w-3" />
                        INVENTAIRE RAPIDE
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Produit</th>
                            <th className="px-6 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Stock Actuel</th>
                            <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider">Conf.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredProducts.map(product => {
                            const stock = product.Stocks?.[0]?.quantity || product.Stock?.quantity || 0;
                            const unitsPerBox = product.unitsPerBox || 1;
                            const crates = Math.floor(stock / unitsPerBox);
                            const bottles = stock % unitsPerBox;

                            return (
                              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-bold text-gray-900 text-sm">{product.name}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <span className="px-2 sm:px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] sm:text-xs">
                                      {crates} C.
                                    </span>
                                    {bottles > 0 && (
                                      <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-[10px] sm:text-xs">
                                        {bottles} B.
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">{unitsPerBox}/C</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: AUDIT HISTORY */}
      {activeView === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-500 px-4 sm:px-0">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setActiveView('list')} className="p-2 hover:bg-gray-50 rounded-xl">
              <ArrowLeft className="h-6 w-6 text-gray-400" />
            </button>
            <h2 className="text-xl font-black text-gray-900">Historique des Sessions</h2>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Notes</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventories.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-700 text-sm">
                        {new Date(inv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inv.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {inv.status === 'CLOSED' ? 'Clôturé' : 'Ouvert'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[150px] truncate font-medium">
                        {inv.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'OPEN' && (
                            <button
                              onClick={() => handleCloseInventory(inv.id)}
                              className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg hover:bg-black transition-all uppercase"
                            >
                              Fermer
                            </button>
                          )}
                          <button
                            onClick={() => handleResumeInventory(inv.id)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {inventories.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-400 font-bold">Aucun historique</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CONDUCTING INVENTORY */}
      {activeView === 'conducting' && currentInventory && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 px-4 sm:px-0">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={() => setActiveView('list')} className="p-2 hover:bg-gray-50 rounded-xl">
                  <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </button>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight">Audit #{currentInventory.id.substring(0, 6).toUpperCase()}</h2>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">{new Date(currentInventory.date).toLocaleString()}</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                OUVERT
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] sm:max-h-[none]">
              <table className="min-w-full border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th rowSpan="2" className="px-2 sm:px-4 py-3 text-left text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">#</th>
                    <th rowSpan="2" className="px-3 sm:px-4 py-3 text-left text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">Libelle</th>
                    <th colSpan="2" className="px-2 py-2 text-center text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 border-b border-gray-100">Initial</th>
                    <th colSpan="2" className="px-2 py-2 text-center text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 border-b border-gray-100">Réel</th>
                    <th colSpan="2" className="px-2 py-2 text-center text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 border-b border-gray-100">Ecart</th>
                    <th rowSpan="2" className="px-2 sm:px-4 py-3 text-right text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">P.A.U</th>
                    <th rowSpan="2" className="px-2 sm:px-4 py-3 text-right text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest bg-emerald-50/30">Val.</th>
                    <th rowSpan="2" className="px-2 sm:px-4 py-3 text-right text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest bg-red-50/30 text-red-400">Pertes</th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-2 py-2 text-center text-[9px] font-black text-gray-500 uppercase border-r border-gray-100">C.</th>
                    <th className="px-2 py-2 text-center text-[9px] font-black text-gray-500 uppercase border-r border-gray-100">B.</th>
                    <th className="px-2 py-2 text-center text-[9px] font-black text-gray-500 uppercase border-r border-gray-100">C.</th>
                    <th className="px-2 py-2 text-center text-[9px] font-black text-gray-500 uppercase border-r border-gray-100">B.</th>
                    <th className="px-2 py-2 text-center text-[9px] font-black text-gray-500 uppercase border-r border-gray-100">C.</th>
                    <th className="px-2 py-2 text-center text-[9px] font-black text-gray-500 uppercase border-r border-gray-100">B.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentInventory.ProductInventoryItems.map((item, idx) => {
                    const stats = calculateItemRow(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-2 sm:px-4 py-3 text-xs text-gray-400 font-bold border-r border-gray-50">{idx + 1}</td>
                        <td className="px-3 sm:px-4 py-3 border-r border-gray-50 min-w-[120px]">
                          <div className="font-bold text-gray-900 text-xs sm:text-sm">{item.Product?.name}</div>
                          <div className="text-[9px] text-gray-400 font-bold uppercase">{Math.round(item.unitsPerBoxSnapshot)}/C</div>
                        </td>
                        <td className="px-2 py-3 text-center font-black text-gray-700 border-r border-gray-50 bg-gray-50/10 text-xs">{stats.initialCrates}</td>
                        <td className="px-2 py-3 text-center font-black text-gray-700 border-r border-gray-50 bg-gray-50/10 text-xs">{stats.initialBottles}</td>

                        <td className="px-1 py-2 border-r border-gray-50">
                          <input
                            type="number"
                            className="w-full px-1 py-2 bg-white border border-gray-200 rounded-lg font-black text-center outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                            value={item.actualCrates}
                            onChange={(e) => handleUpdateItem(item.id, { actualCrates: parseInt(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-1 py-2 border-r border-gray-50">
                          <input
                            type="number"
                            className="w-full px-1 py-2 bg-white border border-gray-200 rounded-lg font-black text-center outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                            value={item.actualBottles}
                            onChange={(e) => handleUpdateItem(item.id, { actualBottles: parseInt(e.target.value) || 0 })}
                          />
                        </td>

                        <td className={`px-2 py-3 text-center border-r border-gray-50 font-bold text-xs ${stats.gapAbsolute !== 0 ? 'text-red-500' : 'text-gray-300'}`}>{stats.gapCrates || ''}</td>
                        <td className={`px-2 py-3 text-center border-r border-gray-50 font-bold text-xs ${stats.gapAbsolute !== 0 ? 'text-red-500' : 'text-gray-300'}`}>{stats.gapBottles || ''}</td>

                        <td className="px-1 py-2 border-r border-gray-50">
                          <input
                            type="number"
                            className="w-full px-1 py-2 bg-white border border-gray-200 rounded-lg font-bold text-right outline-none focus:ring-2 focus:ring-emerald-500 text-[10px] text-gray-500"
                            value={item.purchasePriceSnapshot}
                            onChange={(e) => handleUpdateItem(item.id, { purchasePriceSnapshot: parseFloat(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-right font-black text-gray-900 border-r border-gray-50 text-[10px] sm:text-xs">
                          {Math.round(stats.purchaseValue).toLocaleString()}
                        </td>
                        <td className={`px-2 sm:px-4 py-3 text-right font-black text-[10px] sm:text-xs ${stats.lossValue > 0 ? 'text-red-600 bg-red-50/30' : 'text-gray-300'}`}>
                          {stats.lossValue > 0 ? Math.round(stats.lossValue).toLocaleString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-900 text-white">
                  <tr>
                    <td colSpan="9" className="px-4 py-4 text-right font-black uppercase text-[10px]">Total</td>
                    <td className="px-2 sm:px-4 py-4 text-right font-black text-xs">
                      {Math.round(currentInventory.ProductInventoryItems.reduce((sum, i) => sum + calculateItemRow(i).purchaseValue, 0)).toLocaleString()}
                    </td>
                    <td className="px-2 sm:px-4 py-4 text-right font-black text-red-400 text-xs">
                      {Math.round(currentInventory.ProductInventoryItems.reduce((sum, i) => sum + calculateItemRow(i).lossValue, 0)).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* FIXED FOOTER BAR */}
          {currentInventory.status === 'OPEN' && (
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="hidden min-[1100px]:flex items-center gap-3 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-tighter">Sync Active</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveView('list')}
                    className="flex-1 sm:flex-none px-6 sm:px-10 py-3.5 bg-white border-2 border-gray-100 text-gray-700 rounded-xl text-xs font-black hover:bg-gray-50 transition-all shadow-sm uppercase tracking-wider"
                  >
                    QUITTER
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCloseInventory()}
                    disabled={submitting}
                    className="flex-1 sm:flex-none px-8 sm:px-12 py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? '...' : 'CLÔTURER'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GLOBAL DIALOGS */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        loading={submitting}
      />

      <Modal isOpen={showStartModal} onClose={() => setShowStartModal(false)} title="Démarrer l'Inventaire">
        <form onSubmit={handleStartInventory} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              value={startFormData.categoryId}
              onChange={(e) => setStartFormData({ ...startFormData, categoryId: e.target.value })}
            >
              <option value="">Tous les produits</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-medium text-sm"
              rows="3"
              placeholder="Ex: Inventaire périodique..."
              value={startFormData.notes}
              onChange={(e) => setStartFormData({ ...startFormData, notes: e.target.value })}
            ></textarea>
          </div>

          <div className="flex gap-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={() => setShowStartModal(false)}
              className="flex-1 py-3 text-gray-500 font-bold border border-gray-100 rounded-xl hover:bg-gray-50 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-50 text-sm"
            >
              {submitting ? 'Lancement...' : 'Démarrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
