import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
  blue: 'bg-blue-500 text-blue-600 bg-blue-50',
  green: 'bg-green-500 text-green-600 bg-green-50',
  purple: 'bg-purple-500 text-purple-600 bg-purple-50',
  orange: 'bg-orange-500 text-orange-600 bg-orange-50'
};

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClass = colorClasses[color];
  const [bgColor, textColor, cardBg] = colorClass.split(' ');

  return (
    <div className={`${cardBg} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}; 