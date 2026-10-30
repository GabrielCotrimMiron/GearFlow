import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <GoogleOAuthProvider clientId="786528717718-mlio5kb8amihm66qdipsq0tubdkb9sg9.apps.googleusercontent.com">
          <App />
      </GoogleOAuthProvider>
  </StrictMode>
);
