import { useState, useCallback } from 'react';

const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error, customMessage = null) => {
    console.error('Error handled:', error);

    let message = customMessage;

    if (!message) {
      if (error.response) {
        // Error de respuesta del servidor
        switch (error.response.status) {
          case 400:
            message = 'Datos inválidos. Por favor verifica la información.';
            break;
          case 401:
            message = 'Sesión expirada. Por favor inicia sesión nuevamente.';
            break;
          case 403:
            message = 'No tienes permisos para realizar esta acción.';
            break;
          case 404:
            message = 'Recurso no encontrado.';
            break;
          case 409:
            message = 'Conflicto de datos. El registro ya existe o hay un problema de integridad.';
            break;
          case 500:
            message = 'Error interno del servidor. Por favor intenta más tarde.';
            break;
          default:
            message = `Error del servidor (${error.response.status}).`;
        }
      } else if (error.request) {
        // Error de red
        message = 'Error de conexión. Verifica tu conexión a internet.';
      } else {
        // Otro tipo de error
        message = error.message || 'Ha ocurrido un error inesperado.';
      }
    }

    setError(message);
    setIsLoading(false);

    // Auto-limpiar el error después de 5 segundos
    setTimeout(() => setError(null), 5000);

    return message;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const wrapAsync = useCallback(async (asyncFn, customMessage = null) => {
    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (error) {
      handleError(error, customMessage);
      throw error; // Re-throw para que el componente pueda manejarlo si es necesario
    }
  }, [startLoading, stopLoading, handleError]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    startLoading,
    stopLoading,
    wrapAsync
  };
};

export default useErrorHandler;