export default function Dashboard() {
  const stats = [
    { name: 'Total Projects', value: '12', change: '+2.1%', changeType: 'positive' },
    { name: 'Active Tasks', value: '35', change: '+4.5%', changeType: 'positive' },
    { name: 'Completed Tasks', value: '128', change: '+12.3%', changeType: 'positive' },
    { name: 'Team Members', value: '8', change: '0%', changeType: 'neutral' },
  ];

  const recentTasks = [
    { title: 'Update homepage design', project: 'Website Redesign', status: 'In Progress', assignee: 'JD' },
    { title: 'Fix login authentication bug', project: 'Mobile App', status: 'Review', assignee: 'SM' },
    { title: 'Create marketing materials', project: 'Marketing Campaign', status: 'To Do', assignee: 'KL' },
    { title: 'Setup deployment pipeline', project: 'Product Launch', status: 'In Progress', assignee: 'MR' },
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'In Progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Review':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'To Do':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'Done':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
            <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.project}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={getStatusBadge(task.status)}>{task.status}</span>
                  <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{task.assignee}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200">
              <div className="flex-shrink-0 h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">➕</span>
              </div>
              <div className="ml-3 text-left">
                <p className="text-sm font-medium text-gray-900">Create New Task</p>
                <p className="text-xs text-gray-500">Add a task to any project</p>
              </div>
            </button>
            
            <button className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
              <div className="flex-shrink-0 h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📁</span>
              </div>
              <div className="ml-3 text-left">
                <p className="text-sm font-medium text-gray-900">New Project</p>
                <p className="text-xs text-gray-500">Start a new project</p>
              </div>
            </button>
            
            <button className="w-full flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200">
              <div className="flex-shrink-0 h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">👥</span>
              </div>
              <div className="ml-3 text-left">
                <p className="text-sm font-medium text-gray-900">Invite Team Member</p>
                <p className="text-xs text-gray-500">Add someone to your team</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 