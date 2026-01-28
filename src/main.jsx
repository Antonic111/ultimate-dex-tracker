import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

const enableAnalytics = import.meta.env.VITE_ENABLE_VERCEL_ANALYTICS === 'true';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {enableAnalytics ? <Analytics debug={false} /> : null}
    <SpeedInsights />
  </StrictMode>,
)
