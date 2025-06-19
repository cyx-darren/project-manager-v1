import type { Session } from '@supabase/supabase-js'

/**
 * Secure Token Storage and Management Utility
 * Implements JWT security best practices for React applications
 */

// Constants for token management
const TOKEN_STORAGE_KEY = 'supabase.auth.token'
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiration
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // 1 second

/**
 * Enhanced secure token storage with encryption-like obfuscation
 * Note: This is basic obfuscation for localStorage. For production,
 * consider moving to httpOnly cookies or a more robust solution.
 */
class SecureTokenStorage {
  private static instance: SecureTokenStorage
  private encryptionKey: string

  private constructor() {
    // Generate a browser-specific key for basic obfuscation
    this.encryptionKey = this.generateBrowserKey()
  }

  public static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage()
    }
    return SecureTokenStorage.instance
  }

  /**
   * Generate a browser-specific key for basic token obfuscation
   */
  private generateBrowserKey(): string {
    const userAgent = navigator.userAgent
    const language = navigator.language
    const platform = navigator.platform
    return btoa(`${userAgent}${language}${platform}`).slice(0, 16)
  }

  /**
   * Simple XOR encryption for basic token obfuscation
   */
  private obfuscate(data: string): string {
    const key = this.encryptionKey
    let result = ''
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      )
    }
    return btoa(result)
  }

  /**
   * Decode obfuscated token data
   */
  private deobfuscate(data: string): string {
    try {
      const decoded = atob(data)
      const key = this.encryptionKey
      let result = ''
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }
      return result
    } catch (error) {
      console.error('Error deobfuscating token data:', error)
      return ''
    }
  }

  /**
   * Securely store session data
   */
  public storeSession(session: Session): void {
    try {
      const sessionData = {
        ...session,
        stored_at: Date.now(),
        browser_fingerprint: this.encryptionKey
      }
      
      const serialized = JSON.stringify(sessionData)
      const obfuscated = this.obfuscate(serialized)
      
      localStorage.setItem(TOKEN_STORAGE_KEY, obfuscated)
      console.log('✅ Session stored securely')
    } catch (error) {
      console.error('❌ Error storing session:', error)
    }
  }

  /**
   * Retrieve and validate stored session
   */
  public retrieveSession(): Session | null {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!stored) return null

      const deobfuscated = this.deobfuscate(stored)
      if (!deobfuscated) return null

      const sessionData = JSON.parse(deobfuscated)
      
      // Validate browser fingerprint
      if (sessionData.browser_fingerprint !== this.encryptionKey) {
        console.warn('⚠️ Session browser fingerprint mismatch, clearing token')
        this.clearSession()
        return null
      }

      // Remove our custom fields before returning
      const { stored_at, browser_fingerprint, ...session } = sessionData
      
      return this.validateSession(session as Session)
    } catch (error) {
      console.error('❌ Error retrieving session:', error)
      this.clearSession()
      return null
    }
  }

  /**
   * Validate session integrity and expiration
   */
  private validateSession(session: Session): Session | null {
    if (!session || !session.access_token || !session.expires_at) {
      console.warn('⚠️ Invalid session structure')
      return null
    }

    // Check if session is expired
    const expirationTime = session.expires_at * 1000 // Convert to milliseconds
    const now = Date.now()
    
    if (now >= expirationTime) {
      console.warn('⚠️ Session expired, clearing token')
      this.clearSession()
      return null
    }

    // Check if token needs refresh soon
    if (now >= (expirationTime - TOKEN_REFRESH_THRESHOLD)) {
      console.log('⏰ Session expires soon, refresh recommended')
    }

    return session
  }

  /**
   * Check if session needs refresh
   */
  public needsRefresh(session: Session | null): boolean {
    if (!session || !session.expires_at) return true
    
    const expirationTime = session.expires_at * 1000
    const now = Date.now()
    
    return now >= (expirationTime - TOKEN_REFRESH_THRESHOLD)
  }

  /**
   * Securely clear stored session
   */
  public clearSession(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      console.log('✅ Session cleared securely')
    } catch (error) {
      console.error('❌ Error clearing session:', error)
    }
  }

  /**
   * Clear all authentication-related data
   */
  public clearAllAuthData(): void {
    try {
      // Clear our token
      this.clearSession()
      
      // Clear any other Supabase auth data
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key)
        }
      })
      
      console.log('✅ All auth data cleared')
    } catch (error) {
      console.error('❌ Error clearing auth data:', error)
    }
  }
}

/**
 * Token refresh manager with retry logic and automatic scheduling
 */
export class TokenRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null
  private retryCount = 0
  private isRefreshing = false

  /**
   * Schedule automatic token refresh
   */
  public scheduleRefresh(session: Session | null, refreshCallback: () => Promise<void>): void {
    // Clear existing timer
    this.clearRefreshTimer()

    if (!session || !session.expires_at) return

    const expirationTime = session.expires_at * 1000
    const now = Date.now()
    const timeUntilRefresh = expirationTime - now - TOKEN_REFRESH_THRESHOLD

    if (timeUntilRefresh > 0) {
      console.log(`⏰ Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`)
      
      this.refreshTimer = setTimeout(async () => {
        await this.performRefreshWithRetry(refreshCallback)
      }, timeUntilRefresh)
    } else {
      // Needs immediate refresh
      console.log('🔄 Token needs immediate refresh')
      this.performRefreshWithRetry(refreshCallback)
    }
  }

  /**
   * Perform token refresh with retry logic
   */
  private async performRefreshWithRetry(refreshCallback: () => Promise<void>): Promise<void> {
    if (this.isRefreshing) {
      console.log('🔄 Refresh already in progress, skipping')
      return
    }

    this.isRefreshing = true

    try {
      await refreshCallback()
      this.retryCount = 0 // Reset on success
      console.log('✅ Token refresh successful')
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      
      if (this.retryCount < MAX_RETRY_ATTEMPTS) {
        this.retryCount++
        console.log(`🔄 Retrying token refresh (${this.retryCount}/${MAX_RETRY_ATTEMPTS})`)
        
        setTimeout(() => {
          this.performRefreshWithRetry(refreshCallback)
        }, RETRY_DELAY * this.retryCount) // Exponential backoff
      } else {
        console.error('❌ Max refresh retries exceeded, clearing session')
        SecureTokenStorage.getInstance().clearAllAuthData()
        // Optionally redirect to login
        window.location.href = '/login'
      }
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Clear refresh timer
   */
  public clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * Manual refresh trigger
   */
  public async triggerRefresh(refreshCallback: () => Promise<void>): Promise<void> {
    await this.performRefreshWithRetry(refreshCallback)
  }
}

/**
 * Content Security Policy utilities
 */
export const CSPUtils = {
  /**
   * Generate CSP header for enhanced security
   */
  generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: *.supabase.co",
      "connect-src 'self' *.supabase.co",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  },

  /**
   * Apply CSP via meta tag (for client-side applications)
   */
  applyCSSClientSide(): void {
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (existingMeta) return

    const meta = document.createElement('meta')
    meta.httpEquiv = 'Content-Security-Policy'
    meta.content = this.generateCSPHeader()
    document.head.appendChild(meta)
    console.log('✅ CSP applied client-side')
  }
}

// Export singleton instance
export const secureTokenStorage = SecureTokenStorage.getInstance()
export const tokenRefreshManager = new TokenRefreshManager()

// Export utility functions
export const tokenUtils = {
  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: string): string {
    const div = document.createElement('div')
    div.textContent = input
    return div.innerHTML
  },

  /**
   * Validate JWT token format (basic structure check)
   */
  isValidJWTFormat(token: string): boolean {
    const parts = token.split('.')
    return parts.length === 3 && parts.every(part => part.length > 0)
  },

  /**
   * Extract JWT payload (without verification)
   */
  extractJWTPayload(token: string): any {
    try {
      if (!this.isValidJWTFormat(token)) return null
      
      const payload = token.split('.')[1]
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Error extracting JWT payload:', error)
      return null
    }
  }
} 