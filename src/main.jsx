import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

const renderFatalError = (error) => {
  console.error('Fatal app error:', error);
  root.render(
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffefef', padding: '2rem' }}>
      <div style={{ maxWidth: '700px', width: '100%', background: '#ffffff', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.15)', borderRadius: '18px', padding: '2rem', color: '#0f172a' }}>
        <h1 style={{ marginBottom: '1rem', color: '#b91c1c' }}>Error crítico en la aplicación</h1>
        <p style={{ marginBottom: '1rem', color: '#475569' }}>Algo impidió que la aplicación se hiciera render correctamente. Reinicie la página después de revisar la consola.</p>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', color: '#1f2937' }}>{String(error)}</pre>
      </div>
    </div>,
  );
};

window.addEventListener('error', (event) => {
  renderFatalError(event.error || event.message || 'Error desconocido');
});

window.addEventListener('unhandledrejection', (event) => {
  renderFatalError(event.reason || 'Promesa rechazada sin manejar');
});

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
};

try {
  renderApp();
} catch (error) {
  console.error('Root render failed:', error);
  renderFatalError(error);
}
