import { useState, useEffect } from 'react';
import { Plus, Settings as SettingsIcon, Users, Tag, Trash2 } from 'lucide-react';
import { getCategories, createCategory, getSuppliers, createSupplier } from '../api/services';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [categoriesRes, suppliersRes] = await Promise.all([
        getCategories(),
        getSuppliers(),
      ]);
      setCategories(categoriesRes.data);
      setSuppliers(suppliersRes.data);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
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
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Category Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                <Plus className="h-5 w-5" />
                {categorySubmitting ? 'Création...' : 'Créer Catégorie'}
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Catégories Existantes ({categories.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune catégorie</p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                <Plus className="h-5 w-5" />
                {supplierSubmitting ? 'Création...' : 'Créer Fournisseur'}
              </button>
            </form>
          </div>

          {/* Suppliers List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Fournisseurs Existants ({suppliers.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suppliers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun fournisseur</p>
              ) : (
                suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
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

      {/* Role Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Rôles & Permissions Utilisateurs
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>Gestion des Rôles :</strong> Le backend dispose d'un système Utilisateur & Rôle intégré.
            Les rôles sont stockés dans la base de données et liés aux utilisateurs.
          </p>
          <div className="bg-white rounded p-3 mt-2">
            <p className="font-medium mb-2">Backend Models:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li><code className="bg-gray-100 px-1 rounded">User</code> - username, passwordHash, isActive</li>
              <li><code className="bg-gray-100 px-1 rounded">Role</code> - name (e.g., ADMIN, MANAGER, WAITER)</li>
              <li>Relationship: <code className="bg-gray-100 px-1 rounded">User.belongsTo(Role)</code></li>
            </ul>
          </div>
          <p className="mt-3">
            <strong>Pour implémenter la gestion complète des rôles :</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Créer des endpoints de gestion des utilisateurs dans le backend</li>
            <li>Ajouter l'authentification (JWT/sessions)</li>
            <li>Créer une page de connexion dans le tableau de bord</li>
            <li>Ajouter une visibilité d'interface basée sur les rôles</li>
            <li>Ajouter une page de gestion des utilisateurs pour créer/éditer et assigner des rôles</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
