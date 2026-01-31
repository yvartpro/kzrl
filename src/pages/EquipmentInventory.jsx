import { useState, useEffect, useCallback } from 'react';
import { Briefcase, ClipboardList, Plus, Search, ChevronRight, CheckCircle2, AlertCircle, History, Package, ArrowLeft, Save } from 'lucide-react';
import { getEquipment, createEquipment, getEquipmentCategories, getInventories, getInventory, startInventory, updateInventoryItem, closeInventory } from '../api/services';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { TableSkeleton, FormSkeleton } from '../components/Skeletons';
import Modal from '../components/Modal';

export default function EquipmentInventory() {
  const { currentStore } = useStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list', 'history', 'conducting'

  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [currentInventory, setCurrentInventory] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [openInventory, setOpenInventory] = useState(null); // Track if there's an open inventory
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    quantity: 0
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
      // Check for an open inventory
      const openInv = invRes.data.find(inv => inv.status === 'OPEN');
      setOpenInventory(openInv);
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
      setFormData({ name: '', categoryId: '', description: '', quantity: 0 });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erreur lors de l’ajout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartInventory = async () => {
    try {
      setSubmitting(true);
      const res = await startInventory({ storeId: currentStore.id });
      const fullInventory = await getInventory(res.data.id);
      setCurrentInventory(fullInventory.data);
      setActiveView('conducting');
      toast.success('Session d’inventaire démarrée');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du démarrage de l’inventaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemId, data) => {
    try {
      await updateInventoryItem(itemId, data);
      // Local update
      setCurrentInventory(prev => ({
        ...prev,
        EquipmentInventoryItems: prev.EquipmentInventoryItems.map(item =>
          item.id === itemId ? { ...item, ...data } : item
        )
      }));
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCloseInventory = async () => {
    try {
      setSubmitting(true);
      await closeInventory(currentInventory.id);
      toast.success('Inventaire clôturé avec succès');
      setActiveView('list');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la clôture');
    } finally {
      setSubmitting(false);
    }
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
              <ClipboardList className="h-7 w-7" />
            </span>
            Inventaire Matériel
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gestion et audit du matériel fixe ({currentStore.name})</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('history')}
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

      {/* Main Content Area */}
      {activeView === 'list' && (
        <div className="space-y-6">
          {/* Quick Stats & Search */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un matériel ou une catégorie..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-medium text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {openInventory ? (
            <button
              onClick={async () => {
                setSubmitting(true);
                try {
                  const res = await getInventory(openInventory.id);
                  setCurrentInventory(res.data);
                  setActiveView('conducting');
                } catch (err) {
                  toast.error('Erreur lors de la reprise de l’inventaire');
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-50"
            >
              <ClipboardList className="h-5 w-5" />
              Reprendre l'inventaire
            </button>
          ) : (
            <button
              onClick={handleStartInventory}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50"
            >
              <CheckCircle2 className="h-5 w-5" />
              Lancer Inventaire
            </button>
          )}

          {/* Equipment Grid */}
          {
            loading ? (
              <TableSkeleton rows={6} cols={4} />
            ) : filteredEquipment.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-bold text-lg">Aucun matériel trouvé</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-blue-600 font-bold mt-2 hover:underline"
                >
                  Ajouter votre premier matériel
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {[...categories, { id: null, name: 'Sans Catégorie' }].map(category => {
                  const categoryItems = filteredEquipment.filter(item =>
                    category.id ? item.EquipmentCategoryId === category.id : !item.EquipmentCategoryId
                  );

                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category.id || 'uncategorized'} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-blue-600">
                            <Briefcase className="h-5 w-5" />
                          </span>
                          <h3 className="text-lg font-black text-gray-900">{category.name}</h3>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                          {categoryItems.length} article{categoryItems.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Nom</th>
                              <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Description</th>
                              <th className="px-6 py-3 text-center text-xs font-black text-gray-400 uppercase tracking-wider">Quantité</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {categoryItems.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors bg-white">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-bold text-gray-900">{item.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-gray-500 line-clamp-1">{item.description || '-'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 text-gray-800 rounded-lg font-black text-sm">
                                    {item.quantity}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div >
      )
      }

      {/* Conducting Inventory View */}
      {
        activeView === 'conducting' && currentInventory && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-100">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveView('list')} className="p-2 hover:bg-gray-50 rounded-xl">
                    <ArrowLeft className="h-6 w-6 text-gray-400" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Session d'Inventaire</h2>
                    <p className="text-gray-500 font-medium">Contrôle physique du matériel</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-black uppercase tracking-wider animate-pulse">
                    Session Ouverte
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {currentInventory.EquipmentInventoryItems.map((item) => (
                  <div key={item.id} className="p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-grow">
                        <h4 className="font-black text-gray-900 text-lg">{item.Equipment?.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">Théorique : {item.expectedQuantity}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Quantité Réelle</label>
                          <input
                            type="number"
                            className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
                            value={item.actualQuantity}
                            onChange={(e) => handleUpdateItem(item.id, { actualQuantity: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">État</label>
                          <select
                            className="px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
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

                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Remarques (ex: 2 cassés, 1 ébréché...)"
                        className="w-full bg-white/50 border border-transparent border-b-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400 transition-colors italic"
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-end gap-4">
                <button
                  onClick={() => {
                    toast.success('Brouillon sauvegardé');
                    setActiveView('list');
                  }}
                  className="px-6 py-4 border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                >
                  Sauvegarder et Quitter
                </button>

                <button
                  onClick={handleCloseInventory}
                  disabled={submitting || currentInventory?.status === 'CLOSED'}
                  className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  {submitting ? 'Traitement...' : 'Clôturer Inventaire'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* History View */}
      {
        activeView === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setActiveView('list')} className="p-2 hover:bg-gray-50 rounded-xl">
                <ArrowLeft className="h-6 w-6 text-gray-400" />
              </button>
              <h2 className="text-xl font-black text-gray-900">Historique des Inventaires</h2>
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
                        {new Date(inv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${inv.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {inv.status === 'CLOSED' ? 'Clôturé' : 'En cours'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate font-medium">
                        {inv.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'OPEN' ? (
                          <button
                            onClick={async () => {
                              const res = await getInventory(inv.id);
                              setCurrentInventory(res.data);
                              setActiveView('conducting');
                            }}
                            className="flex items-center gap-2 text-amber-600 hover:text-amber-800 font-bold text-sm bg-amber-50 px-3 py-1.5 rounded-lg"
                          >
                            Reprendre
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              const res = await getInventory(inv.id);
                              setCurrentInventory(res.data);
                              setActiveView('conducting');
                            }}
                            className="text-gray-400 hover:text-gray-600 p-2"
                            title="Voir les détails"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Add Equipment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un Matériel"
      >
        <form onSubmit={handleCreateEquipment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nom du Matériel</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ex: Chaise Plastique Rouge"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Quantité Initiale</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows="3"
                placeholder="Détails supplémentaires..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-3 text-gray-500 font-bold border border-gray-100 rounded-xl hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-50"
            >
              {submitting ? 'Chargement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div >
  );
}
