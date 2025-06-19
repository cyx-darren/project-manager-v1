import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const stats = [
    {
      name: 'Total Tasks',
      value: '127',
      change: '+12%',
      changeType: 'increase',
      icon: ChartBarIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Completed Today',
      value: '8',
      change: '+2',
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      name: 'In Progress',
      value: '23',
      change: '-3',
      changeType: 'decrease',
      icon: ClockIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Overdue',
      value: '4',
      change: '+1',
      changeType: 'increase',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500'
    },
  ];

  const recentTasks = [
    {
      id: 1,
      title: 'Design new landing page',
      project: 'Website Redesign',
      priority: 'High',
      dueDate: '2024-01-15',
      status: 'In Progress',
      assignee: 'Sarah Chen'
    },
    {
      id: 2,
      title: 'Review user feedback',
      project: 'Mobile App',
      priority: 'Medium',
      dueDate: '2024-01-16',
      status: 'Pending',
      assignee: 'Mike Johnson'
    },
    {
      id: 3,
      title: 'Update documentation',
      project: 'API Development',
      priority: 'Low',
      dueDate: '2024-01-18',
      status: 'In Progress',
      assignee: 'Alex Kim'
    },
    {
      id: 4,
      title: 'Test payment integration',
      project: 'E-commerce',
      priority: 'High',
      dueDate: '2024-01-14',
      status: 'Overdue',
      assignee: 'Emma Davis'
    },
  ];

  const quickActions = [
    { name: 'Create Task', icon: PlusIcon, color: 'bg-blue-500' },
    { name: 'New Project', icon: PlusIcon, color: 'bg-green-500' },
    { name: 'Add Team Member', icon: PlusIcon, color: 'bg-purple-500' },
    { name: 'Generate Report', icon: ChartBarIcon, color: 'bg-orange-500' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'In Progress': return 'text-blue-600 bg-blue-50';
      case 'Pending': return 'text-gray-600 bg-gray-50';
      case 'Overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your projects today.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
              <button className="text-sm text-primary-600 hover:text-primary-500 font-medium flex items-center">
                View all
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{task.project}</span>
                      <span>•</span>
                      <span>Due {task.dueDate}</span>
                      <span>•</span>
                      <span>{task.assignee}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">{action.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Progress */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">Website Redesign</span>
                  <span className="text-gray-500">75%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">Mobile App</span>
                  <span className="text-gray-500">45%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">Marketing Campaign</span>
                  <span className="text-gray-500">90%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 