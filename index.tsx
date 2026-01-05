
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Handle GitHub Pages SPA routing
// When redirected from 404.html, URL will have ?/path format
if (window.location.search.includes('?/')) {
  const path = window.location.search.replace('?/', '').replace(/~and~/g, '&');
  const newPath = path.split('&')[0];
  window.history.replaceState({}, '', newPath || '/');
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
