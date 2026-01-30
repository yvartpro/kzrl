import api from './client';

// Products
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data) => api.post('/suppliers', data);

// Purchases
export const getPurchases = () => api.get('/purchases');
export const createPurchase = (data) => api.post('/purchases', data);

// Sales
export const getSales = () => api.get('/sales');
export const createSale = (data) => api.post('/sales', data);
export const createBulkSales = (data) => api.post('/sales/bulk', data);

// Stock
export const adjustStock = (data) => api.post('/stock/adjust', data);
export const getStockMovements = (productId) => api.get(`/stock/movements/${productId}`);

// Cash
export const getCashBalance = () => api.get('/cash/balance');
export const getCashMovements = (params) => api.get('/cash/movements', { params });
export const createExpense = (data) => api.post('/cash/expenses', data);
export const getExpenses = (params) => api.get('/cash/expenses', { params });

// Reports
export const getDailyReport = (date) => api.get('/reports/daily', { params: { date } });
export const getStockValuation = (date) => api.get('/reports/stock-value', { params: { date } });
export const getStockHealth = () => api.get('/reports/stock-health');
