import { useState, useCallback } from 'react';

interface ErrorResponse {
  response?: {
    status: number;
    data?: {
      error?: string;
    };
  };
  request?: any;
  message?: string;
}

interface UseErrorHandlerReturn {
  error: string | null;
  isLoading: boolean;
  handleError: (error: ErrorResponse, customMessage?: string | null) => string;
  clearError: () => void;
  startLoading: () => void;
  stopLoading: () => void;
  wrapAsync: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleError = useCallback((error: ErrorResponse, customMessage: string | null = null): string => {
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

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const startLoading = useCallback((): void => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback((): void => {
    setIsLoading(false);
  }, []);

  const wrapAsync = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (error) {
      handleError(error as ErrorResponse);
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