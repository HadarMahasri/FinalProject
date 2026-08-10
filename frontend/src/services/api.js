const API_BASE_URL = '/api';

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('eventhub_token');
  
  const headers = {
    ...options.headers
  };

  // If body is not FormData, default to application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'אירעה שגיאה בתקשורת מול השרת');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth API
  register: (userData) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getProfile: () => fetchAPI('/auth/me'),

  // Vendors API
  getVendors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/vendors${query ? `?${query}` : ''}`);
  },
  getVendorById: (id) => fetchAPI(`/vendors/${id}`),
  updateVendorProfile: (profileData) => fetchAPI('/vendors/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  uploadMedia: (formData) => fetchAPI('/vendors/upload', { method: 'POST', body: formData }),

  // Events & Bookings API
  createEvent: (eventData) => fetchAPI('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, eventData) => fetchAPI(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
  deleteEvent: (id) => fetchAPI(`/events/${id}`, { method: 'DELETE' }),
  getCustomerEvents: () => fetchAPI('/events/my-events'),
  createBooking: (bookingData) => fetchAPI('/events/book', { method: 'POST', body: JSON.stringify(bookingData) }),
  getVendorBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/events/vendor-bookings${query ? `?${query}` : ''}`);
  },
  getCustomerBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/events/customer-bookings${query ? `?${query}` : ''}`);
  },
  updateBookingStatus: (bookingId, status) => fetchAPI(`/events/booking/${bookingId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Reviews API
  addReview: (reviewData) => fetchAPI('/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),
  createReview: (reviewData) => fetchAPI('/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),
  getVendorReviews: (vendorId) => fetchAPI(`/reviews/vendor/${vendorId}`),

  // AI Assistant API
  getAIPlan: (planParams) => fetchAPI('/ai/plan', { method: 'POST', body: JSON.stringify(planParams) }),
  askAI: (prompt) => fetchAPI('/ai/ask', { method: 'POST', body: JSON.stringify({ prompt }) }),

  // Messages & Real-Time Chat API
  sendMessage: (msgData) => fetchAPI('/messages', { method: 'POST', body: JSON.stringify(msgData) }),
  getConversation: (otherUserId) => fetchAPI(`/messages/${otherUserId}`),
  getConversationsList: () => fetchAPI('/messages/conversations'),
  getUnreadCount: () => fetchAPI('/messages/unread-count'),

  // Event Tasks API
  getEventTasks: (eventId) => fetchAPI(`/tasks/event/${eventId}`),
  createTask: (taskData) => fetchAPI('/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
  toggleTask: (taskId, is_completed) => fetchAPI(`/tasks/${taskId}/toggle`, { method: 'PUT', body: JSON.stringify({ is_completed }) }),
  deleteTask: (taskId) => fetchAPI(`/tasks/${taskId}`, { method: 'DELETE' })
};
