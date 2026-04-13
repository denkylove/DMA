import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#022c2e',
            color: '#eaf6f6',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'IBM Plex Sans',
          },
          success: { iconTheme: { primary: '#4fb4b8', secondary: '#022c2e' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#022c2e' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
