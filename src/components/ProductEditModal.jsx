import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateProduct, getCategories, getSuppliers } from '../api/services';
import { useToast } from './Toast';

export default function ProductEditModal({ product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    supplierId: '',
    boxQuantity: '',
    unitsPerBox: '',
    unitCost: '',
    sellingPrice: ''
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        categoryId: product.CategoryId || product.Category?.id || '',
        supplierId: product.SupplierId || product.Supplier?.id || '',
        boxQuantity: product.boxQuantity || '',
        unitsPerBox: product.unitsPerBox || '',
        unitCost: product.unitCost || '',
        sellingPrice: product.sellingPrice || ''
      });
    }
    fetchData();
  }, [product]);

  const fetchData = async () => {
    try {
      const [categoriesRes, suppliersRes] = await Promise.all([
        getCategories(),
        getSuppliers()
      ]);
      setCategories(categoriesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateMargin = () => {
    const cost = parseFloat(formData.unitCost) || 0;
    const price = parseFloat(formData.sellingPrice) || 0;
    const margin = price - cost;
    const marginPercent = cost > 0 ? ((margin / cost) * 100).toFixed(2) : 0;
    return { margin, marginPercent };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only send changed fields
      const updates = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          updates[key] = formData[key];
        }
      });

      await updateProduct(product.id, updates);
      toast.success('Product updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update product error:', error);
      toast.error(error.response?.data?.error || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const { margin, marginPercent } = calculateMargin();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            {/* Box Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Box Quantity
              </label>
              <input
                type="number"
                name="boxQuantity"
                value={formData.boxQuantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            {/* Units per Box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Units per Box
              </label>
              <input
                type="number"
                name="unitsPerBox"
                value={formData.unitsPerBox}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost (Prix de Revient)
              </label>
              <input
                type="number"
                name="unitCost"
                value={formData.unitCost}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.01"
                min="0"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.01"
                min="0"
              />
            </div>

            {/* Margin Display */}
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Margin (FBu)</p>
                  <p className="text-lg font-bold text-gray-900">{margin.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Margin (%)</p>
                  <p className="text-lg font-bold text-gray-900">{marginPercent}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
