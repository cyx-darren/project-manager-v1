// =====================================================
// EMERGENCY FIX UTILITIES
// =====================================================
// Utilities to help recover from infinite recursion issues

/**
 * Clear all browser storage and reload the application
 */
export function emergencyReset(): void {
  console.warn('🚨 EMERGENCY RESET: Clearing all browser storage')
  
  try {
    // Clear localStorage
    localStorage.clear()
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Clear IndexedDB (if any)
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
          }
        })
      })
    }
    
    // Clear service worker cache (if any)
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
    
    console.log('✅ Browser storage cleared')
    
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error('Error during emergency reset:', error)
    // Force reload even if clearing failed
    window.location.reload()
  }
}

/**
 * Check if we're in an infinite loop situation
 */
export function detectInfiniteLoop(): boolean {
  const storageKey = 'emergency_request_count'
  const timeKey = 'emergency_last_reset'
  const maxRequests = 50
  const resetInterval = 10000 // 10 seconds
  
  const now = Date.now()
  const lastReset = parseInt(localStorage.getItem(timeKey) || '0')
  const currentCount = parseInt(localStorage.getItem(storageKey) || '0')
  
  // Reset counter if enough time has passed
  if (now - lastReset > resetInterval) {
    localStorage.setItem(storageKey, '1')
    localStorage.setItem(timeKey, now.toString())
    return false
  }
  
  // Increment counter
  const newCount = currentCount + 1
  localStorage.setItem(storageKey, newCount.toString())
  
  // Check if we've exceeded the limit
  if (newCount > maxRequests) {
    console.error('🚨 INFINITE LOOP DETECTED: Too many requests in short period')
    return true
  }
  
  return false
}

/**
 * Emergency notification to user
 */
export function showEmergencyNotification(): void {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 15px;
    border-radius: 8px;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: system-ui, -apple-system, sans-serif;
  `
  
  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">
      🚨 System Recovery Mode
    </div>
    <div style="font-size: 14px; margin-bottom: 10px;">
      Infinite loop detected. Permissions system temporarily disabled.
    </div>
    <button onclick="this.parentElement.remove()" style="
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    ">
      Dismiss
    </button>
  `
  
  document.body.appendChild(notification)
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 10000)
}

/**
 * Add emergency reset button to the page
 */
export function addEmergencyResetButton(): void {
  // Check if button already exists
  if (document.getElementById('emergency-reset-btn')) {
    return
  }
  
  const button = document.createElement('button')
  button.id = 'emergency-reset-btn'
  button.innerHTML = '🚨 Emergency Reset'
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 6px;
    cursor: pointer;
    z-index: 10000;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `
  
  button.onclick = () => {
    if (confirm('This will clear all browser data and reload the app. Continue?')) {
      emergencyReset()
    }
  }
  
  document.body.appendChild(button)
}

// Auto-run emergency detection on import
if (typeof window !== 'undefined') {
  // Check for infinite loop on page load
  if (detectInfiniteLoop()) {
    showEmergencyNotification()
    addEmergencyResetButton()
  }
} 