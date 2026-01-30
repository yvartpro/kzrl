# Bar & Stock Management Dashboard

Modern, responsive React dashboard for the Bar & Stock Management System.

## 🎯 Features

- **Dashboard**: Real-time sales, profit, cash balance, and low stock alerts
- **Products & Stock**: View and manage inventory with stock status indicators
- **Point of Sale**: Fast, intuitive POS interface for processing sales
- **Purchases**: Record supplier purchases with automatic stock updates
- **Reports**: Daily sales/profit reports and stock valuation

## 🛠 Tech Stack

- React 18 with Vite
- Tailwind CSS v4
- React Router v7
- Lucide React (icons)
- Axios (API client)

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env` with your API URL:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
npm run dev
```

Dashboard will run on `http://localhost:5173`

## 📁 Project Structure

```
src/
├── api/
│   ├── client.js          # Axios instance with interceptors
│   └── services.js        # API service methods
├── components/
│   ├── StatCard.jsx       # Dashboard stat cards
│   ├── ErrorMessage.jsx   # Error display component
│   └── LoadingSpinner.jsx # Loading indicator
├── layouts/
│   └── DashboardLayout.jsx # Main layout with sidebar
├── pages/
│   ├── Dashboard.jsx      # Home dashboard
│   ├── Products.jsx       # Products & stock management
│   ├── Sales.jsx          # POS interface
│   ├── Purchases.jsx      # Purchase recording
│   └── Reports.jsx        # Reports view
├── utils/
│   └── format.js          # Formatting utilities
├── App.jsx                # Main app with routing
├── main.jsx               # Entry point
└── index.css              # Tailwind imports
```

## 🎨 Design Principles

- **Clean & Minimal**: Neutral colors with blue accents
- **Mobile-First**: Responsive design for all screen sizes
- **Fast**: Optimized for speed and performance
- **Accessible**: Semantic HTML and proper ARIA labels

## 📡 API Integration

All data is fetched from the backend API. No business logic duplication.

### API Endpoints Used

- `GET /api/products` - Product list with stock
- `POST /api/sales` - Create sale
- `POST /api/purchases` - Record purchase
- `GET /api/reports/daily` - Daily report
- `GET /api/reports/stock-value` - Stock valuation
- `GET /api/cash/balance` - Cash balance

## 🔐 Authentication

Token-based authentication is configured but not yet implemented. The API client includes:
- Request interceptor for adding auth tokens
- Response interceptor for handling 401 errors

To implement:
1. Create login page
2. Store token in localStorage on login
3. Add protected route wrapper

## 🚧 Future Enhancements

- [ ] User authentication & login
- [ ] Role-based UI (Admin/Cashier views)
- [ ] Product creation/editing forms
- [ ] Category management
- [ ] Supplier management
- [ ] Expense recording
- [ ] Cash movement history
- [ ] Print/PDF export for reports
- [ ] Real-time updates (WebSocket)
- [ ] Dark mode

## 📝 Notes

- The dashboard assumes the backend API is running on `http://localhost:3000`
- Vite proxy is configured to forward `/api` requests to the backend
- All currency is displayed in FBu (Burundi Francs)
- Stock status: OK (green), LOW (yellow), OUT (red)

## 🏗 Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## 📄 License

ISC
