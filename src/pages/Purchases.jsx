import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { getPurchases, getSuppliers, getProducts, createPurchase } from '../api/services';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useToast } from '../components/Toast';
import ErrorMessage from '../components/ErrorMessage';
import { TableSkeleton } from '../components/Skeletons';

export default function Purchases() {
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
    items: [{ productId: '', quantityBoxes: 1, unitPriceBox: 0 }],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        getPurchases(),
        getSuppliers(),
        getProducts(),
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantityBoxes: 1, unitPriceBox: 0 }],
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
      await createPurchase(formData);
      setShowForm(false);
      setFormData({
        supplierId: '',
        items: [{ productId: '', quantityBoxes: 1, unitPriceBox: 0 }],
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Achats</h1>
          <p className="text-gray-600 mt-1">Enregistrer les achats auprès des fournisseurs</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Annuler' : 'Nouvel Achat'}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nouvel Achat</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fournisseur
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner fournisseur</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes optionnelles"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Articles</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Ajouter Article
                </button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      const product = products.find(p => p.id === prodId);
                      const unitPrice = product ? parseFloat(product.purchasePrice) : 0;

                      const newItems = [...formData.items];
                      newItems[index].productId = prodId;
                      newItems[index].unitPriceBox = unitPrice;
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Sélectionner produit</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantityBoxes}
                    onChange={(e) => updateItem(index, 'quantityBoxes', parseInt(e.target.value))}
                    placeholder="Cartons"
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.unitPriceBox}
                    onChange={(e) => updateItem(index, 'unitPriceBox', parseFloat(e.target.value))}
                    placeholder="Prix par carton"
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={formData.items.length === 1}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {submitting ? 'Création...' : 'Valider l\'Achat'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
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
        )}
      </div>
    </div>
  );
}
