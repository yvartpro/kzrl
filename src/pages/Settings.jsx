import { useState, useEffect } from 'react';
import { Plus, Settings as SettingsIcon, Users, Tag, Lock, Database, Trash2, Save } from 'lucide-react';
import { getCategories, createCategory, getSuppliers, createSupplier, changePassword, getProducts, initializeCash, initializeStock, getCashBalance } from '../api/services';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('categories');

  // Category form
  const [categoryName, setCategoryName] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Supplier form
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '' });
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);
  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Initialization/Stock initialization state
  const [products, setProducts] = useState([]);
  const [cashInitForm, setCashInitForm] = useState({ amount: '' });
  const [cashBalance, setCashBalance] = useState(0);
  const [initializationLoading, setInitializationLoading] = useState(false);
  const [stockInitValues, setStockInitValues] = useState({}); // { productId: quantity }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [categoriesRes, suppliersRes, productsRes, cashRes] = await Promise.all([
        getCategories(),
        getSuppliers(),
        getProducts(),
        getCashBalance()
      ]);
      setCategories(categoriesRes.data);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
      setCashBalance(cashRes.data);

      // Pre-fill stock init values with current stock
      const initialStock = {};
      productsRes.data.forEach(p => {
        initialStock[p.id] = p.Stock?.quantity || 0;
      });
      setStockInitValues(initialStock);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      setCategorySubmitting(true);
      setError(null);
      await createCategory({ name: categoryName });
      setCategoryName('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la création de la catégorie');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      setSupplierSubmitting(true);
      setError(null);
      await createSupplier(supplierForm);
      setSupplierForm({ name: '', contact: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la création du fournisseur');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    try {
      setPasswordSubmitting(true);
      setError(null);
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError(null);
      alert('Mot de passe mis à jour avec succès');
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la mise à jour du mot de passe');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleInitializeCash = async (e) => {
    e.preventDefault();
    try {
      setInitializationLoading(true);
      setError(null);
      await initializeCash({ amount: parseFloat(cashInitForm.amount) });
      alert('Solde de caisse initialisé avec succès');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Échec de l'initialisation du cash");
    } finally {
      setInitializationLoading(false);
    }
  };

  const handleInitializeStock = async (productId) => {
    try {
      setInitializationLoading(true);
      setError(null);
      await initializeStock({ productId, quantity: parseInt(stockInitValues[productId]) });
      alert('Stock mis à jour avec succès');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Échec de l'initialisation du stock");
    } finally {
      setInitializationLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-7 w-7" />
          Paramètres
        </h1>
        <p className="text-gray-600 mt-1">Gérer les catégories, fournisseurs et paramètres système</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'categories'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Tag className="h-4 w-4 inline mr-2" />
            Catégories
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'suppliers'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Fournisseurs
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'security'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Lock className="h-4 w-4 inline mr-2" />
            Sécurité
          </button>
          <button
            onClick={() => setActiveTab('init')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'init'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Database className="h-4 w-4 inline mr-2" />
            Initialisation
          </button>
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Category Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une Catégorie</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la Catégorie
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="ex: Bières, Jus, Snacks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={categorySubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                <Plus className="h-5 w-5" />
                {categorySubmitting ? 'Création...' : 'Créer Catégorie'}
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Catégories Existantes ({categories.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune catégorie</p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Supplier Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un Fournisseur</h2>
            <form onSubmit={handleCreateSupplier}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Fournisseur
                </label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="ex: ABC Distributeurs"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact (Tél/Email)
                </label>
                <input
                  type="text"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                  placeholder="ex: +257 79 123 456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={supplierSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                <Plus className="h-5 w-5" />
                {supplierSubmitting ? 'Création...' : 'Créer Fournisseur'}
              </button>
            </form>
          </div>

          {/* Suppliers List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Fournisseurs Existants ({suppliers.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {suppliers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun fournisseur</p>
              ) : (
                suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{supplier.name}</span>
                    </div>
                    {supplier.contact && (
                      <p className="text-sm text-gray-600 ml-8">{supplier.contact}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-600" />
              Changer mon mot de passe
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-all shadow-md"
              >
                {passwordSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* System Initialization Tab */}
      {activeTab === 'init' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cash Initialization */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Ouverture de Caisse
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Définissez le montant initial présent dans la caisse lors de l'ouverture du bar.
            </p>

            <div className="bg-green-50 p-4 rounded-lg mb-6 flex justify-between items-center border border-green-100">
              <span className="text-sm text-green-700 font-medium">Solde Actuel :</span>
              <span className="text-xl font-bold text-green-800">{formatCurrency(cashBalance)}</span>
            </div>

            <form onSubmit={handleInitializeCash} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau Solde Initial (FBu)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="ex: 500000"
                  value={cashInitForm.amount}
                  onChange={(e) => setCashInitForm({ amount: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={initializationLoading}
                className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {initializationLoading ? 'Initialisation...' : 'Valider le Solde'}
              </button>
            </form>
          </div>

          {/* Stock Initialization */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Inventaire Initial
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Saisissez les quantités de produits déjà disponibles en stock.
            </p>

            <div className="flex-grow overflow-auto max-h-[500px] border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <input
                          type="number"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={stockInitValues[product.id] || 0}
                          onChange={(e) => setStockInitValues({ ...stockInitValues, [product.id]: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleInitializeStock(product.id)}
                          disabled={initializationLoading}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm p-1 transition-colors"
                          title="Mettre à jour ce stock"
                        >
                          <Save className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                        Créez d'abord des produits
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              * Note: Cela créera un mouvement de type 'INITIAL' pour régulariser le stock.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCurrency(amount) {
  if (isNaN(amount)) return '0 FBu';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FBu';
}
