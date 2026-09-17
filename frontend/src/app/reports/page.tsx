'use client';
import { useToast } from '@/components/ToastProvider';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, Download, Flame, UserCheck, Star, BarChart3, Clock } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { getAnalytics } from '@/utils/api';

interface MechanicPerformance {
  name: string;
  role: string;
  jobsCompleted: number;
  revenueGenerated: number;
  avgTime: string;
  rating: number;
}

export default function ReportsPage() {
  const toast = useToast();
  const [timeRange, setTimeRange] = useState('THIS_MONTH');
  
  const [displayedRevenueData, setDisplayedRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [displayedMechanics, setDisplayedMechanics] = useState<MechanicPerformance[]>([]);
  const [displayedParts, setDisplayedParts] = useState<{ name: string; category: string; count: number; unit: string }[]>([]);
  const [yoyGrowth, setYoyGrowth] = useState<string>('0.0');

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await getAnalytics(timeRange);
      if (data) {
        setDisplayedRevenueData(data.fullRevenueData);
        setDisplayedMechanics(data.baseMechanics);
        setDisplayedParts(data.baseParts);
        setYoyGrowth(data.yoyGrowth);
      }
    };
    loadAnalytics();
  }, [timeRange]);

  const maxRevenue = Math.max(...displayedRevenueData.map((d) => d.revenue), 1000);

  const handleExportCSV = () => {
    if (displayedRevenueData.length === 0 && displayedMechanics.length === 0) {
      toast.error('No data available to export.');
      return;
    }

    let csv = 'Month,Revenue (INR)\n';
    displayedRevenueData.forEach((d) => {
      csv += `"${d.month}",${d.revenue}\n`;
    });
    csv += '\nTechnician,Role,Jobs Completed,Revenue (INR),Rating\n';
    displayedMechanics.forEach((m) => {
      csv += `"${m.name}","${m.role}",${m.jobsCompleted},${m.revenueGenerated},${m.rating}\n`;
    });
    
    csv += '\nPart Name,Category,Quantity Used,Unit\n';
    displayedParts.forEach((p) => {
      csv += `"${p.name}","${p.category}",${p.count},"${p.unit}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `garagebook_analytics_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'short' });
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={22} color="var(--text-main)" /> Analytics &amp; Workshop Performance
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Revenue growth trends, technician productivity leaderboards, and part consumption analytics.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-glass"
              style={{ background: 'var(--bg-card)' }}
            >
              <option value="THIS_MONTH">This Month ({currentMonthName} {currentYear})</option>
              <option value="LAST_QUARTER">Last Quarter</option>
              <option value="YEAR_TO_DATE">Year To Date ({currentYear})</option>
            </select>

            <button onClick={handleExportCSV} className="btn-primary">
              <Download size={15} color="var(--bg-card)" /> Export Analytics CSV
            </button>
          </div>
        </div>

        {/* Analytics Top Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Revenue Growth Bar Chart Visualizer */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={17} color="var(--text-main)" /> Monthly Revenue Growth Trend
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Year {currentYear} Earnings (INR)</span>
              </div>
              <span style={{ fontSize: '12px', color: Number(yoyGrowth) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700', background: Number(yoyGrowth) >= 0 ? '#dcfce7' : '#fee2e2', padding: '3px 8px', borderRadius: '6px' }}>
                {Number(yoyGrowth) >= 0 ? '+' : ''}{yoyGrowth}% YoY
              </span>
            </div>

            {/* Custom Interactive Bar Chart */}
            <div style={{ height: '210px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '16px 10px 0', borderBottom: '1px solid var(--border-color)' }}>
              {displayedRevenueData.length === 0 || displayedRevenueData.every(d => d.revenue === 0) ? (
                <EmptyState
                  icon={BarChart3}
                  title="No Revenue Analytics Recorded"
                  description="Revenue growth trends will appear here as job cards and invoice payments are completed."
                />
              ) : (
                displayedRevenueData.map((d) => {
                  const heightPercent = Math.round((d.revenue / (maxRevenue || 1)) * 100);

                  return (
                    <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '700' }}>
                        ₹{(d.revenue / 1000).toFixed(0)}k
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          background: d.month === currentMonthName ? '#18181b' : '#cbd5e1',
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 0.2s ease',
                        }}
                      />
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>{d.month}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Moving Parts Widget */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={17} color="var(--danger)" /> Top Moving Parts
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedParts.length === 0 ? (
                <EmptyState
                  icon={Flame}
                  title="No Parts Used"
                  description="Top moving parts will be calculated as inventory stock items are consumed."
                />
              ) : (
                displayedParts.map((part) => (
                  <div key={part.name} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{part.name}</strong>
                      <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '12px' }}>{part.count} {part.unit}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category: {part.category}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Technician Productivity Leaderboard */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={17} color="var(--text-main)" /> Technician Productivity Leaderboard
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Technician / Specialty</th>
                <th style={{ padding: '10px 8px' }}>Jobs Completed</th>
                <th style={{ padding: '10px 8px' }}>Avg Repair Time</th>
                <th style={{ padding: '10px 8px' }}>Revenue Generated</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Customer Rating</th>
              </tr>
            </thead>
            <tbody>
              {displayedMechanics.map((tech) => (
                <tr key={tech.name} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>{tech.name}</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{tech.role}</span>
                  </td>

                  <td style={{ padding: '12px 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {tech.jobsCompleted} Repair Jobs
                  </td>

                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {tech.avgTime}
                    </span>
                  </td>

                  <td style={{ padding: '12px 8px', fontWeight: '800', color: 'var(--text-main)' }}>
                    ₹{formatCurrency(tech.revenueGenerated)}
                  </td>

                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={12} fill="var(--text-main)" color="var(--text-main)" /> {tech.rating} / 5.0
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayedMechanics.length === 0 && (
            <EmptyState
              icon={UserCheck}
              title="No Technician Productivity Data"
              description="Technician productivity and completed repair job leaderboards will populate as jobs are finished."
            />
          )}
        </div>
      </main>
    </div>
  );
}
