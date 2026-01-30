import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onAdjust,
}) {
  const [formData, setFormData] = useState({
    quantity: 0,
    reason: 'ADJUSTMENT',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ quantity: 0, reason: 'ADJUSTMENT', notes: '' });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = product.Stock?.quantity || 0;
  const newStock = currentStock + formData.quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.quantity === 0) {
      setError('Quantity cannot be zero');
      return;
    }

    if (newStock < 0) {
      setError('Adjustment would result in negative stock');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onAdjust({
        productId: product.id,
        quantity: formData.quantity,
        reason: formData.reason,
        notes: formData.notes,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Adjust Stock</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Product Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              Current Stock: <span className="font-semibold">{currentStock} units</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Quantity Adjustment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: formData.quantity - 1 })}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use negative numbers to decrease stock, positive to increase
            </p>
          </div>

          {/* New Stock Preview */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              New Stock: <span className="font-semibold">{newStock} units</span>
              {formData.quantity !== 0 && (
                <span className={formData.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}({formData.quantity > 0 ? '+' : ''}{formData.quantity})
                </span>
              )}
            </p>
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="ADJUSTMENT">Adjustment / Correction</option>
              <option value="LOSS">Loss / Damage</option>
              <option value="FREE">Free / Promotional</option>
            </select>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Optional notes about this adjustment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || formData.quantity === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adjusting...' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
