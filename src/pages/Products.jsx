import { useEffect, useState, useCallback } from 'react';
import { Package, Plus, Search, X, Edit3, Beef, Wine, Layers } from 'lucide-react';
import { getProducts, getCategories, adjustStock } from '../api/services';
import { formatCurrency, getStockStatus, getStockStatusColor } from '../utils/format';
import ErrorMessage from '../components/ErrorMessage';
import { TableSkeleton } from '../components/Skeletons';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import ProductEditModal from '../components/ProductEditModal';
import { useStore } from '../contexts/StoreContext';

export default function Products() {
  const { currentStore } = useStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(currentStore?.id),
        getCategories(currentStore?.id),
      ]);

      setProducts(productsRes.data.map(p => ({
        ...p,
        Stock: Array.isArray(p.Stocks) ? p.Stocks[0] : p.Stock
      })));
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id]);

  const handleAdjustStock = async (adjustmentData) => {
    await adjustStock({
      ...adjustmentData,
      storeId: currentStore?.id
    });
    fetchData();
  };

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  useEffect(() => {
    if (currentStore) {
      fetchData();
    }
  }, [currentStore, fetchData]);


  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.CategoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Produits & Inventaire</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Gérer le stock multi-contextuel (Bar & Restaurant)</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200"
        >
          <Plus className="h-5 w-5" />
          Nouveau Produit
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700 shadow-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-700 shadow-sm"
        >
          <option value="all">Toutes Catégories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Désignation</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type / Nature</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Actuel</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">P. Vente</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400">
                      <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="font-bold">Aucun produit ne correspond à votre recherche</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const stockQty = Number(product.Stock?.quantity || 0);
                    const status = getStockStatus(stockQty);

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${product.type === 'BAR' ? 'bg-purple-50 text-purple-600' :
                              product.type === 'RESTAURANT' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                              {product.type === 'BAR' ? <Wine className="h-4 w-4" /> :
                                product.type === 'RESTAURANT' ? <Beef className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="font-black text-gray-900 text-sm">{product.name}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase">{product.Category?.name || 'Sans catégorie'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-700">{product.type}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                              {product.nature === 'RAW_MATERIAL' ? 'Matière Première' :
                                product.nature === 'FINISHED_GOOD' ? 'Produit Fini' : 'Service'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-sm font-black ${stockQty <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                              {stockQty % 1 === 0 ? stockQty : stockQty.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">{product.baseUnit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-black text-gray-900 text-sm">
                          {formatCurrency(product.sellingPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStockStatusColor(status)} shadow-sm`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditingProduct(product); setShowModal(true); }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openAdjustModal(product)}
                              className="px-3 py-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all"
                            >
                              <Layers className="h-3 w-3" />
                              Ajuster
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ProductEditModal
          product={editingProduct || { name: '', nature: 'FINISHED_GOOD', type: 'GENERAL' }}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSuccess={fetchData}
        />
      )}

      <StockAdjustmentModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        product={selectedProduct}
        onAdjust={handleAdjustStock}
      />
    </div>
  );
}
