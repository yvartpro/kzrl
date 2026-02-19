import { useEffect, useState, useCallback } from 'react';
import { Package, Plus, X } from 'lucide-react';
import { getPurchases, getSuppliers, getProducts, createPurchase } from '../api/services';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import { TableSkeleton } from '../components/Skeletons';

import { useStore } from '../contexts/StoreContext';

export default function Purchases() {
  const { currentStore } = useStore();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const [formData, setFormData] = useState({
    supplierId: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, isBulk: true }],
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        getPurchases(currentStore?.id),
        getSuppliers(),
        getProducts(currentStore?.id, 'false'), // Get all products possibly sellable in this store
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);

      // Remap products to extract the correct stock for the current store
      const mappedProducts = productsRes.data.map(p => ({
        ...p,
        Stock: Array.isArray(p.Stocks) ? p.Stocks[0] : p.Stock
      }));
      setProducts(mappedProducts);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, isBulk: true }],
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await createPurchase({ ...formData, storeId: currentStore?.id });
      setShowForm(false);
      setFormData({
        supplierId: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0, isBulk: true }],
        notes: '',
      });
      fetchData();
      toast.success('Achat enregistré avec succès');
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'enregistrement de l\'achat');
      toast.error('Échec de l\'enregistrement de l\'achat');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter">Achats</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Gestion des stocks entrants</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-xl text-sm ${showForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
        >
          {showForm ? 'Annuler' : 'Nouvel Achat'}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-8 mb-6 mx-4 sm:mx-0 shadow-lg shadow-gray-100 animate-in fade-in zoom-in-95 duration-300">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Nouvel Achat
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fournisseur</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-gray-700 transition-all"
                  required
                >
                  <option value="">Sélectionner fournisseur</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-gray-700 transition-all"
                  placeholder="Notes de livraison..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Détails des Articles</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-100 transition-all uppercase tracking-widest"
                >
                  + Nouveau
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl relative">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] text-gray-400 font-black uppercase mb-1">Produit</label>
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const prodId = e.target.value;
                          const product = products.find(p => p.id === prodId);
                          const unitPrice = product ? parseFloat(product.purchasePrice) : 0;
                          const newItems = [...formData.items];
                          newItems[index].productId = prodId;
                          newItems[index].unitPrice = unitPrice;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none"
                        required
                      >
                        <option value="">Sélectionner</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.Stock?.quantity || 0})</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] text-gray-400 font-black uppercase tracking-tighter">Qté</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="hidden peer"
                            checked={item.isBulk}
                            onChange={(e) => updateItem(index, 'isBulk', e.target.checked)}
                          />
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[8px] font-black uppercase peer-checked:bg-blue-500 peer-checked:text-white transition-all">Gros</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-gray-400 font-black uppercase mb-1">P.A ({item.isBulk ? 'G' : 'U'})</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none"
                        required
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        disabled={formData.items.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 text-sm uppercase tracking-widest mt-4"
            >
              {submitting ? 'VALIDATION...' : 'CONFIRMER L’ACHAT'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm mx-4 sm:mx-0">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fournisseur</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Coût Total</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p>Aucun achat enregistré</p>
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(purchase.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.Supplier?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-600">
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {purchase.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
