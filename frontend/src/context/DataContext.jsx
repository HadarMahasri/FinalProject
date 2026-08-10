import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  // Multi-Key Cache Map Refs for instant memory retrieval
  const vendorsCacheMapRef = useRef({});
  const singleVendorCacheMapRef = useRef({});
  const customerBookingsCacheMapRef = useRef({});
  const vendorBookingsCacheMapRef = useRef({});

  const [customerEventsCache, setCustomerEventsCache] = useState(null);

  const clearUserCaches = useCallback(() => {
    if (!user?.id) return;

    console.log('user changed → clearing bookings and events caches');
    customerBookingsCacheMapRef.current = {};
    vendorBookingsCacheMapRef.current = {};
    setCustomerEventsCache(null);
  }, [user?.id]);

  // Cleanup on user change
  useEffect(() => {
    clearUserCaches();
  }, [user?.id, clearUserCaches]);

  // 1. Get Vendors List with Multi-Key In-Memory Cache Dictionary
  const getVendorsCached = useCallback(async (params = {}, forceRefresh = false) => {
    const cacheKey = JSON.stringify(params);
    if (!forceRefresh && vendorsCacheMapRef.current[cacheKey]) {
      return vendorsCacheMapRef.current[cacheKey];
    }

    const res = await api.getVendors(params);
    vendorsCacheMapRef.current[cacheKey] = res;
    return res;
  }, []);

  // 2. Get Single Vendor Details by ID with In-Memory Cache
  const getVendorByIdCached = useCallback(async (vendorId, forceRefresh = false) => {
    if (!forceRefresh && singleVendorCacheMapRef.current[vendorId]) {
      return singleVendorCacheMapRef.current[vendorId];
    }

    const data = await api.getVendorById(vendorId);
    singleVendorCacheMapRef.current[vendorId] = data;
    return data;
  }, []);

  // Update a single vendor's fields in memory across all cached catalog queries
  const updateVendorInCache = useCallback((vendorId, updatedFields) => {
    if (singleVendorCacheMapRef.current[vendorId]) {
      singleVendorCacheMapRef.current[vendorId] = {
        ...singleVendorCacheMapRef.current[vendorId],
        ...updatedFields
      };
    }

    Object.keys(vendorsCacheMapRef.current).forEach(key => {
      const cached = vendorsCacheMapRef.current[key];
      if (cached && cached.vendors) {
        cached.vendors = cached.vendors.map(v =>
          Number(v.id) === Number(vendorId)
            ? { ...v, ...updatedFields }
            : v
        );
      }
    });
  }, []);

  // 3. Get Customer Events with In-Memory Cache
  const getCustomerEventsCached = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && customerEventsCache !== null) {
      return customerEventsCache;
    }

    const events = await api.getCustomerEvents();
    const data = events || [];
    setCustomerEventsCache(data);
    return data;
  }, [customerEventsCache]);

  // In-Memory Events Sync (Add, Update, Delete)
  const addEventToCache = useCallback((newEvent) => {
    setCustomerEventsCache(prev => [newEvent, ...(prev || [])]);
  }, []);

  const updateEventInCache = useCallback((eventId, updatedFields) => {
    setCustomerEventsCache(prev =>
      (prev || []).map(ev => Number(ev.id) === Number(eventId) ? { ...ev, ...updatedFields } : ev)
    );
  }, []);

  const removeEventFromCache = useCallback((eventId) => {
    setCustomerEventsCache(prev =>
      (prev || []).filter(ev => Number(ev.id) !== Number(eventId))
    );
  }, []);

  // 4. Get Customer Bookings with Multi-Key In-Memory Cache Dictionary
  const getCustomerBookingsCached = useCallback(async (params = {}, forceRefresh = false) => {
    const cacheKey = JSON.stringify(params);
    if (!forceRefresh && customerBookingsCacheMapRef.current[cacheKey]) {
      return customerBookingsCacheMapRef.current[cacheKey];
    }

    const res = await api.getCustomerBookings(params);
    customerBookingsCacheMapRef.current[cacheKey] = res;
    return res;
  }, []);

  // 5. Get Vendor Bookings with Multi-Key In-Memory Cache Dictionary
  const getVendorBookingsCached = useCallback(async (params = {}, forceRefresh = false) => {
    const cacheKey = JSON.stringify(params);
    if (!forceRefresh && vendorBookingsCacheMapRef.current[cacheKey]) {
      return vendorBookingsCacheMapRef.current[cacheKey];
    }

    const res = await api.getVendorBookings(params);
    vendorBookingsCacheMapRef.current[cacheKey] = res;
    return res;
  }, []);

  // In-Memory Bookings Sync
  const updateBookingStatusInCache = useCallback((bookingId, newStatus) => {
    Object.keys(customerBookingsCacheMapRef.current).forEach(key => {
      const cached = customerBookingsCacheMapRef.current[key];
      if (cached && cached.bookings) {
        cached.bookings = cached.bookings.map(b =>
          Number(b.id) === Number(bookingId) ? { ...b, status: newStatus } : b
        );
      }
    });

    Object.keys(vendorBookingsCacheMapRef.current).forEach(key => {
      const cached = vendorBookingsCacheMapRef.current[key];
      if (cached && cached.bookings) {
        cached.bookings = cached.bookings.map(b =>
          Number(b.id) === Number(bookingId) ? { ...b, status: newStatus } : b
        );
      }
    });
  }, []);

  const addBookingToCache = useCallback((newBooking) => {
    Object.keys(customerBookingsCacheMapRef.current).forEach(key => {
      const cached = customerBookingsCacheMapRef.current[key];
      if (cached && cached.bookings) {
        cached.bookings = [newBooking, ...cached.bookings];
      }
    });
  }, []);

  return (
    <DataContext.Provider value={{
      getVendorsCached,
      getVendorByIdCached,
      updateVendorInCache,
      getCustomerEventsCached,
      addEventToCache,
      updateEventInCache,
      removeEventFromCache,
      getCustomerBookingsCached,
      getVendorBookingsCached,
      updateBookingStatusInCache,
      addBookingToCache,
      clearUserCaches
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
