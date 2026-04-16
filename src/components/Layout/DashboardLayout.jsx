import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useTheme from '../../hooks/useTheme';

const DashboardLayout = () => {
  useTheme(); // Aplicar tema al layout

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ padding: '2rem', flex: 1 }}>
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
