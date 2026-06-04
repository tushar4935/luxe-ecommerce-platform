import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './index.css';

function ThemedToaster() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: dark ? '#1a1a1a' : '#ede9e2',
          color: dark ? '#f5f5f5' : '#1c1917',
          border: `1px solid ${dark ? '#2a2a2a' : '#d4cfc7'}`,
          borderRadius: '10px',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#c9a84c', secondary: dark ? '#0a0a0a' : '#faf9f7' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: dark ? '#0a0a0a' : '#faf9f7' } },
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <App />
              <ThemedToaster />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
