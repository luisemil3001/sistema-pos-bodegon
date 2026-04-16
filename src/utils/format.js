/**
 * util/format.js
 * Funcionalidades centralizadas para formateo de números y moneda 
 * siguiendo el estándar es-VE (punto para miles, coma para decimales).
 */

/**
 * Formatea un valor numérico como moneda (2 decimales fijos)
 * @param {number|string} val 
 * @returns {string} Ejemplo: "1.234,56"
 */
export const formatCurrency = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? "0,00" : n.toLocaleString('es-VE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

/**
 * Formatea cantidades (pesables o unidades)
 * Si es entero, no muestra decimales. Si tiene decimales, muestra hasta 3.
 * @param {number|string} qty 
 * @returns {string} Ejemplo: "1" o "1,520"
 */
export const formatQty = (qty) => {
  const n = parseFloat(qty);
  if (isNaN(n)) return "0";
  
  // Si es entero, devolver como string simple para evitar ceros decimales innecesarios
  if (n % 1 === 0) return n.toString();
  
  // Para decimales, usar el locale es-VE
  return n.toLocaleString('es-VE', {
    maximumFractionDigits: 3
  });
};
