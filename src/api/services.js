import api from './client';

// Products
export const getProducts = (storeId, filterByStock) => api.get('/products', { params: { storeId, filterByStock } });
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Stores
export const getStores = () => api.get('/stores');
export const createStore = (data) => api.post('/stores', data);
export const updateStore = (id, data) => api.patch(`/stores/${id}`, data);
export const assignUserToStore = (data) => api.post('/stores/assign', data);

// Categories
export const getCategories = (storeId) => api.get('/categories', { params: { storeId } });
export const createCategory = (data) => api.post('/categories', data);

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data) => api.post('/suppliers', data);

// Purchases
export const getPurchases = (storeId) => api.get('/purchases', { params: { storeId } });
export const createPurchase = (data) => api.post('/purchases', data);

// Sales
export const getSales = (storeId) => api.get('/sales', { params: { storeId } });
export const createSale = (data) => api.post('/sales', data);
export const createBulkSales = (data) => api.post('/sales/bulk', data);

// Stock
export const adjustStock = (data) => api.post('/stock/adjust', data);
export const getStockMovements = (productId, storeId) => api.get(`/stock/movements/${productId}`, { params: { storeId } });

// Cash
export const getCashBalance = (storeId) => api.get('/cash/balance', { params: { storeId } });
export const getCashMovements = (params) => api.get('/cash/movements', { params });
export const createExpense = (data) => api.post('/cash/expenses', data);
export const getExpenses = (params) => api.get('/cash/expenses', { params });

// Reports
export const getDailyReport = (date, storeId) => api.get('/reports/daily', { params: { date, storeId } });
export const getJournalReport = (params) => api.get('/reports/journal', { params });
export const getStockValuation = (params) => api.get('/reports/stock-value', { params });
export const getStockHealth = (storeId) => api.get('/reports/stock-health', { params: { storeId } });
export const getGlobalCapital = (storeId) => api.get('/reports/global-capital', { params: { storeId } });

// Users & Auth
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const toggleUserStatus = (id) => api.patch(`/users/${id}/toggle`);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const payStaff = (data) => api.post('/system/pay-staff', data);
export const getRoles = () => api.get('/roles');
export const changePassword = (data) => api.post('/auth/change-password', data);

// System Initialization
export const initializeCash = (data) => api.post('/system/initialize-cash', data);
export const initializeStock = (data) => api.post('/system/initialize-stock', data);
// Equipment & Inventory
// Equipment & Inventory
export const getEquipmentCategories = (storeId) => api.get('/equipment/categories', { params: { storeId } });
export const createEquipmentCategory = (data) => api.post('/equipment/categories', data);
export const getEquipment = (storeId, categoryId) => api.get('/equipment', { params: { storeId, categoryId } });
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.patch(`/equipment/${id}`, data);

export const getInventories = (storeId) => api.get('/equipment/inventories', { params: { storeId } });
export const getInventory = (id) => api.get(`/equipment/inventories/${id}`);
export const startInventory = (data) => api.post('/equipment/inventories', data);
export const updateInventoryItem = (id, data) => api.patch(`/equipment/inventories/items/${id}`, data);
export const closeInventory = (id) => api.post(`/equipment/inventories/${id}/close`);

// Units
export const getUnits = () => api.get('/units');
export const createUnit = (data) => api.post('/units', data);
