import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const App = () => {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui', 
      backgroundColor: '#f0f9ff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ color: '#059669', fontSize: '32px', marginBottom: '20px' }}>
          ✅ Asana App Loading Successfully!
        </h1>
        <p style={{ fontSize: '18px', marginBottom: '20px', color: '#374151' }}>
          Your development server is working on localhost:5173
        </p>
        <button 
          onClick={() => alert('React events working!')}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          Test Button
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

console.log('🚀 Minimal app starting...')
const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
console.log('✅ Minimal app rendered')