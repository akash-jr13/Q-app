
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Access environment variables for Auth0 configuration (Vite uses import.meta.env)
const domain = import.meta.env.VITE_AUTH0_DOMAIN || "placeholder.us.auth0.com";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "placeholder-client-id";

// Check if Auth0 is configured - if not, render without Auth0Provider
const isAuth0Configured = domain !== "placeholder.us.auth0.com" && clientId !== "placeholder-client-id";

const root = ReactDOM.createRoot(rootElement);

import { BrowserRouter } from 'react-router-dom';

if (isAuth0Configured) {
  root.render(
    <React.StrictMode>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin
        }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Auth0Provider>
    </React.StrictMode>
  );
} else {
  // Render without Auth0 if not configured
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
