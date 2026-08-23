import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Global safeguard: prevent accidental native browser dragging on SVGs and images
// which locks up pointer events in Chromium/WebKit browsers
if (typeof window !== 'undefined') {
  const preventNativeDrag = (e) => {
    const target = e.target;
    // Allow intentional drag handles or elements explicitly marked draggable="true"
    if (
      target &&
      target.closest &&
      target.closest('[draggable="true"], [data-draggable="true"], .drag-handle, .sortable-item')
    ) {
      return;
    }
    e.preventDefault();
    return false;
  };

  window.addEventListener('dragstart', preventNativeDrag, { capture: true });
  document.addEventListener('dragstart', preventNativeDrag, { capture: true });

  // Reset any stuck body pointer states on dragend / mouseup
  window.addEventListener('dragend', () => {
    if (document.body) document.body.style.pointerEvents = '';
  }, { capture: true });
  window.addEventListener('mouseup', () => {
    if (document.body) document.body.style.pointerEvents = '';
  }, { capture: true });
}

const enableAnalytics = import.meta.env.VITE_ENABLE_VERCEL_ANALYTICS === 'true';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {enableAnalytics ? <Analytics debug={false} /> : null}
    <SpeedInsights />
  </StrictMode>,
)
