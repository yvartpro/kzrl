import { useState, useEffect, useCallback } from 'react';
import { Briefcase, ClipboardList, Plus, Search, ChevronRight, CheckCircle2, AlertCircle, History, Package, ArrowLeft, Save } from 'lucide-react';
import { getEquipment, createEquipment, getEquipmentCategories, getInventories, getInventory, startInventory, updateInventoryItem, closeInventory } from '../api/services';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { TableSkeleton } from '../components/Skeletons';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function EquipmentInventory() {
  const { currentStore } = useStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('list');

  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [currentInventory, setCurrentInventory] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [openInventories, setOpenInventories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    quantity: 0,
    unitPrice: 0
  });

  const fetchData = useCallback(async () => {
    if (!currentStore) return;
    try {
      setLoading(true);
      const [eqRes, catRes, invRes] = await Promise.all([
        getEquipment(currentStore.id),
        getEquipmentCategories(currentStore.id),
        getInventories(currentStore.id)
      ]);
      setEquipment(eqRes.data);
      setCategories(catRes.data);
      setInventories(invRes.data);
      const openInvs = invRes.data.filter(inv => inv.status === 'OPEN');
      setOpenInventories(openInvs);
    } catch (err) {
      console.error(err);
      setError('Échec du chargement du matériel');
    } finally {
      setLoading(false);
    }
  }, [currentStore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createEquipment({ ...formData, storeId: currentStore.id });
      toast.success('Matériel ajouté avec succès');
      setShowAddModal(false);
      setFormData({ name: '', categoryId: '', description: '', quantity: 0, unitPrice: 0 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l’ajout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartInventory = async (categoryId = null) => {
    try {
      setSubmitting(true);
      const res = await startInventory({ storeId: currentStore.id, categoryId });
      const fullInventory = await getInventory(res.data.id);
      setCurrentInventory(fullInventory.data);
      setActiveView('conducting');
      toast.success('Session d’inventaire démarrée');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du démarrage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeInventory = async (inventoryId) => {
    setSubmitting(true);
    try {
      const res = await getInventory(inventoryId);
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
      await updateInventoryItem(itemId, data);
      setCurrentInventory(prev => ({
        ...prev,
        EquipmentInventoryItems: prev.EquipmentInventoryItems.map(item =>
          item.id === itemId ? { ...item, ...data } : item
        )
      }));
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCloseInventory = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clôturer l’Audit',
      message: 'Êtes-vous sûr de vouloir clôturer cet audit de matériel ? Les quantités en stock seront mises à jour définitivement.',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await closeInventory(currentInventory.id);
          toast.success('Inventaire clôturé avec succès');
          setActiveView('list');
          fetchData();
        } catch {
          toast.error('Erreur lors de la clôture');
        } finally {
          setSubmitting(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.EquipmentCategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentStore) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <Briefcase className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-xl font-medium">Veuillez sélectionner un magasin</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
              <Briefcase className="h-7 w-7" />
            </span>
            Inventaire Matériel
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gestion du mobilier et équipement fixe ({currentStore.name})</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView(activeView === 'history' ? 'list' : 'history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${activeView === 'history' ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
          >
            <History className="h-5 w-5" />
            Historique
          </button>

          {activeView === 'list' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="h-5 w-5" />
              Nouveau Matériel
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* List View */}
      {activeView === 'list' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un matériel ou une catégorie..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={3} />
          ) : filteredEquipment.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-bold text-lg">Aucun matériel trouvé</p>
            </div>
          ) : (
            <div className="space-y-8">
              {[...categories, { id: null, name: 'Sans Catégorie' }].map(category => {
                const categoryItems = filteredEquipment.filter(item =>
                  category.id ? item.EquipmentCategoryId === category.id : !item.EquipmentCategoryId
                );
                if (categoryItems.length === 0) return null;

                const openCategoryInv = openInventories.find(inv => inv.EquipmentCategoryId === category.id);

                return (
                  <div key={category.id || 'uncategorized'} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-blue-600">
                          <Package className="h-5 w-5" />
                        </span>
                        <h3 className="text-lg font-black text-gray-900">{category.name}</h3>
                      </div>

                      {openCategoryInv ? (
                        <button
                          onClick={() => handleResumeInventory(openCategoryInv.id)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-black hover:bg-amber-200 transition-colors"
                        >
                          <ClipboardList className="h-3 w-3" />
                          REPRENDRE INVENTAIRE
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartInventory(category.id)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-200 transition-colors"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          LANCER INVENTAIRE
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider w-10">#</th>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Libelle</th>
                            <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Quantité</th>
                            <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider">P.U</th>
                            <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-wider">P.T</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {categoryItems.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-400">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-bold text-gray-900">{item.name}</span>
                              </td>
                              <td className="px-6 py-4 font-medium">
                                <span className="text-sm text-gray-500 line-clamp-1">{item.description || '-'}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="inline-flex items-center justify-center px-4 py-1.5 bg-gray-100 text-gray-800 rounded-lg font-black text-sm">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-600">
                                {Number(item.unitPrice || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-black text-gray-900">
                                {(Number(item.quantity) * Number(item.unitPrice || 0)).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50/50">
                          <tr>
                            <td colSpan="5" className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase">Sous-total {category.name}</td>
                            <td className="px-6 py-3 text-right font-black text-blue-600">
                              {categoryItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice || 0)), 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}

              <div className="bg-blue-900 text-white rounded-3xl p-8 flex items-center justify-between shadow-xl mt-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-800 rounded-2xl">
                    <Package className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">VALEUR TOTALE DU MATÉRIEL</h3>
                    <p className="text-blue-300 text-sm font-bold uppercase tracking-widest">Calculé sur l'ensemble des catégories</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black">
                    {filteredEquipment.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice || 0)), 0).toLocaleString()} <span className="text-xl text-blue-300">FBU</span>
                  </div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">Valorisation en temps réel</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conducting View */}
      {activeView === 'conducting' && currentInventory && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50 font-bold">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setActiveView('list')} className="p-2 hover:bg-gray-50 rounded-xl">
                  <ArrowLeft className="h-6 w-6 text-gray-400" />
                </button>
                <h2 className="text-2xl font-black text-gray-900 uppercase">Audit Matériel</h2>
              </div>
              <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">Session Ouverte</span>
            </div>

            <div className="space-y-4">
              {currentInventory.EquipmentInventoryItems.map((item) => (
                <div key={item.id} className="p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <h4 className="font-black text-gray-900 text-lg leading-tight">{item.Equipment?.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Théorique: {item.expectedQuantity}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">Réel</label>
                        <input
                          type="number"
                          className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.actualQuantity}
                          onChange={(e) => handleUpdateItem(item.id, { actualQuantity: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">P.U</label>
                        <input
                          type="number"
                          className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-right outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.unitPriceSnapshot || 0}
                          onChange={(e) => handleUpdateItem(item.id, { unitPriceSnapshot: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 text-right">P.T</label>
                        <div className="w-28 px-3 py-2 bg-gray-100 border border-transparent rounded-xl font-black text-right text-blue-600">
                          {(Number(item.actualQuantity) * Number(item.unitPriceSnapshot || 0)).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">État</label>
                        <select
                          className="px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={item.condition}
                          onChange={(e) => handleUpdateItem(item.id, { condition: e.target.value })}
                        >
                          <option value="GOOD">Bon État</option>
                          <option value="DAMAGED">Endommagé</option>
                          <option value="LOST">Perdu</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Observations..."
                    className="mt-3 w-full bg-transparent border-b border-gray-200 px-1 py-1 text-sm outline-none focus:border-blue-500 italic"
                    value={item.notes || ''}
                    onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* FIXED FOOTER BAR FOR ACTIONS */}
            {currentInventory.status === 'OPEN' && (
              <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 z-50 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                  <div className="hidden md:flex items-center gap-3 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-bold">Sauvegarde automatique active</span>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveView('list')}
                      className="flex-1 md:flex-none px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-black hover:bg-gray-50 transition-all shadow-sm"
                    >
                      SAUVEGARDER & QUITTER
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseInventory}
                      disabled={submitting}
                      className="flex-1 md:flex-none px-10 py-3 bg-gray-900 text-white rounded-xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      {submitting ? 'TRAITEMENT...' : 'TERMINER & CLÔTURER'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="h-24" /> {/* Spacer for fixed bar */}

          {/* Confirmation Dialog */}
          <ConfirmDialog
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            loading={submitting}
          />
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setActiveView('list')} className="p-2 hover:bg-gray-50 rounded-xl">
              <ArrowLeft className="h-6 w-6 text-gray-400" />
            </button>
            <h2 className="text-xl font-black text-gray-900">Historique des Audits</h2>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
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
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-700">
                      {new Date(inv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inv.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {inv.status === 'CLOSED' ? 'Clôturé' : 'En cours'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 max-w-xs truncate">{inv.notes || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleResumeInventory(inv.id)} className="text-blue-600 font-bold hover:underline">Détails</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nouveau Matériel (Mobilier)">
        <form onSubmit={handleCreateEquipment} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nom du Matériel</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                placeholder="ex: Chaise Plastique"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Catégorie</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Choisir...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Quantité Initiale</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Prix Unitaire (P.U)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Description</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium h-24"
                placeholder="Détails du mobilier..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-50 transition-all mt-4"
          >
            {submitting ? 'CHARGEMENT...' : 'ENREGISTRER MATÉRIEL'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
