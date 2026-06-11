import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import SplashScreen from './components/SplashScreen'
import LoginPage from './components/LoginPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './styles/index.css'

function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1a1f2e]">
        <svg
          className="animate-spin h-8 w-8 text-white/40"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

function Root() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
