// French translations for the Bar & Stock Management System

export const fr = {
  // Navigation
  nav: {
    dashboard: 'Tableau de Bord',
    products: 'Produits',
    purchases: 'Achats',
    sales: 'Ventes',
    cashExpenses: 'Caisse & Dépenses',
    reports: 'Rapports',
    settings: 'Paramètres',
  },

  // Common
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    print: 'Imprimer',
    total: 'Total',
    actions: 'Actions',
    date: 'Date',
    description: 'Description',
    amount: 'Montant',
    quantity: 'Quantité',
    price: 'Prix',
    status: 'Statut',
    name: 'Nom',
    category: 'Catégorie',
    supplier: 'Fournisseur',
  },

  // Dashboard
  dashboard: {
    title: 'Tableau de Bord',
    subtitle: 'Vue d\'ensemble de vos opérations',
    todaySales: 'Ventes du Jour',
    todayProfit: 'Bénéfice du Jour',
    cashBalance: 'Solde Caisse',
    lowStock: 'Stock Faible',
    stockHealth: 'Santé du Stock',
    todaySalesTable: 'Ventes d\'Aujourd\'hui',
    lowStockAlerts: 'Alertes Stock Faible',
  },

  // Products
  products: {
    title: 'Produits',
    subtitle: 'Gérer votre inventaire de produits',
    addProduct: 'Ajouter un Produit',
    editProduct: 'Modifier le Produit',
    deleteProduct: 'Supprimer le Produit',
    productName: 'Nom du Produit',
    unitCost: 'Prix de Revient',
    sellingPrice: 'Prix de Vente',
    stock: 'Stock',
    margin: 'Marge',
    boxQuantity: 'Quantité par Carton',
    unitsPerBox: 'Unités par Carton',
    adjust: 'Ajuster',
    stockMovement: 'Mouvement de Stock',
    inStock: 'En Stock',
    lowStock: 'Stock Faible',
    outOfStock: 'Rupture de Stock',
  },

  // Sales
  sales: {
    title: 'Ventes',
    subtitle: 'Point de vente et historique',
    realTimePOS: 'POS Temps Réel',
    bulkEntry: 'Saisie Groupée',
    addToCart: 'Ajouter au Panier',
    cart: 'Panier',
    paymentMethod: 'Mode de Paiement',
    cash: 'Espèces',
    mobileMoney: 'Mobile Money',
    completeSale: 'Finaliser la Vente',
    saleCompleted: 'Vente finalisée avec succès',
    salesHistory: 'Historique des Ventes',
  },

  // Purchases
  purchases: {
    title: 'Achats',
    subtitle: 'Enregistrer les achats auprès des fournisseurs',
    recordPurchase: 'Enregistrer un Achat',
    selectSupplier: 'Sélectionner un Fournisseur',
    selectProduct: 'Sélectionner un Produit',
    boxes: 'Cartons',
    pricePerBox: 'Prix par Carton',
    purchaseHistory: 'Historique des Achats',
  },

  // Cash & Expenses
  cash: {
    title: 'Caisse & Dépenses',
    subtitle: 'Gestion de la caisse et des dépenses',
    currentBalance: 'Solde Actuel',
    recordExpense: 'Enregistrer une Dépense',
    expenseDescription: 'Description de la Dépense',
    expenseAmount: 'Montant de la Dépense',
    expenses: 'Dépenses',
    cashMovements: 'Mouvements de Caisse',
    income: 'Entrées',
    outgoing: 'Sorties',
    balance: 'Solde',
    debit: 'Débit',
    credit: 'Crédit',
  },

  // Reports
  reports: {
    title: 'Rapports Financiers',
    subtitle: 'Journal comptable et résumés quotidiens',
    generalJournal: 'Journal Général',
    stockValuation: 'Valorisation du Stock',
    dailyReport: 'Rapport Quotidien',
    selectDate: 'Sélectionner une Date',
    reference: 'Référence',
    stockValue: 'Valeur du Stock',
    potentialRevenue: 'Revenu Potentiel',
    expectedProfit: 'Bénéfice Attendu',
    noTransactions: 'Aucune transaction enregistrée pour cette date',
  },

  // Settings
  settings: {
    title: 'Paramètres',
    subtitle: 'Gérer les catégories et fournisseurs',
    categories: 'Catégories',
    suppliers: 'Fournisseurs',
    addCategory: 'Ajouter une Catégorie',
    addSupplier: 'Ajouter un Fournisseur',
    categoryName: 'Nom de la Catégorie',
    supplierName: 'Nom du Fournisseur',
    contact: 'Contact',
    address: 'Adresse',
  },

  // Messages
  messages: {
    productCreated: 'Produit créé avec succès',
    productUpdated: 'Produit mis à jour avec succès',
    productDeleted: 'Produit supprimé avec succès',
    stockAdjusted: 'Stock ajusté avec succès',
    expenseRecorded: 'Dépense enregistrée avec succès',
    purchaseRecorded: 'Achat enregistré avec succès',
    saleCompleted: 'Vente finalisée avec succès',
    error: 'Une erreur s\'est produite',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  },

  // Stock Status
  stockStatus: {
    ok: 'OK',
    low: 'Faible',
    out: 'Rupture',
  },

  // Payment Methods
  paymentMethods: {
    CASH: 'Espèces',
    MOBILE_MONEY: 'Mobile Money',
    CARD: 'Carte',
  },
};

export default fr;
