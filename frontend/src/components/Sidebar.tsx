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
  const cleanPath = pathname.split('?')[0]; // strip query params
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
      } catch (e) {
        // Ignored to prevent spamming
      }
    };
    
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (isMounted && settings) {
          if (settings.workshopName) setWorkshopName(settings.workshopName);
          if (settings.ownerName) setOwnerName(settings.ownerName);
        }
      } catch (e) {
        // Ignored
      }
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

  // Auto-expand menu section if current route matches parent path
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
            { name: 'All Vehicles List', path: '/vehicles', icon: Car },
            { name: 'Register New Vehicle', path: '/vehicles?register=true', icon: Plus },
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
            { name: 'Create GST Invoice', path: '/billing?new=true', icon: Plus },
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

  const getBadgeClass = (type?: string) => {
    switch (type) {
      case 'emerald':
        return 'sidebar-badge sidebar-badge-emerald';
      case 'indigo':
        return 'sidebar-badge sidebar-badge-indigo';
      case 'amber':
        return 'sidebar-badge sidebar-badge-amber';
      case 'cyan':
        return 'sidebar-badge sidebar-badge-cyan';
      case 'slate':
      default:
        return 'sidebar-badge sidebar-badge-slate';
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

    return (
      <div key={item.path} style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Link
            href={item.path}
            onClick={handleParentClick}
            className={`sidebar-nav-item ${isActive || isParentOfActive ? 'sidebar-nav-item-active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <item.icon size={17} style={{ flexShrink: 0, color: isActive || isParentOfActive ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexShrink: 0 }}>
              {item.badge && (
                <span className={getBadgeClass(item.badgeType)}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(item.path, e)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                  aria-label="Toggle sub-menu"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>
          </Link>
        </div>

        {/* Render Nested Children if expanded */}
        {hasChildren && isExpanded && (
          <div style={{ marginLeft: '16px', paddingLeft: '12px', borderLeft: '1px solid var(--border-color)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {item.children!.map((child) => {
              const isChildActive = cleanPath === child.path;
              return (
                <Link
                  key={child.path}
                  href={child.path}
                  onClick={() => setMobileOpen(false)}
                  className={`sidebar-child-item ${isChildActive ? 'sidebar-child-item-active' : ''}`}
                >
                  <child.icon size={13} style={{ color: isChildActive ? 'var(--accent)' : '#94a3b8' }} />
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
        style={{
          position: 'fixed',
          top: '12px',
          left: '12px',
          zIndex: 50,
          padding: '10px',
          borderRadius: '12px',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
            background: 'rgba(9, 9, 11, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 39,
          }}
        />
      )}

      {/* SINGLE UNIFIED SIDEBAR DRAWER */}
      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => setMobileOpen(false)}>
            <div className="sidebar-brand-icon">
              <Wrench size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-brand-title">GarageBook</span>
                <span className="sidebar-brand-badge">PRO</span>
              </div>
              <div className="sidebar-sub-caption">
                <span className="sidebar-status-dot"></span>
                <span>{workshopName} • Active</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="sidebar-scroll-area">
          {navSections.map((section) => (
            <div key={section.category}>
              <div className="sidebar-category-header">
                {section.category}
              </div>
              <div>
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / User Profile */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sidebar-user-avatar">
              {ownerName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)' }}>{ownerName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="var(--success)" /> Admin Owner
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
              title="Settings"
            >
              <Settings size={17} />
            </Link>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('garagebook_token');
                  window.location.reload();
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
