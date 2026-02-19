import { useState } from 'react';
import { Plus, Trash2, Save, ShoppingCart } from 'lucide-react';
import { useToast } from './Toast';
import { createBulkSales } from '../api/services';
import { formatCurrency } from '../utils/format';

export default function BulkSalesTable({ products, onSuccess, storeId }) {
  const [rows, setRows] = useState([
    { id: 1, productId: '', quantity: 1, paymentMethod: 'CASH', isBulk: false, notes: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now(), productId: '', quantity: 1, paymentMethod: 'CASH', isBulk: false, notes: '' }
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


  const calculateRowTotal = (row) => {
    const product = products.find(p => p.id == row.productId);
    const unitPrice = product ? parseFloat(product.sellingPrice) : 0;
    const factor = row.isBulk && product ? parseFloat(product.unitsPerBox || 1) : 1;
    return unitPrice * factor * (parseFloat(row.quantity) || 0);
  };

  const calculateGrandTotal = () => {
    return rows.reduce((sum, row) => sum + calculateRowTotal(row), 0);
  };

  const handleSubmit = async () => {
    // Validate
    const invalidRows = rows.filter(r => !r.productId || parseFloat(r.quantity) <= 0);
    if (invalidRows.length > 0) {
      toast.error('Veuillez sélectionner un produit et une quantité valide pour toutes les lignes');
      return;
    }

    if (!storeId) {
      toast.error('ID de la boutique manquant. Veuillez rafraîchir la page.');
      return;
    }

    setLoading(true);
    try {
      const salesData = rows.map(row => ({
        productId: row.productId,
        quantity: parseFloat(row.quantity),
        paymentMethod: row.paymentMethod,
        isBulk: row.isBulk,
        notes: row.notes,
        storeId: storeId // Include storeId per item
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
        setRows([{ id: Date.now(), productId: '', quantity: 1, paymentMethod: 'CASH', isBulk: false, notes: '' }]);
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
      <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Saisie Groupée (Fin de Journée)</h2>
          <p className="text-sm text-gray-600">Enregistrer plusieurs ventes en une seule fois</p>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto p-3 bg-blue-50 sm:bg-transparent rounded-xl border border-blue-100 sm:border-0">
          <p className="text-xs sm:text-sm text-gray-600 font-bold uppercase tracking-wider">Total Global</p>
          <p className="text-2xl font-black text-blue-600">{formatCurrency(calculateGrandTotal())}</p>
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
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={row.quantity}
                        onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="flex items-center gap-2 px-1">
                        <input
                          type="checkbox"
                          id={`bulk-row-${row.id}`}
                          checked={row.isBulk}
                          onChange={(e) => updateRow(index, 'isBulk', e.target.checked)}
                          className="w-3 h-3"
                        />
                        <label htmlFor={`bulk-row-${row.id}`} className="text-[10px] font-bold text-blue-600 uppercase">Vente en Gros</label>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-600">
                    {(() => {
                      const p = products.find(prod => prod.id == row.productId);
                      if (!p) return '-';
                      const pPrice = parseFloat(p.sellingPrice);
                      return formatCurrency(row.isBulk ? pPrice * parseFloat(p.unitsPerBox || 1) : pPrice);
                    })()}
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

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={addRow}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-bold"
          >
            <Plus className="h-5 w-5" />
            Ajouter une ligne
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 font-bold shadow-lg shadow-blue-100"
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
