import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Page not found</h2>
          <p className="mt-2 text-base text-gray-500">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 