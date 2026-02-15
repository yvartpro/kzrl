export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FBu';
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const getStockStatus = (quantity, threshold = 10) => {
  if (quantity === 0) return 'EPUISE';
  if (quantity <= threshold) return 'FAIBLE';
  return 'OK';
};

export const getStockStatusColor = (status) => {
  switch (status) {
    case 'OUT':
      return 'text-red-600 bg-red-50';
    case 'LOW':
      return 'text-yellow-600 bg-yellow-50';
    case 'OK':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};
