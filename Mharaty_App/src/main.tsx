import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './ui/ErrorBoundary.tsx'
import { ToastProvider } from './ui/Toast.tsx'
import OfflineBanner from './ui/OfflineBanner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
        <OfflineBanner />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
