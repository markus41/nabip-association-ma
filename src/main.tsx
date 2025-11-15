import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
// Spark removed for demo mode
// import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { AuthProvider } from '@/lib/auth/AuthContext'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <AuthProvider>
      <App />
    </AuthProvider>
   </ErrorBoundary>
)
