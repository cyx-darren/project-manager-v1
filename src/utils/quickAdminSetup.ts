import { supabase } from '../config/supabase'

/**
 * Quick and simple admin setup for testing Task 3.3
 * Use this in the browser console to set user roles
 */

// Simple function to set admin role
export const makeAdmin = async () => {
  console.log('🔧 Setting user as admin...')
  
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        role: 'admin',
        permissions: ['manage_users', 'view_reports', 'edit_projects', 'delete_tasks']
      }
    })

    if (error) {
      console.error('❌ Error:', error.message)
      return false
    }

    console.log('✅ Admin role set successfully!')
    console.log('📝 Role: admin')
    console.log('📝 Permissions:', ['manage_users', 'view_reports', 'edit_projects', 'delete_tasks'])
    
    // Refresh session
    await supabase.auth.refreshSession()
    console.log('🔄 Session refreshed')
    
    console.log('➡️ Now refresh the page and visit /auth-demo to test!')
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

// Simple function to set member role
export const makeMember = async () => {
  console.log('🔧 Setting user as member...')
  
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        role: 'member',
        permissions: ['view_reports']
      }
    })

    if (error) {
      console.error('❌ Error:', error.message)
      return false
    }

    console.log('✅ Member role set successfully!')
    console.log('📝 Role: member')
    console.log('📝 Permissions:', ['view_reports'])
    
    await supabase.auth.refreshSession()
    console.log('🔄 Session refreshed')
    console.log('➡️ Now refresh the page and visit /auth-demo to test!')
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

// Simple function to set guest role
export const makeGuest = async () => {
  console.log('🔧 Setting user as guest...')
  
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        role: 'guest',
        permissions: []
      }
    })

    if (error) {
      console.error('❌ Error:', error.message)
      return false
    }

    console.log('✅ Guest role set successfully!')
    console.log('📝 Role: guest')
    console.log('📝 Permissions: none')
    
    await supabase.auth.refreshSession()
    console.log('🔄 Session refreshed')
    console.log('➡️ Now refresh the page and visit /auth-demo to test!')
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

// Check current user info
export const checkUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No user logged in')
      return
    }

    console.log('👤 Current User Info:')
    console.log('📧 Email:', user.email)
    console.log('🆔 ID:', user.id)
    console.log('🏷️ Role:', user.user_metadata?.role || 'No role set')
    console.log('🔑 Permissions:', user.user_metadata?.permissions || 'No permissions set')
    
    return user.user_metadata
  } catch (err) {
    console.error('❌ Error checking user:', err)
  }
}

// Make functions available globally
declare global {
  interface Window {
    makeAdmin: () => Promise<boolean>
    makeMember: () => Promise<boolean>
    makeGuest: () => Promise<boolean>
    checkUser: () => Promise<any>
  }
}

window.makeAdmin = makeAdmin
window.makeMember = makeMember
window.makeGuest = makeGuest
window.checkUser = checkUser

console.log('🎯 Quick Admin Setup Loaded!')
console.log('📋 Available commands:')
console.log('   makeAdmin()   - Set current user as admin')
console.log('   makeMember()  - Set current user as member') 
console.log('   makeGuest()   - Set current user as guest')
console.log('   checkUser()   - Check current user info')
console.log('')
console.log('💡 Usage: Just type makeAdmin() in the console!') 