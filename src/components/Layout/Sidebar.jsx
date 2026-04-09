import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Truck,
  ShoppingBag,
  Lock,
  Users2,
  FileDigit,
  LayoutDashboard,
  Archive,
  BookOpen,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Punto de Venta', path: '/pos', icon: <ShoppingCart size={20} /> },
    { name: 'Productos', path: '/productos', icon: <Package size={20} /> },
    { name: 'Inventario', path: '/inventario', icon: <Archive size={20} /> },
    { name: 'Ajustes de Stock', path: '/ajustes-stock', icon: <RefreshCw size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Facturas', path: '/facturas', icon: <FileText size={20} /> },
    { name: 'Proveedores', path: '/proveedores', icon: <Truck size={20} /> },
    { name: 'Compras', path: '/compras', icon: <ShoppingBag size={20} /> },
    { name: 'Notas de Crédito', path: '/notas-credito', icon: <RotateCcw size={20} /> },
    { name: 'Contabilidad', path: '/contabilidad', icon: <BookOpen size={20} /> },
    { name: 'Control de Caja', path: '/caja', icon: <Lock size={20} /> },
    { name: 'Reportes', path: '/reportes', icon: <BarChart3 size={20} /> },
    { name: 'Gestión Usuarios', path: '/usuarios', icon: <Users2 size={20} /> },
    { name: 'Configuración', path: '/config', icon: <Settings size={20} /> },
  ];

  const menuItems = user?.rol === 'admin'
    ? allMenuItems
    : allMenuItems.filter(item => !['/config'].includes(item.path));

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--bg-main)', fontWeight: 'bold', fontSize: '1.2rem' }}>P</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>SISTEMA POS</h2>
      </div>

      <nav style={{ flex: 1, padding: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Menú Principal</div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'active-link' : '')}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  color: isActive ? 'var(--primary)' : 'var(--text-main)',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s'
                })}
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={16} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nombre}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.rol}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            color: 'var(--danger)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
