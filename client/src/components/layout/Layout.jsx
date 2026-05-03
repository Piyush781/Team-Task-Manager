import Sidebar from './Sidebar';

const Layout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14', fontFamily: "'DM Sans', sans-serif" }}>
    <Sidebar />
    <main style={{ flex: 1, marginLeft: 240, padding: '32px 36px', overflowY: 'auto', minHeight: '100vh' }}>
      {children}
    </main>
  </div>
);

export default Layout;