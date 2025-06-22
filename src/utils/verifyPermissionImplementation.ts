// Permission Implementation Verification Script
import { permissionService } from '../services/permissionService';
import type { 
  Permission, 
  ProjectRole, 
  PermissionContext
} from '../types/permissions';
import { 
  PROJECT_ROLE_PERMISSIONS,
  hasRolePermission
} from '../types/permissions';
import { 
  usePermission, 
  useProjectRole, 
  useUserPermissions 
} from '../hooks/usePermissions';

export const verifyPermissionImplementation = () => {
  const results = {
    servicesImported: false,
    typesImported: false,
    hooksImported: false,
    permissionServiceMethods: false,
    rolePermissionMappings: false,
    errors: [] as string[]
  };

  try {
    // Test service imports
    if (permissionService && 
        typeof permissionService.hasPermission === 'function' &&
        typeof permissionService.getUserProjectRole === 'function' &&
        typeof permissionService.hasAllPermissions === 'function') {
      results.servicesImported = true;
    } else {
      results.errors.push('Permission service methods not properly imported');
    }

    // Test type imports
    if (PROJECT_ROLE_PERMISSIONS && 
        typeof hasRolePermission === 'function') {
      results.typesImported = true;
    } else {
      results.errors.push('Permission types not properly imported');
    }

    // Test hook imports (these are functions, so just check they exist)
    if (typeof usePermission === 'function' &&
        typeof useProjectRole === 'function' &&
        typeof useUserPermissions === 'function') {
      results.hooksImported = true;
    } else {
      results.errors.push('Permission hooks not properly imported');
    }

    // Test permission service methods exist
    const serviceMethods = [
      'hasPermission',
      'hasAllPermissions', 
      'getUserProjectRole',
      'getPermissionSummary',
      'clearCache'
    ];
    
    const missingMethods = serviceMethods.filter(method => 
      typeof (permissionService as any)[method] !== 'function'
    );
    
    if (missingMethods.length === 0) {
      results.permissionServiceMethods = true;
    } else {
      results.errors.push(`Missing service methods: ${missingMethods.join(', ')}`);
    }

    // Test role permission mappings
    const roles: ProjectRole[] = ['owner', 'admin', 'member', 'viewer'];
    const hasAllRoles = roles.every(role => PROJECT_ROLE_PERMISSIONS[role]);
    
    if (hasAllRoles) {
      results.rolePermissionMappings = true;
    } else {
      results.errors.push('Role permission mappings incomplete');
    }

  } catch (error) {
    results.errors.push(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
};

// Console logging function for easy testing
export const logPermissionVerification = () => {
  const results = verifyPermissionImplementation();
  
  console.log('🔐 Permission Implementation Verification Results:');
  console.log('================================================');
  console.log(`✅ Services Imported: ${results.servicesImported ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Types Imported: ${results.typesImported ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Hooks Imported: ${results.hooksImported ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Service Methods: ${results.permissionServiceMethods ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Role Mappings: ${results.rolePermissionMappings ? 'PASS' : 'FAIL'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('\n🎉 All permission components successfully implemented!');
  }
  
  return results;
}; 