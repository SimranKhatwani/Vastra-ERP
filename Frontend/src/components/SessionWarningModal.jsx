import React from 'react';

const SessionWarningModal = ({ onStayLoggedIn, onLogout }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 opacity-100">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Session Expiring</h3>
        <p className="text-center text-gray-600 mb-6">
          Your session will expire in 1 minute due to inactivity. You will be automatically logged out after 30 minutes of inactivity.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onStayLoggedIn}
            className="flex-1 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition duration-200"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
