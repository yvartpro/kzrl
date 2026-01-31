import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStores } from '../api/services';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await getStores();
      setStores(res.data);

      // Select first store by default if none selected
      const savedStoreId = localStorage.getItem('currentStoreId');
      if (savedStoreId && res.data.find(s => s.id === savedStoreId)) {
        setCurrentStore(res.data.find(s => s.id === savedStoreId));
      } else if (res.data.length > 0) {
        setCurrentStore(res.data[0]);
        localStorage.setItem('currentStoreId', res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeStore = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setCurrentStore(store);
      localStorage.setItem('currentStoreId', storeId);
      // Optional: window.location.reload() or let components listen to context change
    }
  };

  return (
    <StoreContext.Provider value={{ stores, currentStore, changeStore, loading, refreshStores: fetchStores }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
