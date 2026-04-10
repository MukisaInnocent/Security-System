'use client';

import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ChatWidget from '@/components/ChatWidget';
import {
  Shield, LayoutDashboard, Eye, Lock, Building2, BarChart3,
  Users, MapPin, CalendarDays, ClipboardCheck, AlertTriangle,
  Bell, LogOut, Wifi, WifiOff, ChevronRight, Zap, Sun, Moon,
  Crosshair, UserCheck, Briefcase, Truck, FileText, BadgeDollarSign,
  Utensils, Wallet, FileCheck, MessageSquare
} from 'lucide-react';

type NavItem = { label: string; path: string; icon: React.ReactNode; roles: string[] };

const NAV_ITEMS: Record<string, NavItem[]> = {
  main: [
    { label: 'Dashboard',     path: '/dashboard',  icon: <LayoutDashboard size={16} />, roles: ['ADMIN', 'CEO', 'OPS_MANAGER'] },
    { label: 'Regional View', path: '/regional',   icon: <MapPin size={16} />,          roles: ['REGIONAL_MANAGER'] },
    { label: 'Supervisor',    path: '/supervisor', icon: <Eye size={16} />,             roles: ['SUPERVISOR'] },
    { label: 'Guard Panel',   path: '/guard',      icon: <Lock size={16} />,            roles: ['GUARD'] },
    { label: 'Client Portal', path: '/client',     icon: <Building2 size={16} />,       roles: ['CLIENT'] },
    { label: 'Food Supplier', path: '/food-supplier',icon: <Utensils size={16} />,      roles: ['FOOD_SUPPLIER'] },
    { label: 'Messages',      path: '/chat',       icon: <MessageSquare size={16} />,   roles: ['GUARD', 'SUPERVISOR', 'ADMIN', 'CEO', 'OPS_MANAGER', 'CLIENT', 'HR', 'M_AND_E', 'REGIONAL_MANAGER', 'FINANCE', 'ARMOURY_OFFICER', 'PROCUREMENT_OFFICER', 'LOGISTICS_OFFICER', 'FOOD_SUPPLIER'] },
    { label: 'Analytics',     path: '/analytics',  icon: <BarChart3 size={16} />,       roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'M_AND_E', 'REGIONAL_MANAGER'] },
  ],
  operations: [
    { label: 'Deployments',   path: '/admin/deployments', icon: <CalendarDays size={16} />, roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'REGIONAL_MANAGER'] },
    { label: 'Attendance',    path: '/admin/attendance',  icon: <ClipboardCheck size={16} />, roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'REGIONAL_MANAGER', 'HR'] },
    { label: 'Incidents',     path: '/admin/incidents',   icon: <AlertTriangle size={16} />,  roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'REGIONAL_MANAGER'] },
    { label: 'Spot Checks',   path: '/admin/spot-check',  icon: <Eye size={16} />,            roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'REGIONAL_MANAGER', 'SUPERVISOR', 'HR'] },
    { label: 'Special Duty',  path: '/admin/special-duty',icon: <Briefcase size={16} />,      roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'FINANCE'] },
  ],
  hr: [
    { label: 'Guard Records', path: '/hr/guards',       icon: <UserCheck size={16} />,    roles: ['ADMIN', 'CEO', 'HR', 'OPS_MANAGER'] },
    { label: 'Leave Requests',path: '/hr/leave',        icon: <CalendarDays size={16} />, roles: ['ADMIN', 'HR', 'OPS_MANAGER'] },
    { label: 'Payroll',       path: '/hr/payroll',      icon: <Wallet size={16} />,       roles: ['ADMIN', 'CEO', 'FINANCE', 'HR'] },
    { label: 'Weapon Registry',path: '/hr/weapons',     icon: <Crosshair size={16} />,    roles: ['ADMIN', 'CEO', 'HR', 'ARMOURY_OFFICER'] },
  ],
  assets: [
    { label: 'Armoury',       path: '/armoury',         icon: <Crosshair size={16} />,    roles: ['ADMIN', 'CEO', 'ARMOURY_OFFICER'] },
    { label: 'Procurement',   path: '/procurement',     icon: <FileText size={16} />,     roles: ['ADMIN', 'CEO', 'PROCUREMENT_OFFICER', 'FINANCE'] },
    { label: 'Logistics',     path: '/logistics',       icon: <Truck size={16} />,        roles: ['ADMIN', 'CEO', 'LOGISTICS_OFFICER'] },
  ],
  finance: [
    { label: 'Finance Hub',   path: '/finance',         icon: <Wallet size={16} />,       roles: ['ADMIN', 'CEO', 'FINANCE'] },
  ],
  manage: [
    { label: 'Users & Roles', path: '/admin/users',       icon: <Users size={16} />,       roles: ['ADMIN', 'CEO'] },
    { label: 'Regions & Sites',path: '/admin/sites',      icon: <MapPin size={16} />,      roles: ['ADMIN', 'CEO', 'OPS_MANAGER'] },
  ],
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      setTheme('light');
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(t => {
      const nt = t === 'dark' ? 'light' : 'dark';
      if (nt === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      localStorage.setItem('theme', nt);
      return nt;
    });
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch notification count
  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      api.getUnreadCount().then(r => setUnreadCount(r.count)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setShowNotifications(true);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '0.75rem' }}>
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading SecureGuard...</span>
      </div>
    );
  }

  const filteredNav = (items: typeof NAV_ITEMS.main) =>
    items.filter((item) => item.roles.includes(user.role));

  const isActivePath = (path: string) =>
    pathname === path || (path !== '/dashboard' && path !== '/guard' && path !== '/client' && path !== '/supervisor' && path !== '/analytics' && pathname.startsWith(path));

  return (
    <div>
      {!isOnline && (
        <div className="offline-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <WifiOff size={14} /> You are offline — data will sync when reconnected
        </div>
      )}

      {/* Mobile header */}
      <div style={{
        display: 'none', background: 'var(--bg-secondary)', padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }} className="mobile-header">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center'
        }}>
          <ChevronRight size={22} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Shield size={16} color="var(--accent-light)" />
          <span className="gradient-text">SecureGuard</span> Pro
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleTheme} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={loadNotifications} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center'
          }}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px', height: '38px', background: 'var(--accent-gradient)', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}><Shield size={20} color="white" /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                <span className="gradient-text">SecureGuard</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Enterprise v2.0</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
          {filteredNav(NAV_ITEMS.main).length > 0 && (
            <div>
              {filteredNav(NAV_ITEMS.main).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {filteredNav(NAV_ITEMS.operations)?.length > 0 && (
            <div>
              <div className="sidebar-section-title">Operations</div>
              {filteredNav(NAV_ITEMS.operations).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {filteredNav(NAV_ITEMS.hr)?.length > 0 && (
            <div>
              <div className="sidebar-section-title">HR & Payroll</div>
              {filteredNav(NAV_ITEMS.hr).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {filteredNav(NAV_ITEMS.assets)?.length > 0 && (
            <div>
              <div className="sidebar-section-title">Assets & Inventory</div>
              {filteredNav(NAV_ITEMS.assets).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {filteredNav(NAV_ITEMS.finance)?.length > 0 && (
            <div>
              <div className="sidebar-section-title">Finance</div>
              {filteredNav(NAV_ITEMS.finance).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {filteredNav(NAV_ITEMS.manage)?.length > 0 && (
            <div>
              <div className="sidebar-section-title">System Config</div>
              {filteredNav(NAV_ITEMS.manage).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Notification & Theme (desktop) */}
        <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadNotifications} style={{
            flex: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)',
            background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', position: 'relative',
            transition: 'all 0.2s',
          }}>
            <Bell size={15} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--danger)', color: 'white',
                fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem',
                borderRadius: '9999px', minWidth: '20px', textAlign: 'center',
              }}>{unreadCount}</span>
            )}
          </button>
          <button onClick={toggleTheme} title="Toggle Theme" style={{
            padding: '0 0.75rem', borderRadius: 'var(--radius-sm)',
            background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* User card */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white',
              boxShadow: '0 2px 8px var(--accent-glow)',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {user.role.replace(/_/g, ' ')}
              </div>
            </div>
            {isOnline
              ? <span title="Online" style={{ display: 'flex' }}><Wifi size={13} color="var(--success)" /></span>
              : <span title="Offline" style={{ display: 'flex' }}><WifiOff size={13} color="var(--danger)" /></span>
            }
          </div>
          <button onClick={logout} className="btn btn-outline" style={{ width: '100%', fontSize: '0.75rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 30 }}
        />
      )}

      {/* Notification panel */}
      {showNotifications && (
        <div className="modal-backdrop" onClick={() => setShowNotifications(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={18} /> Notifications</h2>
              {unreadCount > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Bell size={32} opacity={0.3} /></div>
                <div className="empty-state-text">No notifications</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.map((n: any) => (
                  <div key={n.id} style={{
                    padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                    background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.06)',
                    border: `1px solid ${n.isRead ? 'var(--border-light)' : 'rgba(99,102,241,0.2)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {n.type === 'ALERT'
                          ? <AlertTriangle size={13} color="var(--danger)" />
                          : n.type === 'WARNING'
                            ? <AlertTriangle size={13} color="var(--warning)" />
                            : <Zap size={13} color="var(--info)" />
                        }
                        {n.title}
                      </div>
                      {!n.isRead && <span className="status-dot online" />}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="main-content" style={{ marginLeft: '260px', minHeight: '100vh', padding: '1.5rem' }}>
        {children}
      </main>

      <ChatWidget />

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-bottom: 2rem !important; }
        }
      `}</style>
    </div>
  );
}
