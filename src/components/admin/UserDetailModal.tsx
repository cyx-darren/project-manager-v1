import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Briefcase } from 'lucide-react';
import { adminService, type AdminUser, type UserRole } from '../../services/adminService';

interface UserDetailModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadUserRoles();
    }
  }, [isOpen, user]);

  const loadUserRoles = async () => {
    try {
      setLoading(true);
      const roles = await adminService.getUserRoles(user.id);
      setUserRoles(roles);
    } catch (error) {
      console.error('Failed to load user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (roleId: string, newRole: string, contextType: 'workspace' | 'project', contextId: string) => {
    try {
      await adminService.updateUserRole(user.id, newRole, contextType, contextId);
      loadUserRoles();
      onUserUpdated();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="user-detail-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{user.email}</h2>
              <p className="text-sm text-gray-500">
                {user.email_confirmed_at ? 'Verified Account' : 'Unverified Account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(user.last_sign_in_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Confirmed</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(user.email_confirmed_at)}</p>
              </div>
            </div>
          </div>

          {/* Membership Summary */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">Workspaces</p>
                    <p className="text-2xl font-bold text-blue-600">{user.workspace_count}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Briefcase className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Projects</p>
                    <p className="text-2xl font-bold text-green-600">{user.project_count}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Roles and Permissions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Roles and Permissions</h3>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading roles...</p>
              </div>
            ) : userRoles.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No roles assigned</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userRoles.map((role) => (
                  <div
                    key={role.id}
                    className="border border-gray-200 rounded-lg p-4"
                    data-testid={`user-role-${role.context_type}-${role.context_id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${
                          role.context_type === 'workspace' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                                                     {role.context_type === 'workspace' ? (
                             <Users className="w-5 h-5 text-blue-600" />
                           ) : (
                             <Briefcase className="w-5 h-5 text-green-600" />
                           )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {role.context_name || `${role.context_type} ${role.context_id}`}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {role.context_type} • {role.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={role.role}
                          onChange={(e) => handleRoleUpdate(role.id, e.target.value, role.context_type, role.context_id)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          data-testid={`role-select-${role.id}`}
                        >
                          {role.context_type === 'workspace' ? (
                            <>
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                              <option value="billing_manager">Billing Manager</option>
                            </>
                          ) : (
                            <>
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Granted on {formatDate(role.granted_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            data-testid="cancel-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 