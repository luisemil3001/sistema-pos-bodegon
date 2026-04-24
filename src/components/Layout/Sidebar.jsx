import React from 'react';
import api from '../../api/api';
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
  RotateCcw,
  Monitor,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const [empresa, setEmpresa] = React.useState('SISTEMA POS');

  React.useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.nombre_empresa) {
          const nombre = res.data.nombre_empresa.toUpperCase();
          setEmpresa(nombre);
          document.title = `SISTEMA POS - ${nombre}`;
        } else {
          document.title = 'SISTEMA POS';
        }
      } catch (err) {
        console.error('Error loading company name in sidebar');
        document.title = 'SISTEMA POS';
      }
    };
    fetchEmpresa();
  }, []);

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Punto de Venta', path: '/pos', icon: ShoppingCart },
    { name: 'Productos', path: '/productos', icon: Package },
    { name: 'Inventario', path: '/inventario', icon: Archive },
    { name: 'Ajustes de Stock', path: '/ajustes-stock', icon: RefreshCw },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Facturas', path: '/facturas', icon: FileText },
    { name: 'Cotizaciones', path: '/cotizaciones', icon: FileDigit },
    { name: 'Proveedores', path: '/proveedores', icon: Truck },
    { name: 'Compras', path: '/compras', icon: ShoppingBag },
    { name: 'Notas de Crédito', path: '/notas-credito', icon: RotateCcw },
    { name: 'Contabilidad', path: '/contabilidad', icon: BookOpen },
    { name: 'Control de Caja', path: '/caja', icon: Lock },
    { name: 'Reportes', path: '/reportes', icon: BarChart3 },
    { name: 'Auditoría', path: '/auditoria', icon: ShieldCheck },
    { name: 'Gestión Usuarios', path: '/usuarios', icon: Users2 },
    { name: 'Estaciones (Cajas)', path: '/estaciones', icon: Monitor },
    { name: 'Configuración', path: '/config', icon: Settings },
  ];

  const menuItems = user?.rol === 'admin'
    ? allMenuItems
    : allMenuItems.filter(item => !['/config', '/estaciones', '/usuarios', '/auditoria'].includes(item.path));

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      boxShadow: '2px 0 14px rgba(15, 23, 42, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--bg-main)', fontWeight: 'bold', fontSize: '1.2rem' }}>
          {empresa.charAt(0)}
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {empresa}
        </h2>
      </div>

      <nav style={{ flex: 1, padding: '1rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Menú Principal</div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
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
                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    boxShadow: isActive ? 'inset 3px 0 0 var(--primary)' : 'none',
                    fontWeight: isActive ? '600' : '400',
                    transition: 'all 0.2s'
                  })}
                >
                  <Icon size={20} />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
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
