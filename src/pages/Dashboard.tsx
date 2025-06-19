import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderIcon, 
  CalendarIcon, 
  ChartBarIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalProjects: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalProjects: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for now - will be replaced with real Supabase data later
      setStats({
        totalTasks: 24,
        completedTasks: 18,
        inProgressTasks: 4,
        overdueTasks: 2,
        totalProjects: 3
      });
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      name: 'Total Tasks',
      value: stats.totalTasks,
      icon: FolderIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'In Progress',
      value: stats.inProgressTasks,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      name: 'Overdue',
      value: stats.overdueTasks,
      icon: ExclamationCircleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const quickActions = [
    {
      name: 'Create Task',
      description: 'Add a new task to your projects',
      href: '/tasks',
      icon: PlusIcon,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'View Calendar',
      description: 'See tasks in calendar view',
      href: '/calendar',
      icon: CalendarIcon,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'View Reports',
      description: 'Check project progress',
      href: '/reports',
      icon: ChartBarIcon,
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your projects today.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/tasks"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Task
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className={`text-2xl font-semibold ${stat.textColor}`}>
                {stat.value}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div>
                  <span className={`rounded-lg inline-flex p-3 text-white ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {action.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="text-center py-8">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first task or project.
            </p>
            <div className="mt-6">
              <Link
                to="/tasks"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Task
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 