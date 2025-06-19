import { supabase } from '../config/supabase'

/**
 * Temporary utility to set user role and permissions for testing
 * This should only be used during development
 */
export const setUserAsAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No authenticated user found')
      return { success: false, error: 'No authenticated user' }
    }

    console.log('Current user:', user.email)
    
    // Update user metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        role: 'admin',
        permissions: ['manage_users', 'view_reports', 'edit_projects', 'delete_tasks']
      }
    })

    if (error) {
      console.error('Error updating user metadata:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ User metadata updated successfully!')
    console.log('Updated user data:', data.user?.user_metadata)
    
    // Refresh the session to get updated metadata
    const { error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.warn('Warning: Could not refresh session:', refreshError.message)
    } else {
      console.log('✅ Session refreshed with new metadata')
    }

    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * Set user as member (regular user)
 */
export const setUserAsMember = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No authenticated user found')
      return { success: false, error: 'No authenticated user' }
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        role: 'member',
        permissions: ['view_reports']
      }
    })

    if (error) {
      console.error('Error updating user metadata:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ User set as member!')
    console.log('Updated user data:', data.user?.user_metadata)
    
    // Refresh session
    await supabase.auth.refreshSession()
    
    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * Set user as guest (minimal permissions)
 */
export const setUserAsGuest = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No authenticated user found')
      return { success: false, error: 'No authenticated user' }
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        role: 'guest',
        permissions: []
      }
    })

    if (error) {
      console.error('Error updating user metadata:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ User set as guest!')
    console.log('Updated user data:', data.user?.user_metadata)
    
    // Refresh session
    await supabase.auth.refreshSession()
    
    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * Check current user metadata
 */
export const checkUserMetadata = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('No authenticated user found')
      return
    }

    console.log('📊 Current User Information:')
    console.log('Email:', user.email)
    console.log('User ID:', user.id)
    console.log('Metadata:', user.user_metadata)
    console.log('Role:', user.user_metadata?.role || 'No role set')
    console.log('Permissions:', user.user_metadata?.permissions || 'No permissions set')
    
    return user.user_metadata
  } catch (err) {
    console.error('Error checking user metadata:', err)
  }
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).adminSetup = {
    setUserAsAdmin,
    setUserAsMember,
    setUserAsGuest,
    checkUserMetadata
  }
  
  console.log('🔧 Admin setup utilities loaded! Available commands:')
  console.log('- window.adminSetup.setUserAsAdmin()')
  console.log('- window.adminSetup.setUserAsMember()')
  console.log('- window.adminSetup.setUserAsGuest()')
  console.log('- window.adminSetup.checkUserMetadata()')
} 