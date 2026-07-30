// Frontend/src/utils/apiInterceptor.js

export const setupFetchInterceptor = (logoutCallback) => {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    let [resource, config] = args;
    
    // Ensure credentials are included for API calls to backend
    if (typeof resource === 'string' && resource.includes(import.meta.env.VITE_API_URL)) {
      config = config || {};
      config.credentials = 'include';
    }

    try {
      const response = await originalFetch(resource, config);
      
      // Global 401 handler
      if (response.status === 401) {
        if (logoutCallback) {
          logoutCallback('Token Expired');
        } else {
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace('/login');
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
};
