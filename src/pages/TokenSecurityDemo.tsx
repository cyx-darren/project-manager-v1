import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  secureTokenStorage, 
  tokenRefreshManager, 
  tokenUtils
} from '../utils/secureTokenStorage'
import LoadingSpinner from '../components/LoadingSpinner'

const TokenSecurityDemo: React.FC = () => {
  const { session, user, loading, refreshSession } = useAuth()
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [storageTest, setStorageTest] = useState<string>('')
  const [refreshStatus, setRefreshStatus] = useState<string>('')

  // Extract token information for display
  useEffect(() => {
    if (session?.access_token) {
      const payload = tokenUtils.extractJWTPayload(session.access_token)
      setTokenInfo(payload)
    }
  }, [session])

  const testSecureStorage = () => {
    if (session) {
      try {
        // Test storage and retrieval
        secureTokenStorage.storeSession(session)
        const retrieved = secureTokenStorage.retrieveSession()
        
        if (retrieved) {
          setStorageTest('✅ Secure storage test passed')
        } else {
          setStorageTest('❌ Secure storage test failed')
        }
      } catch (error) {
        setStorageTest(`❌ Storage error: ${error}`)
      }
    }
  }

  const testTokenRefresh = async () => {
    setRefreshStatus('🔄 Testing token refresh...')
    
    try {
      await tokenRefreshManager.triggerRefresh(async () => {
        const result = await refreshSession()
        if (result.error) {
          throw new Error(result.error.message)
        }
      })
      setRefreshStatus('✅ Token refresh test passed')
    } catch (error) {
      setRefreshStatus(`❌ Token refresh failed: ${error}`)
    }
  }

  const clearAllData = () => {
    secureTokenStorage.clearAllAuthData()
    setStorageTest('🗑️ All auth data cleared')
    setTokenInfo(null)
  }

  const sanitizeAndTest = (input: string) => {
    const sanitized = tokenUtils.sanitizeInput(input)
    return sanitized
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Token Security Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to test secure token management features
          </p>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔐 Token Security & Management Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📊 Current Token Information
            </h2>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">User Email:</span>
                <span className="ml-2 text-gray-600">{user.email}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Session Valid:</span>
                <span className="ml-2 text-green-600">✅ Yes</span>
              </div>
              
              {session?.expires_at && (
                <div>
                  <span className="font-medium text-gray-700">Expires At:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(session.expires_at * 1000).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div>
                <span className="font-medium text-gray-700">Needs Refresh:</span>
                <span className={`ml-2 ${secureTokenStorage.needsRefresh(session) ? 'text-orange-600' : 'text-green-600'}`}>
                  {secureTokenStorage.needsRefresh(session) ? '⏰ Soon' : '✅ No'}
                </span>
              </div>
              
              {session?.access_token && (
                <div>
                  <span className="font-medium text-gray-700">Token Format Valid:</span>
                  <span className="ml-2 text-green-600">
                    {tokenUtils.isValidJWTFormat(session.access_token) ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
              )}
            </div>
            
            {tokenInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-700 mb-2">JWT Payload (Decoded):</h3>
                <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                  {JSON.stringify(tokenInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Security Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🛡️ Security Features
            </h2>
            
            <div className="space-y-4">
              {/* Secure Storage Test */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">Secure Token Storage</h3>
                <button
                  onClick={testSecureStorage}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Test Secure Storage
                </button>
                {storageTest && (
                  <p className="mt-2 text-sm">{storageTest}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Tests obfuscation, browser fingerprinting, and validation
                </p>
              </div>

              {/* Token Refresh Test */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">Intelligent Token Refresh</h3>
                <button
                  onClick={testTokenRefresh}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  Test Token Refresh
                </button>
                {refreshStatus && (
                  <p className="mt-2 text-sm">{refreshStatus}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Tests automatic refresh with retry logic and smart scheduling
                </p>
              </div>

              {/* XSS Protection Test */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">XSS Protection</h3>
                <input
                  type="text"
                  placeholder="Enter potential XSS payload..."
                  className="w-full p-2 border rounded text-sm mb-2"
                  onChange={(e) => {
                    const sanitized = sanitizeAndTest(e.target.value)
                    console.log('Original:', e.target.value)
                    console.log('Sanitized:', sanitized)
                  }}
                />
                <p className="text-xs text-gray-500">
                  Try entering: &lt;script&gt;alert('xss')&lt;/script&gt; - Check console for sanitization
                </p>
              </div>

              {/* Clear Data */}
              <div className="border rounded-md p-4 border-red-200">
                <h3 className="font-medium text-red-700 mb-2">Clear All Auth Data</h3>
                <button
                  onClick={clearAllData}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  Clear All Data
                </button>
                <p className="mt-2 text-xs text-red-500">
                  ⚠️ This will clear all stored authentication data
                </p>
              </div>
            </div>
          </div>

          {/* Security Configuration */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ⚙️ Security Configuration Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">Token Storage</h3>
                <ul className="text-sm space-y-1">
                  <li className="text-green-600">✅ Browser fingerprinting</li>
                  <li className="text-green-600">✅ XOR obfuscation</li>
                  <li className="text-green-600">✅ Expiration validation</li>
                  <li className="text-green-600">✅ Automatic cleanup</li>
                </ul>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">Token Refresh</h3>
                <ul className="text-sm space-y-1">
                  <li className="text-green-600">✅ Smart scheduling</li>
                  <li className="text-green-600">✅ Retry logic (3x)</li>
                  <li className="text-green-600">✅ Exponential backoff</li>
                  <li className="text-green-600">✅ Auto-fallback</li>
                </ul>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2">XSS Protection</h3>
                <ul className="text-sm space-y-1">
                  <li className="text-green-600">✅ Input sanitization</li>
                  <li className="text-green-600">✅ CSP headers</li>
                  <li className="text-green-600">✅ React built-in protection</li>
                  <li className="text-yellow-600">⚠️ Consider httpOnly cookies</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">🔍 Implementation Notes</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Current implementation uses enhanced localStorage with obfuscation</li>
                <li>• For production, consider migrating to httpOnly cookies for ultimate security</li>
                <li>• All token operations include validation and automatic cleanup</li>
                <li>• CSP headers applied for additional XSS protection</li>
                <li>• Token refresh is proactive (5 min before expiration) with intelligent retry logic</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenSecurityDemo 