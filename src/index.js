import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './AuthContext.js'
import { ThreadProvider } from './ThreadContext.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThreadProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThreadProvider>
    </AuthProvider>
  </React.StrictMode>,
)
