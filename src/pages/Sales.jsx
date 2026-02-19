import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { getProducts, createSale } from '../api/services';
import { formatCurrency } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import { CardSkeleton } from '../components/Skeletons';
import BulkSalesTable from '../components/BulkSalesTable';

import { useStore } from '../contexts/StoreContext';

export default function Sales() {
  const { currentStore } = useStore();
  const [activeTab, setActiveTab] = useState('POS');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProducts(currentStore?.id);
      // Backend returns stock for current store in the Stock array or single object
      // Based on our controller update, it returns an array of stocks filtered by store
      setProducts(res.data.map(p => ({
        ...p,
        Stock: Array.isArray(p.Stocks) ? p.Stocks[0] : p.Stock
      })).filter(p => (p.Stock?.quantity || 0) > 0));
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    if (currentStore) {
      fetchProducts();
    }
  }, [currentStore, fetchProducts]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.sellingPrice),
        quantity: 1,
        maxStock: product.Stock?.quantity || 0,
        isBulk: false,
        unitsPerBox: product.unitsPerBox || 1
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.maxStock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateItemSubtotal = (item) => {
    const unitPrice = item.isBulk ? item.price * item.unitsPerBox : item.price;
    return unitPrice * item.quantity;
  };

  const total = cart.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);

      await createSale({
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          isBulk: item.isBulk
        })),
        paymentMethod,
        storeId: currentStore?.id
      });

      setSuccess(true);
      setCart([]);
      toast.success('Vente effectuée avec succès !');
      setTimeout(() => {
        setSuccess(false);
        fetchProducts();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du traitement de la vente');
      toast.error(err.response?.data?.error || 'Échec du traitement de la vente');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Point de Vente</h1>
        <p className="text-gray-600 mt-1">Traiter les transactions de vente</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab('POS')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'POS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Point de Vente (POS)
        </button>
        <button
          onClick={() => setActiveTab('BULK')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'BULK' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Saisie Groupée
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-green-800 font-medium">Vente effectuée avec succès !</p>
        </div>
      )}

      {activeTab === 'POS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <CardSkeleton count={6} />
                ) : (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-4 border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left shadow-sm hover:shadow-md"
                    >
                      <h3 className="font-bold text-gray-900 text-base">{product.name}</h3>
                      <p className="text-sm text-gray-700 mt-1 font-medium">
                        {formatCurrency(product.sellingPrice)} / unité
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Stock: {product.Stock?.quantity || 0} unités
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-lg shadow-blue-50/50 sticky top-24">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 tracking-tight">
                <ShoppingCart className="h-5 w-5" />
                Panier ({cart.length})
              </h2>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Panier vide</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.productId} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              {formatCurrency(item.isBulk ? item.price * item.unitsPerBox : item.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-100">
                            <input
                              type="checkbox"
                              id={`bulk-sale-${item.productId}`}
                              checked={item.isBulk}
                              onChange={(e) => {
                                setCart(cart.map(i =>
                                  i.productId === item.productId ? { ...i, isBulk: e.target.checked } : i
                                ));
                              }}
                              className="w-3 h-3"
                            />
                            <label htmlFor={`bulk-sale-${item.productId}`} className="text-[10px] font-black text-blue-600 uppercase">Gros</label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-6 mb-6">
                    <div className="flex justify-between text-2xl font-black text-gray-900 tracking-tighter">
                      <span className="text-gray-500 text-sm uppercase tracking-widest mt-2">Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moyen de Paiement
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="CASH">Espèces</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || cart.length === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? 'Traitement...' : 'Finaliser Vente'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <BulkSalesTable products={products} onSuccess={fetchProducts} storeId={currentStore?.id} />
      )}
    </div>
  );
}
