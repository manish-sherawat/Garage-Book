'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Wrench,
  Car,
  UserCheck,
  Menu,
  X,
  Package,
  ShoppingCart,
  Users,
  Receipt,
  Landmark,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Hexagon
} from 'lucide-react';
import { fetchBadgeCounts, getSettings } from '@/utils/api';

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeType?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'slate';
  children?: NavItem[];
};

type NavSection = {
  category: string;
  items: NavItem[];
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const cleanPath = pathname.split('?')[0]; 
  const [badgeCounts, setBadgeCounts] = useState<{
    jobs?: number;
    freeBays?: number;
    vehicles?: number;
    activeMechanics?: number;
  }>({});
  const [workshopName, setWorkshopName] = useState('GarageBook');
  const [ownerName, setOwnerName] = useState('Admin Owner');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    '/jobs': true,
    '/vehicles': true,
    '/inventory': false,
    '/procurement': false,
    '/customers': false,
    '/billing': false,
  });

  useEffect(() => {
    let isMounted = true;
    const loadCounts = async () => {
      try {
        const data = await fetchBadgeCounts();
        if (isMounted) setBadgeCounts(data || {});
      } catch (e) {}
    };
    
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (isMounted && settings) {
          if (settings.workshopName) setWorkshopName(settings.workshopName);
          if (settings.ownerName) setOwnerName(settings.ownerName);
        }
      } catch (e) {}
    };

    loadCounts();
    loadSettings();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadCounts();
    }, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    ['/jobs', '/vehicles', '/inventory', '/procurement', '/customers', '/billing'].forEach((parentPath) => {
      if (cleanPath.startsWith(parentPath)) {
        setExpandedItems((prev) => ({ ...prev, [parentPath]: true }));
      }
    });
  }, [cleanPath]);

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const navSections: NavSection[] = [
    {
      category: 'MAIN OVERVIEW',
      items: [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }],
    },
    {
      category: 'WORKSHOP OPERATIONS',
      items: [
        {
          name: 'Job Cards',
          path: '/jobs',
          icon: FileText,
          children: [
            { name: 'All Job Cards', path: '/jobs', icon: FileText },
            { name: 'Create New Job', path: '/jobs?new=true', icon: Plus },
          ],
        },
        {
          name: 'Service Bays',
          path: '/workshop-bays',
          icon: Wrench,
        },
        {
          name: 'Vehicle Registry',
          path: '/vehicles',
          icon: Car,
          children: [
            { name: 'All Vehicles', path: '/vehicles', icon: Car },
            { name: 'Register Vehicle', path: '/vehicles?register=true', icon: Plus },
          ],
        },
        {
          name: 'Mechanics & Team',
          path: '/mechanics',
          icon: UserCheck,
        },
      ],
    },
    {
      category: 'INVENTORY & SUPPLIES',
      items: [
        {
          name: 'Parts & Inventory',
          path: '/inventory',
          icon: Package,
          children: [
            { name: 'Stock Catalog', path: '/inventory', icon: Package },
            { name: 'Add Spare Part', path: '/inventory?add=true', icon: Plus },
          ],
        },
        {
          name: 'Procurement',
          path: '/procurement',
          icon: ShoppingCart,
          children: [
            { name: 'Purchase Orders', path: '/procurement', icon: ShoppingCart },
            { name: 'New PO Order', path: '/procurement?new=true', icon: Plus },
          ],
        },
      ],
    },
    {
      category: 'CLIENTS & FINANCIALS',
      items: [
        {
          name: 'Customers CRM',
          path: '/customers',
          icon: Users,
          children: [
            { name: 'Customer Directory', path: '/customers', icon: Users },
            { name: 'Add Customer', path: '/customers?add=true', icon: Plus },
          ],
        },
        {
          name: 'Invoices & Billing',
          path: '/billing',
          icon: Receipt,
          children: [
            { name: 'Invoices List', path: '/billing', icon: Receipt },
            { name: 'Create Invoice', path: '/billing?new=true', icon: Plus },
          ],
        },
        {
          name: 'GST Accounting',
          path: '/accounting',
          icon: Landmark,
        },
        {
          name: 'Reports & Insights',
          path: '/reports',
          icon: BarChart3,
        },
      ],
    },
  ];

  const getBadgeStyle = (type?: string) => {
    const baseStyle = {
      fontSize: '10px',
      fontWeight: '800',
      padding: '2.5px 7px',
      borderRadius: '20px',
      lineHeight: 1
    };
    switch (type) {
      case 'emerald':
        return { ...baseStyle, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
      case 'indigo':
        return { ...baseStyle, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' };
      case 'amber':
        return { ...baseStyle, background: '#fef9ee', color: '#b45309', border: '1px solid #fcd88a' };
      case 'cyan':
        return { ...baseStyle, background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc' };
      case 'slate':
      default:
        return { ...baseStyle, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  const renderItem = (item: NavItem) => {
    const isActive = cleanPath === item.path;
    const isParentOfActive = item.children?.some((child) => cleanPath === child.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = !!expandedItems[item.path];

    const handleParentClick = (e: React.MouseEvent) => {
      if (hasChildren) {
        setExpandedItems((prev) => ({
          ...prev,
          [item.path]: !prev[item.path],
        }));
      }
      setMobileOpen(false);
    };

    const activeColor = '#0a7c4b'; // Garage Green
    const activeBg = '#e8f8f2';

    return (
      <div key={item.path} style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Link
            href={item.path}
            onClick={handleParentClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: isActive || isParentOfActive ? '700' : '600',
              color: isActive || isParentOfActive ? activeColor : '#64748b',
              background: isActive || isParentOfActive ? activeBg : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              border: isActive || isParentOfActive ? '1px solid #a7e3cc' : '1px solid transparent',
              boxShadow: isActive || isParentOfActive ? '0 2px 4px rgba(10, 124, 75, 0.05)' : 'none',
            }}
            onMouseOver={(e) => {
              if (!isActive && !isParentOfActive) {
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.border = '1px solid #e2e8f0';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive && !isParentOfActive) {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <item.icon size={18} strokeWidth={isActive || isParentOfActive ? 2.5 : 2} style={{ flexShrink: 0, color: isActive || isParentOfActive ? activeColor : '#94a3b8' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexShrink: 0 }}>
              {item.badge && (
                <span style={getBadgeStyle(item.badgeType)}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(item.path, e)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                  aria-label="Toggle sub-menu"
                >
                  {isExpanded ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
                </button>
              )}
            </div>
          </Link>
        </div>

        {/* Render Nested Children if expanded */}
        {hasChildren && isExpanded && (
          <div style={{ marginLeft: '18px', paddingLeft: '14px', borderLeft: '2px solid #e2e8f0', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {item.children!.map((child) => {
              const isChildActive = cleanPath === child.path;
              return (
                <Link
                  key={child.path}
                  href={child.path}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: isChildActive ? '700' : '500',
                    color: isChildActive ? activeColor : '#64748b',
                    background: isChildActive ? activeBg : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isChildActive) e.currentTarget.style.color = '#1e293b';
                  }}
                  onMouseOut={(e) => {
                    if (!isChildActive) e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <child.icon size={14} strokeWidth={isChildActive ? 2.5 : 2} style={{ color: isChildActive ? activeColor : '#cbd5e1' }} />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mobile-menu-btn"
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 50,
          padding: '10px',
          borderRadius: '12px',
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          cursor: 'pointer',
        }}
        aria-label="Toggle Navigation Menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 39,
          }}
        />
      )}

      <aside
        className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
          color: '#1e293b',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-inter)'
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, #f8fafc 0%, transparent 100%)'
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }} onClick={() => setMobileOpen(false)}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0a7c4b 0%, #065c37 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 12px rgba(10, 124, 75, 0.2)'
            }}>
              <Hexagon size={24} strokeWidth={2} style={{ fill: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif', fontWeight: '800', fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>
                  GarageBook
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #0a7c4b 0%, #086b40 100%)', color: '#ffffff',
                  fontSize: '10px', fontWeight: '900', padding: '2px 7px', borderRadius: '20px',
                  marginLeft: '8px', letterSpacing: '0.04em'
                }}>
                  PRO
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }}></span>
                <span style={{ fontWeight: '500' }}>{workshopName}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {navSections.map((section) => (
            <div key={section.category}>
              <div style={{
                fontSize: '10.5px', fontWeight: '800', color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '0 12px', marginBottom: '8px'
              }}>
                {section.category}
              </div>
              <div>
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / User Profile */}
        <div style={{
          padding: '18px 20px',
          borderTop: '1px solid #f1f5f9',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#e2e8f0', color: '#334155',
              fontWeight: '800', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #cbd5e1'
            }}>
              {ownerName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{ownerName}</div>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <ShieldCheck size={12} color="#0a7c4b" strokeWidth={2.5} /> Admin
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              style={{
                color: '#64748b', padding: '8px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', background: '#ffffff',
                transition: 'all 0.2s', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#ffffff'; }}
              title="Settings"
            >
              <Settings size={18} />
            </Link>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('garagebook_token');
                  window.location.reload();
                }
              }}
              style={{
                background: '#fff1f2', border: '1px solid #ffe4e6',
                color: '#e11d48', padding: '8px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(225, 29, 72, 0.05)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ffe4e6';
                e.currentTarget.style.color = '#be123c';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#fff1f2';
                e.currentTarget.style.color = '#e11d48';
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
