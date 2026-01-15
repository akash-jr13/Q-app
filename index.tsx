
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Access environment variables for Auth0 configuration
// Note: You must configure these in your environment (e.g., .env or Secrets)
const domain = process.env.AUTH0_DOMAIN || "your-tenant.us.auth0.com";
const clientId = process.env.AUTH0_CLIENT_ID || "your-client-id";

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* @ts-ignore - Fix: Suppress property mismatch on Auth0Provider props */}
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
