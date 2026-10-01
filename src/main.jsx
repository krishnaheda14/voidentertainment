import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminPage from './components/AdminPage.jsx'
import './index.css'

// A dedicated, bookmarkable route rather than a modal over the main site —
// both Vercel (vercel.json) and Cloudflare Pages (public/_redirects) already
// serve every path through index.html, so this just picks what to render.
const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isAdminRoute ? <AdminPage /> : <App />}</React.StrictMode>
)
