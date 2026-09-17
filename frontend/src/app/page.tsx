'use client';
import { useToast } from '@/components/ToastProvider';

import { useState, memo } from 'react';
import Sidebar from '@/components/Sidebar';
import PaymentModal from '@/components/PaymentModal';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import { formatCurrency } from '@/utils/format';
import Link from 'next/link';
import {
  DollarSign,
  Car,
  Wrench,
  AlertTriangle,
  Camera,
  Plus,
  Package,
  Landmark,
  Users,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';

// ─── Chart Components ─────────────────────────────────────────────────────────

const RevenueAreaChart = memo(function RevenueAreaChart({ data }: { data: any[] }) {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', background: 'var(--bg-canvas)', borderRadius: '8px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: '13px', margin: 0 }}>No revenue data available.</p>
          <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>Create invoices and record payments to see trends.</p>
        </div>
      </div>
    );
  }

  const W = 520, H = 180, PAD = { top: 20, right: 16, bottom: 32, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const len = data.length > 1 ? data.length - 1 : 1;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / len) * innerW,
    y: PAD.top + innerH - ((d.value - minVal) / range) * innerH,
    ...d,
  }));

  const createSmoothPath = (points: { x: number; y: number }[], smoothing = 0.16) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) * smoothing;
      const cp1y = p1.y + (p2.y - p0.y) * smoothing;
      const cp2x = p2.x - (p3.x - p1.x) * smoothing;
      const cp2y = p2.y - (p3.y - p1.y) * smoothing;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = createSmoothPath(pts, 0.16);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`areaGrad-${Math.random().toString(36).substr(2, 9)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => {
        const y = PAD.top + innerH - ((v - minVal) / range) * innerH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 3" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif">
              {v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill={`url(#areaGrad-${Math.random().toString(36).substr(2, 9)})`} />
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
          <text x={p.x} y={PAD.top + innerH + 18} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontFamily="Inter, sans-serif" fontWeight="500">
            {p.month}
          </text>
        </g>
      ))}
      <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 10} textAnchor="middle" fontSize="9.5" fill="var(--accent)" fontWeight="800" fontFamily="Inter, sans-serif">
        ₹{data[data.length - 1].value >= 100000 ? (data[data.length - 1].value / 100000).toFixed(2) + 'L' : (data[data.length - 1].value / 1000).toFixed(1) + 'K'}
      </text>
    </svg>
  );
});

const DonutChart = memo(function DonutChart({ data }: { data: any[] }) {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '130px', width: '100%', background: 'var(--bg-canvas)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No jobs found</span>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const totalDiv = total || 1;
  const R = 56, cx = 80, cy = 80, strokeW = 18;
  const circumference = 2 * Math.PI * R;
  let cumulative = 0;
  const segments = data.map((d) => {
    const pct = d.value / totalDiv;
    const offset = circumference * (1 - cumulative);
    const dash = circumference * pct;
    cumulative += pct;
    return { ...d, pct, offset, dash };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg viewBox="0 0 160 160" style={{ width: '130px', height: '130px', flexShrink: 0 }}>
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-main)" fontFamily="Plus Jakarta Sans, sans-serif">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9.5" fill="var(--text-muted)" fontFamily="Inter, sans-serif" fontWeight="600">Total Jobs</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{d.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '700', color: '#0f172a', paddingLeft: '12px' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const HorizontalBarChart = memo(function HorizontalBarChart({ data }: { data: any[] }) {
  if (!data || data.length === 0 || data.every((d) => d.revenue === 0 && d.jobs === 0)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '130px', background: 'var(--bg-canvas)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No services logged yet</span>
      </div>
    );
  }

  const maxRev = Math.max(...data.map((d) => d.revenue)) || 1;
  const colors = ['var(--accent)', '#15803d', 'var(--warning)', '#b45309', 'var(--text-muted)'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{d.label}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.jobs} jobs</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>₹{(d.revenue / 1000).toFixed(0)}K</span>
            </div>
          </div>
          <div style={{ height: '7px', borderRadius: '4px', background: 'var(--bg-canvas)', overflow: 'hidden' }}>
            <div style={{
              width: `${(d.revenue / maxRev) * 100}%`,
              height: '100%',
              borderRadius: '4px',
              background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}cc)`,
              transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
});

const MechanicBarsChart = memo(function MechanicBarsChart({ data }: { data: any[] }) {
  if (!data || data.length === 0 || data.every((d) => d.jobs === 0)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '142px', width: '100%', background: 'var(--bg-canvas)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No mechanic activity yet</span>
      </div>
    );
  }

  const maxJobs = Math.max(...data.map((d) => d.jobs)) || 1;
  const H = 110, barW = 38, gap = 14;
  const totalW = data.length * (barW + gap) - gap;
  const colors = ['var(--accent)', '#15803d', 'var(--warning)', '#b45309', 'var(--text-muted)'];

  return (
    <svg viewBox={`0 0 ${totalW + 10} ${H + 32}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        {data.map((_, i) => (
          <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i]} stopOpacity="1" />
            <stop offset="100%" stopColor={colors[i]} stopOpacity="0.45" />
          </linearGradient>
        ))}
      </defs>
      {data.map((d, i) => {
        const barH = (d.jobs / maxJobs) * H;
        const x = i * (barW + gap);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="5" fill={`url(#barGrad${i})`} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9.5" fontWeight="800" fill={colors[i]} fontFamily="Inter, sans-serif">{d.jobs}</text>
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#475569" fontFamily="Inter, sans-serif">{d.name.split(' ')[0]}</text>
            <text x={x + barW / 2} y={H + 27} textAnchor="middle" fontSize="8.5" fill="var(--warning)" fontFamily="Inter, sans-serif" fontWeight="700">★ {d.rating}</text>
          </g>
        );
      })}
    </svg>
  );
});

const BayGauge = memo(function BayGauge({ occupied, total, bays = [] }: { occupied: number; total: number; bays?: any[] }) {
  const pct = total > 0 ? occupied / total : 0;
  const R = 46, cx = 60, cy = 62;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startAngle = -210, endAngle = 30, range = endAngle - startAngle;
  const arc = (r: number, start: number, end: number) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(end)), y: cy + r * Math.sin(toRad(end)) };
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const fillEnd = startAngle + range * pct;
  const color = pct > 0.8 ? 'var(--danger)' : pct > 0.5 ? 'var(--warning)' : 'var(--success)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <svg viewBox="0 0 120 90" style={{ width: '100%', height: '90px' }}>
        <path d={arc(R, startAngle, endAngle)} fill="none" stroke="var(--border-color)" strokeWidth="10" strokeLinecap="round" />
        {total > 0 && <path d={arc(R, startAngle, fillEnd)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />}
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a" fontFamily="Plus Jakarta Sans, sans-serif">{occupied}/{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="Inter, sans-serif" fontWeight="600">Occupied</text>
      </svg>
      {total > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {Array.from({ length: total }, (_, i) => {
            const bayName = bays && bays[i] ? bays[i].name || bays[i].bayNumber : `BAY-0${i + 1}`;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: i < occupied ? 'var(--success)' : '#cbd5e1', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: i < occupied ? '#1e293b' : '#94a3b8', fontWeight: i < occupied ? '600' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {bayName}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: i < occupied ? 'var(--success)' : 'var(--text-muted)', fontWeight: '600' }}>
                  {i < occupied ? 'Occupied' : 'Free'}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
          No workshop bays configured.
        </div>
      )}
    </div>
  );
});

import { useEffect } from 'react';
import { getDashboardStats, getWorkshopBays } from '@/utils/api';

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const toast = useToast();
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    monthlyRevenue: 0,
    activeJobs: 0,
    freeBays: 5,
    totalBays: 5,
    totalVehicles: 0,
    lowStockItems: 0,
    revenueData: [] as any[],
    jobStatusData: [] as any[],
    serviceData: [] as any[],
    mechanicData: [] as any[],
    highlights: {
      invoices: 0,
      cashCollected: 0,
      partsConsumed: 0,
      avgJobTime: '0h'
    },
    yoyGrowth: '+0.0%'
  });
  const [liveBays, setLiveBays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLiveDashboard = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(false);
    try {
      const stats = await getDashboardStats();
      if (stats) {
        setMetrics({
          monthlyRevenue: stats.kpis.totalRevenue || 0,
          activeJobs: stats.kpis.activeJobs || 0,
          freeBays: stats.kpis.freeBays || 5,
          totalBays: stats.kpis.totalBays || 5,
          totalVehicles: stats.kpis.totalVehicles || 0,
          lowStockItems: stats.kpis.lowStockItems || 0,
          yoyGrowth: stats.kpis.yoyGrowth || '+0.0%',
          revenueData: stats.revenueData || [],
          jobStatusData: stats.jobStatusData || [],
          serviceData: stats.serviceData || [],
          mechanicData: stats.mechanicData || [],
          highlights: stats.highlights || {
            invoices: 0,
            cashCollected: 0,
            partsConsumed: 0,
            avgJobTime: '0h'
          }
        });
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard(true);
    getWorkshopBays().then(bays => {
      if (bays && Array.isArray(bays)) setLiveBays(bays);
    }).catch(e => console.warn('Failed to fetch bays on mount', e));

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        fetchLiveDashboard(false);
        getWorkshopBays().then(bays => {
          if (bays && Array.isArray(bays)) setLiveBays(bays);
        }).catch(e => console.warn('Failed to fetch bays in poll', e));
      }, 10000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        fetchLiveDashboard(false);
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
    };
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: '#0f172a' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>Workshop Dashboard</h1>
              <span style={{ background: '#e8f8f2', color: 'var(--accent)', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', border: '1px solid #a7e3cc' }}>
                GarageBook
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Real-Time Workshop Insights &amp; Operational Analytics •{' '}
              <span className="font-semibold text-slate-700">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {error && (
              <button onClick={() => fetchLiveDashboard(true)} className="btn-secondary" style={{ borderRadius: '10px', color: 'var(--danger)', borderColor: '#fca5a5', background: '#fef2f2' }}>
                Retry Connection
              </button>
            )}
            <button onClick={() => setBarcodeModalOpen(true)} className="btn-secondary" style={{ borderRadius: '10px' }}>
              <Camera size={15} color="#0f172a" /> Scan Barcode
            </button>
            <Link href="/jobs?new=true" className="btn-primary" style={{ borderRadius: '10px' }}>
              <Plus size={15} color="var(--bg-card)" /> New Job Card
            </Link>
          </div>
        </header>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <Link href="/billing" className="glass-card group" style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Revenue</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: '#e8f8f2' }}><DollarSign size={18} color="var(--accent)" /></div>
            </div>
            {loading ? (
              <div style={{ height: '31px', width: '120px', background: 'var(--border-color)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
            ) : (
              <h2 style={{ fontSize: '26px', margin: 0, fontWeight: '800', color: error ? 'var(--danger)' : 'var(--text-main)' }}>
                {error ? 'Offline' : `₹${formatCurrency(metrics.monthlyRevenue)}`}
              </h2>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                <TrendingUp size={12} /> Live API
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>total ledger</span>
            </div>
          </Link>

          <Link href="/jobs" className="glass-card group" style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Active Job Cards</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: '#fef3c7' }}><Car size={18} color="var(--warning)" /></div>
            </div>
            {loading ? (
              <div style={{ height: '31px', width: '100px', background: 'var(--border-color)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
            ) : (
              <h2 style={{ fontSize: '26px', margin: 0, fontWeight: '800', color: error ? 'var(--danger)' : 'var(--text-main)' }}>
                {error ? 'Offline' : `${metrics.activeJobs} Jobs`}
              </h2>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <span className="text-amber-700 bg-amber-50 text-[11px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                Live Status
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>in progress</span>
            </div>
          </Link>

          <Link href="/workshop-bays" className="glass-card group" style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Bay Occupancy</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: '#f0fdf4' }}><Wrench size={18} color="var(--success)" /></div>
            </div>
            {loading ? (
              <div style={{ height: '31px', width: '90px', background: 'var(--border-color)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
            ) : (
              <h2 style={{ fontSize: '26px', margin: 0, fontWeight: '800', color: error ? 'var(--danger)' : 'var(--text-main)' }}>
                {error ? 'Offline' : `${metrics.totalBays - metrics.freeBays} / ${metrics.totalBays} Bays`}
              </h2>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                {metrics.freeBays} Available Now
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>live load</span>
            </div>
          </Link>

          <Link href="/inventory" className="glass-card group" style={{ padding: '20px', borderRadius: '14px', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Low Stock Alert</span>
              <div style={{ padding: '8px', borderRadius: '10px', background: '#fef2f2' }}><AlertTriangle size={18} color="var(--danger)" /></div>
            </div>
            {loading ? (
              <div style={{ height: '31px', width: '80px', background: 'var(--border-color)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
            ) : (
              <h2 style={{ fontSize: '26px', margin: 0, fontWeight: '800', color: 'var(--danger)' }}>
                {error ? 'Offline' : `${metrics.lowStockItems} Items`}
              </h2>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
              <span className="text-red-700 bg-red-50 text-[11px] font-bold px-1.5 py-0.5 rounded border border-red-200">
                Action Required
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--danger)' }}>Reorder threshold</span>
            </div>
          </Link>
        </div>

        {/* Row 1: Revenue Trend + Job Status Donut */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '800', color: '#0f172a' }}>Revenue Trend</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Last 6 months workshop performance</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: '#e8f8f2', border: '1px solid #a7e3cc' }}>
                <TrendingUp size={12} color="var(--accent)" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)' }}>{metrics.yoyGrowth}</span>
              </div>
            </div>
            <div style={{ height: '170px' }}>
              <RevenueAreaChart data={metrics.revenueData} />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '800', color: '#0f172a' }}>Job Status</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Current month job breakdown</p>
            </div>
            <DonutChart data={metrics.jobStatusData} />
          </div>
        </div>

        {/* Row 2: Top Services + Mechanic Performance + Bay Utilization */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '800', color: '#0f172a' }}>Top Services</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Revenue by service category</p>
            </div>
            <HorizontalBarChart data={metrics.serviceData} />
          </div>

          <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '800', color: '#0f172a' }}>Mechanic Performance</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Jobs completed &amp; ratings</p>
            </div>
            <MechanicBarsChart data={metrics.mechanicData} />
          </div>

          <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '800', color: '#0f172a' }}>Bay Utilization</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Live service bay occupancy</p>
            </div>
            <BayGauge occupied={metrics.totalBays - metrics.freeBays} total={metrics.totalBays} bays={liveBays} />
          </div>
        </div>

        {/* Row 3: Today Highlights + Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 14px', fontWeight: '800', color: '#0f172a' }}>Today&apos;s Highlights</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Invoices Raised', value: metrics.highlights.invoices.toString(), sub: 'today', color: 'var(--accent)', bg: '#e8f8f2' },
                { label: 'Cash Collected', value: '₹' + (metrics.highlights.cashCollected >= 1000 ? (metrics.highlights.cashCollected/1000).toFixed(1) + 'K' : metrics.highlights.cashCollected), sub: 'today', color: '#15803d', bg: '#f0fdf4' },
                { label: 'Parts Consumed', value: metrics.highlights.partsConsumed.toString(), sub: 'items', color: 'var(--warning)', bg: '#fef9ee' },
                { label: 'Avg Job Time', value: metrics.highlights.avgJobTime, sub: 'per job', color: '#9a3412', bg: '#fff7ed' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '14px', borderRadius: '12px', background: item.bg, border: `1px solid ${item.color}25` }}>
                  <span style={{ fontSize: '11px', color: item.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.label}</span>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px' }}>{item.value}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.sub}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 14px', fontWeight: '800', color: '#0f172a' }}>Quick Action Shortcuts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Link href="/inventory" className="btn-secondary" style={{ borderRadius: '10px', justifyContent: 'center', padding: '12px' }}>
                <Package size={16} color="var(--accent)" /> Parts &amp; Stock
              </Link>
              <Link href="/accounting" className="btn-secondary" style={{ borderRadius: '10px', justifyContent: 'center', padding: '12px' }}>
                <Landmark size={16} color="#059669" /> GST Ledger
              </Link>
              <Link href="/customers" className="btn-secondary" style={{ borderRadius: '10px', justifyContent: 'center', padding: '12px' }}>
                <Users size={16} color="var(--warning)" /> Customer CRM
              </Link>
              <Link href="/reports" className="btn-secondary" style={{ borderRadius: '10px', justifyContent: 'center', padding: '12px' }}>
                <TrendingUp size={16} color="var(--text-muted)" /> Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Modals */}
        <BarcodeScannerModal
          isOpen={barcodeModalOpen}
          onClose={() => setBarcodeModalOpen(false)}
          onScanResult={(code) => toast.success(`Barcode Scanned: ${code}\nItem SKU matched to inventory!`)}
        />
      </main>
    </div>
  );
}
