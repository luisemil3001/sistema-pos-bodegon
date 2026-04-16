import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: '#f8fafc', color: '#0f172a' }}>
          <div style={{ width: '100%', maxWidth: '640px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.12)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', fontWeight: '800' }}>!</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>¡Ups! Algo salió mal</h2>
                <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>La aplicación encontró un error inesperado. Intenta recargar la página.</p>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#1f2937', marginBottom: '1rem' }}>
              {this.state.error ? this.state.error.toString() : 'Error desconocido'}
              {this.state.errorInfo?.componentStack ? '\n\n' + this.state.errorInfo.componentStack : ''}
            </pre>
            <button
              onClick={this.handleRetry}
              style={{ padding: '0.85rem 1.25rem', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700' }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;