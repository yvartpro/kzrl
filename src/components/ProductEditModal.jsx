import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, ClipboardList } from 'lucide-react';
import { updateProduct, createProduct, getCategories, getSuppliers, getProducts } from '../api/services';
import { useToast } from './Toast';
import { useStore } from '../contexts/StoreContext';

export default function ProductEditModal({ product, onClose, onSuccess }) {
  const { currentStore } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    supplierId: '',
    purchaseUnit: 'BOX',
    baseUnit: 'UNIT',
    unitsPerBox: '1',
    purchasePrice: '',
    sellingPrice: '',
    type: product?.type || (currentStore?.type === 'WAREHOUSE' ? 'BOUTIQUE' : currentStore?.type) || 'BOUTIQUE',
    nature: 'FINISHED_GOOD',
    minStockLevel: '0',
  });

  const [compositions, setCompositions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, suppliersRes, productsRes] = await Promise.all([
        getCategories(currentStore?.id),
        getSuppliers(),
        getProducts(currentStore?.id) // Fetch store-specific to find ingredients
      ]);
      setCategories(categoriesRes.data);
      setSuppliers(suppliersRes.data);
      setAvailableIngredients(productsRes.data.filter(p => p.nature === 'RAW_MATERIAL' && p.id !== product?.id));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [product?.id, currentStore?.id]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        categoryId: product.CategoryId || product.Category?.id || '',
        supplierId: product.SupplierId || product.Supplier?.id || '',
        purchaseUnit: product.purchaseUnit || 'BOX',
        baseUnit: product.baseUnit || 'UNIT',
        unitsPerBox: product.unitsPerBox || '1',
        purchasePrice: product.purchasePrice || '',
        sellingPrice: product.sellingPrice || '',
        type: product.type || 'BOUTIQUE',
        nature: product.nature || 'FINISHED_GOOD',
        minStockLevel: product.minStockLevel || '0',
      });
      setCompositions(product.compositions || []);
    }
    fetchData();
  }, [product, fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateUnitCost = () => {
    if (formData.nature === 'FINISHED_GOOD' && compositions.length > 0) {
      // Cost from ingredients
      return compositions.reduce((total, comp) => {
        const ingredient = availableIngredients.find(ing => ing.id === comp.componentProductId);
        if (!ingredient) return total;
        const ingUnitCost = Number(ingredient.purchasePrice) / Number(ingredient.unitsPerBox);
        return total + (ingUnitCost * Number(comp.quantity));
      }, 0);
    }
    // Standard cost
    const pPrice = parseFloat(formData.purchasePrice) || 0;
    const conv = parseFloat(formData.unitsPerBox) || 1;
    return pPrice / conv;
  };

  const unitCost = calculateUnitCost();
  const sellingPrice = parseFloat(formData.sellingPrice) || 0;
  const margin = sellingPrice - unitCost;
  const marginPercent = unitCost > 0 ? ((margin / unitCost) * 100).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isUpdate = !!product?.id;
      const payload = {
        ...formData,
        storeId: currentStore?.id,
        compositions: compositions.map(c => ({
          componentProductId: c.componentProductId,
          quantity: c.quantity
        }))
      };

      if (isUpdate) {
        await updateProduct(product.id, payload);
        toast.success('Produit mis à jour avec succès');
      } else {
        await createProduct(payload);
        toast.success('Produit créé avec succès');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(product?.id ? 'Update product error:' : 'Create product error:', error);
      toast.error(error.response?.data?.error || (product?.id ? 'Échec de la mise à jour' : 'Échec de la création'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{product?.id ? 'Configuration Produit' : 'Nouveau Produit'}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{product?.id ? product.name : 'Création de fiche'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-8">
            {/* Section: Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="md:col-span-2">
                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-tighter">Classification & Type</h3>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Usage / Contexte</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700">
                  {(!currentStore || currentStore.type === 'WAREHOUSE' || currentStore.type === 'BAR') && (
                    <option value="BAR">Bar (Boissons / Vins)</option>
                  )}
                  {(!currentStore || currentStore.type === 'WAREHOUSE' || currentStore.type === 'CUISINE') && (
                    <option value="CUISINE">Cuisine (Plats / Ingrédients)</option>
                  )}
                  {(!currentStore || currentStore.type === 'WAREHOUSE' || currentStore.type === 'BOUTIQUE') && (
                    <option value="BOUTIQUE">Boutique (Articles / Divers)</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nature du Produit</label>
                <select name="nature" value={formData.nature} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700">
                  <option value="RAW_MATERIAL">Matière Première (Ingrédient)</option>
                  <option value="FINISHED_GOOD">Produit Fini (Vendu tel quel)</option>
                  <option value="SERVICE">Service (Main d'oeuvre / Prestation)</option>
                </select>
              </div>
            </div>

            {/* Section: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nom du Produit</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Catégorie</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700">
                  <option value="">Sélectionner...</option>
                  {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Fournisseur Habituel</label>
                <select name="supplierId" value={formData.supplierId} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700">
                  <option value="">Sélectionner...</option>
                  {suppliers.map(sup => (<option key={sup.id} value={sup.id}>{sup.name}</option>))}
                </select>
              </div>
            </div>

            {/* Section: Units & Logic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-tighter">Unités & Stockage</h3>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Unité d'Achat</label>
                <select name="purchaseUnit" value={formData.purchaseUnit} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700">
                  <option value="BOX">Carton / Caisse</option>
                  <option value="UNIT">Unité / Pièce</option>
                  <option value="KG">Kilogramme (KG)</option>
                  <option value="L">Litre (L)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Unité de Base (Stock)</label>
                <select name="baseUnit" value={formData.baseUnit} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700">
                  <option value="UNIT">Pièce / Bouteille</option>
                  <option value="KG">Kilogramme (KG)</option>
                  <option value="G">Gramme (G)</option>
                  <option value="L">Litre (L)</option>
                  <option value="ML">Millilitre (ML)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Facteur Conversion</label>
                <input type="number" step="0.001" name="unitsPerBox" value={formData.unitsPerBox} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700" placeholder="Ex: 24" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-red-400 uppercase mb-2">Alerte Stock Bas ({formData.baseUnit})</label>
                <input type="number" step="0.001" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} className="w-full px-4 py-3 border border-red-100 bg-red-50/30 rounded-2xl focus:ring-4 focus:ring-red-50 outline-none transition-all font-bold text-red-700" placeholder="Ex: 10" />
              </div>
            </div>

            {/* Section: Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-tighter">Tarification & Rentabilité</h3>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Prix d'Achat (par {formData.purchaseUnit})</label>
                <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Prix de Vente (par {formData.baseUnit})</label>
                <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700" />
              </div>

              <div className="md:col-span-2 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Coût de Revient ({formData.baseUnit})</p>
                    <p className="text-xl font-black text-emerald-900">{unitCost.toLocaleString()} FBu</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Marge Brute</p>
                    <p className="text-xl font-black text-emerald-900">{margin.toLocaleString()} FBu</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">% Marge</p>
                    <p className="text-xl font-black text-emerald-900">{marginPercent}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Composition (If Finished Good) */}
            {formData.nature === 'FINISHED_GOOD' && (
              <div className="space-y-4 border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Composition / Recette</h3>
                    <p className="text-xs text-gray-400 font-medium">Définissez les ingrédients consommés lors de la vente.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompositions([...compositions, { componentProductId: '', quantity: 1 }])}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    <Plus className="h-4 w-4" /> Ajouter
                  </button>
                </div>

                <div className="space-y-3">
                  {compositions.map((comp, idx) => (
                    <div key={idx} className="flex gap-4 items-end bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Ingrédient</label>
                        <select
                          value={comp.componentProductId}
                          onChange={(e) => {
                            const newComps = [...compositions];
                            newComps[idx].componentProductId = e.target.value;
                            setCompositions(newComps);
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700 text-sm"
                        >
                          <option value="">Sélectionner...</option>
                          {availableIngredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.name} ({ing.baseUnit})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-40">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Quantité ({availableIngredients.find(i => i.id === comp.componentProductId)?.baseUnit || '?'})</label>
                        <input
                          type="number" step="0.001" value={comp.quantity}
                          onChange={(e) => {
                            const newComps = [...compositions];
                            newComps[idx].quantity = e.target.value;
                            setCompositions(newComps);
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCompositions(compositions.filter((_, i) => i !== idx))}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  {compositions.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl">
                      <p className="text-sm text-gray-400 font-bold">Aucune composition définie. Le produit sera décompté de son propre stock.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-12 bg-white sticky bottom-0 border-t border-gray-50 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-4 border border-gray-200 text-gray-400 rounded-2xl font-black hover:bg-gray-50 transition-all">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Enregistrement...' : (product?.id ? 'Mettre à jour Configuration' : 'Créer le Produit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
