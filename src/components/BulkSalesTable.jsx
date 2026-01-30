import { useState } from 'react';
import { Plus, Trash2, Save, ShoppingCart } from 'lucide-react';
import { useToast } from './Toast';
import { createBulkSales } from '../api/services';
import { formatCurrency } from '../utils/format';

export default function BulkSalesTable({ products, onSuccess }) {
  const [rows, setRows] = useState([
    { id: 1, productId: '', quantity: 1, paymentMethod: 'CASH', notes: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now(), productId: '', quantity: 1, paymentMethod: 'CASH', notes: '' }
    ]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const getProductPrice = (productId) => {
    const product = products.find(p => p.id == productId);
    return product ? parseFloat(product.sellingPrice) : 0;
  };

  const calculateRowTotal = (row) => {
    const price = getProductPrice(row.productId);
    return price * (parseInt(row.quantity) || 0);
  };

  const calculateGrandTotal = () => {
    return rows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
  };

  const handleSubmit = async () => {
    // Validate
    const invalidRows = rows.filter(r => !r.productId || r.quantity <= 0);
    if (invalidRows.length > 0) {
      toast.error('Veuillez sélectionner un produit et une quantité valide pour toutes les lignes');
      return;
    }

    setLoading(true);
    try {
      const salesData = rows.map(row => ({
        productId: row.productId,
        quantity: parseInt(row.quantity),
        paymentMethod: row.paymentMethod,
        notes: row.notes
      }));

      const res = await createBulkSales(salesData);

      if (res.status === 207) {
        const errors = res.data.errors || [];
        const successCount = res.data.results?.length || 0;

        toast.warning(
          <div>
            <p className="font-bold">{successCount} réussites, {errors.length} échecs</p>
            <ul className="text-xs mt-1 list-disc pl-4">
              {errors.slice(0, 3).map((err, i) => (
                <li key={i}>Ligne {parseInt(err.index) + 1}: {err.error}</li>
              ))}
              {errors.length > 3 && <li>...</li>}
            </ul>
          </div>,
          { duration: 5000 }
        );

        // Don't clear rows if there are errors, so user can correct them
        // Maybe filter out successful rows? For simplicity, keeping all is safer but annoying.
        if (onSuccess && successCount > 0) onSuccess();
      } else {
        toast.success('Ventes enregistrées avec succès');
        setRows([{ id: Date.now(), productId: '', quantity: 1, paymentMethod: 'CASH', notes: '' }]);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Bulk sales error:', error);
      toast.error(error.response?.data?.error || 'Échec de l\'enregistrement des ventes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-fade-in">
      <div className="p-6 border-b flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Saisie Groupée (Fin de Journée)</h2>
          <p className="text-sm text-gray-600">Enregistrer plusieurs ventes en une seule fois</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Global</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculateGrandTotal())}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Quantité</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Prix Unitaire</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Méthode</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-2">
                    <select
                      value={row.productId}
                      onChange={(e) => updateRow(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Sélectionner un produit...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.Stock?.quantity || 0} en stock)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-600">
                    {formatCurrency(getProductPrice(row.productId))}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(calculateRowTotal(row))}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={row.paymentMethod}
                      onChange={(e) => updateRow(index, 'paymentMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="CASH">Espèces</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="CARD">Carte</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Ajouter une ligne
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Enregistrer Tout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
