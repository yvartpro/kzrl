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
      setError(err.response?.data?.error || 'Failed to load data');
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
      setError(err.response?.data?.error || 'Failed to create category');
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
      setError(err.response?.data?.error || 'Failed to create supplier');
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
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage categories, suppliers, and system settings</p>
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
            Categories
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Suppliers
          </button>
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Category Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Beers, Soft Drinks, Snacks"
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
                {categorySubmitting ? 'Creating...' : 'Create Category'}
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Existing Categories ({categories.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No categories yet</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Supplier</h2>
            <form onSubmit={handleCreateSupplier}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g., ABC Distributors"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact (Phone/Email)
                </label>
                <input
                  type="text"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                  placeholder="e.g., +257 79 123 456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={supplierSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                <Plus className="h-5 w-5" />
                {supplierSubmitting ? 'Creating...' : 'Create Supplier'}
              </button>
            </form>
          </div>

          {/* Suppliers List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Existing Suppliers ({suppliers.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suppliers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No suppliers yet</p>
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
          User Roles & Permissions
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>Role Management:</strong> The backend has a User & Role system built in.
            Roles are stored in the database and linked to users.
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
            <strong>To implement full role management:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Create user management endpoints in backend</li>
            <li>Add authentication (JWT/sessions)</li>
            <li>Create login page in dashboard</li>
            <li>Add role-based UI visibility (hide features based on role)</li>
            <li>Add user management page to create/edit users and assign roles</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
