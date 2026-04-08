import { useState, useCallback, useEffect } from 'react';
import api from '../api/api';

const usePOS = () => {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carga inicial de productos y configuraciones
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, setRes] = await Promise.all([
        api.get('/products'),
        api.get('/settings')
      ]);
      // Solo productos con stock disponible
      setProducts(prodRes.data.filter(p => p.stock > 0)); 
      setSettings(setRes.data);
    } catch (err) {
      console.error("Error loading data:", err);
      setError('Error al cargar datos iniciales.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock) {
          alert('No hay suficiente stock de este producto');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prev, { ...product, cantidad: 1 }];
      }
    });
  };

  const updateQuantity = (id, change) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (!existing) return prev;
      
      const newCantidad = existing.cantidad + change;
      
      if (newCantidad <= 0) {
        return prev.filter(item => item.id !== id);
      }
      
      const productDef = products.find(p => p.id === id);
      if (productDef && newCantidad > productDef.stock) {
         alert('Supera el stock disponible');
         return prev;
      }
      
      return prev.map(item => item.id === id ? { ...item, cantidad: newCantidad } : item);
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };
  
  const clearCart = () => setCart([]);

  const getTotals = (metodoPago = 'efectivo') => {
    let subtotal = 0;
    let ivaTotal = 0;
    const tasaDecimal = settings ? parseFloat(settings.itbis_tasa) / 100 : 0.16;

    cart.forEach(item => {
      const price = parseFloat(item.precio_venta || 0);
      const itemSubtotal = price * item.cantidad;
      subtotal += itemSubtotal;
      
      if (item.aplica_iva) {
        ivaTotal += itemSubtotal * tasaDecimal;
      }
    });

    const isDivisas = ['divisas', 'dolares'].includes(metodoPago.toLowerCase());
    const baseIgtf = subtotal + ivaTotal;
    const igtfTasaDecimal = settings ? parseFloat(settings.igtf_tasa || 3) / 100 : 0.03;
    const igtfTotal = isDivisas ? baseIgtf * igtfTasaDecimal : 0;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      iva: parseFloat(ivaTotal.toFixed(2)),
      igtf: parseFloat(igtfTotal.toFixed(2)),
      total: parseFloat((subtotal + ivaTotal + igtfTotal).toFixed(2))
    };
  };

  const processSale = async (metodoPago = 'efectivo', clienteId = null) => {
    if (cart.length === 0) return { success: false, message: 'El carrito está vacío' };

    try {
      setLoading(true);

      const payload = {
        cliente_id: clienteId,
        metodo_pago: metodoPago,
        descuento_global: 0,
        items: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_venta,
          aplica_iva: item.aplica_iva
        }))
      };

      const res = await api.post('/invoices', payload);
      
      // Limpiar carrito solo si la venta fue exitosa
      clearCart();
      await fetchInitialData(); 
      
      return { success: true, data: res.data };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error al procesar la venta';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    settings,
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotals,
    processSale
  };
};

export default usePOS;