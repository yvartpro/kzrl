import { useEffect, useState } from 'react';
import { Package, Plus, Search, X, Edit3 } from 'lucide-react';
import { getProducts, getCategories, createProduct, updateProduct, adjustStock } from '../api/services';
import { formatCurrency, getStockStatus, getStockStatusColor } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import { TableSkeleton } from '../components/Skeletons';
import StockAdjustmentModal from '../components/StockAdjustmentModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    CategoryId: '',
    purchaseUnit: 'BOX',
    baseUnit: 'UNIT',
    unitsPerBox: 1,
    purchasePrice: 0,
    sellingPrice: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        unitsPerBox: parseInt(formData.unitsPerBox),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success('Produit mis à jour avec succès');
      } else {
        await createProduct(payload);
        toast.success('Produit créé avec succès');
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        CategoryId: '',
        purchaseUnit: 'BOX',
        baseUnit: 'UNIT',
        unitsPerBox: 1,
        purchasePrice: 0,
        sellingPrice: 0,
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de l\'opération');
      toast.error('Échec de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (adjustmentData) => {
    try {
      await adjustStock(adjustmentData);
      toast.success('Stock ajusté avec succès');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec de l\'ajustement du stock');
      throw err;
    }
  };

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      CategoryId: product.CategoryId,
      purchaseUnit: product.purchaseUnit,
      baseUnit: product.baseUnit,
      unitsPerBox: product.unitsPerBox,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
    });
    setShowModal(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.CategoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits & Stock</h1>
          <p className="text-gray-600 mt-1">Gérer votre inventaire</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Ajouter Produit
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Product Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingProduct(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du Produit *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.CategoryId}
                    onChange={(e) => setFormData({ ...formData, CategoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unités par Carton *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.unitsPerBox}
                    onChange={(e) => setFormData({ ...formData, unitsPerBox: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Combien d'unités dans un carton ?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix d'Achat (par carton) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Coût d'achat fournisseur</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix de Vente (par unité) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Prix de vente aux clients</p>
                </div>
              </div>

              {formData.purchasePrice > 0 && formData.unitsPerBox > 0 && formData.sellingPrice > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Coût Unitaire :</strong> {formatCurrency(formData.purchasePrice / formData.unitsPerBox)}
                    <br />
                    <strong>Profit par Unité :</strong> {formatCurrency(formData.sellingPrice - (formData.purchasePrice / formData.unitsPerBox))}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingProduct(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {submitting ? 'Traitement...' : (editingProduct ? 'Enregistrer' : 'Créer Produit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes Catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Produit</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Catégorie</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">U/Carton</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">P. Achat</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">P. Vente</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p>Aucun produit trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const stockQty = product.Stock?.quantity || 0;
                    const status = getStockStatus(stockQty);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-sm">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500 font-medium">{product.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.Category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-black ${stockQty <= (product.Stock?.minLevel || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                            {stockQty} <span className="text-[10px] uppercase font-bold text-gray-400">unités</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.unitsPerBox}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.purchasePrice)} / carton
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.sellingPrice)} / unité
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openAdjustModal(product)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              Ajuster Stock
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

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        product={selectedProduct}
        onAdjust={handleAdjustStock}
      />
    </div>
  );
}
