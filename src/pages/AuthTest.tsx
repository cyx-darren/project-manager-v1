import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';

export const AuthTest: React.FC = () => {
  const [activeForm, setActiveForm] = useState<'login' | 'signup'>('login');

  const handleSuccess = () => {
    console.log('Form submitted successfully!');
  };

  const handleError = (error: string) => {
    console.error('Form error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Authentication Forms Test
          </h1>
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setActiveForm('login')}
              className={`px-4 py-2 rounded-md ${
                activeForm === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Login Form
            </button>
            <button
              onClick={() => setActiveForm('signup')}
              className={`px-4 py-2 rounded-md ${
                activeForm === 'signup'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Signup Form
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          {activeForm === 'login' ? (
            <LoginForm onSuccess={handleSuccess} onError={handleError} />
          ) : (
            <SignupForm onSuccess={handleSuccess} onError={handleError} />
          )}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Testing Notes:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Login form validates email format and minimum password length (8 characters)</li>
            <li>• Signup form requires password confirmation and complex password (uppercase, lowercase, number)</li>
            <li>• Both forms show loading states and handle errors properly</li>
            <li>• Forms are fully accessible with proper ARIA labels and error announcements</li>
            <li>• Check browser console for success/error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 