'use client';
import { useToast } from '@/components/ToastProvider';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/utils/format';
import { Landmark, Download, CheckCircle2 } from 'lucide-react';
import { getFinancialSummary, getPayments } from '@/utils/api';
import * as XLSX from 'xlsx';

export default function AccountingPage() {
  const toast = useToast();
  const [timeRange, setTimeRange] = useState('YEAR_TO_DATE');
  const [summaryData, setSummaryData] = useState<{
    totalRevenue: number;
    totalProcurementExpense: number;
    totalLabourCost: number;
    netProfit: number;
    taxSummary: { totalGstCollected: number; cgst: number; sgst: number; igst: number; taxableRevenue: number };
  }>({
    totalRevenue: 0,
    totalProcurementExpense: 0,
    totalLabourCost: 0,
    netProfit: 0,
    taxSummary: { totalGstCollected: 0, cgst: 0, sgst: 0, igst: 0, taxableRevenue: 0 },
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchLiveAccounting = async () => {
    const summaryRes = await getFinancialSummary(timeRange);
    if (summaryRes) {
      setSummaryData({
        totalRevenue: summaryRes.totalRevenue || 0,
        totalProcurementExpense: summaryRes.totalProcurementExpense || 0,
        totalLabourCost: summaryRes.totalLabourCost || 0,
        netProfit: summaryRes.netProfit || 0,
        taxSummary: summaryRes.taxSummary || { totalGstCollected: 0, cgst: 0, sgst: 0, igst: 0, taxableRevenue: 0 },
      });
    }

    const paymentsRes = await getPayments(timeRange);
    if (paymentsRes && Array.isArray(paymentsRes)) {
      setRecentTransactions(
        paymentsRes.map((p) => ({
          id: p.id ? p.id.slice(0, 8).toUpperCase() : 'TXN-001',
          invoice: p.jobCardId ? `INV-${p.jobCardId.slice(0, 6).toUpperCase()}` : 'INV-GENERAL',
          customer: p.jobCard?.customer?.name || 'Walk-in Customer',
          amount: p.amount || 0,
          method: p.paymentMethod || 'CASH',
          status: p.status || 'COMPLETED',
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
        }))
      );
    }
  };

  useEffect(() => {
    fetchLiveAccounting();
  }, [timeRange]);

  const financialSummary = {
    totalGrossRevenue: summaryData.totalRevenue,
    totalProcurementExpense: summaryData.totalProcurementExpense,
    totalLabourCost: summaryData.totalLabourCost,
    netProfit: summaryData.netProfit,
    gstCollected: summaryData.taxSummary.totalGstCollected,
    cgst: summaryData.taxSummary.cgst,
    sgst: summaryData.taxSummary.sgst,
    igst: summaryData.taxSummary.igst,
  };

  const handleExportCSV = () => {
    if (recentTransactions.length === 0) {
      toast.error('No transactions to export for this time range.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(
      recentTransactions.map((t) => ({
        'Transaction ID': t.id,
        Invoice: t.invoice,
        Customer: t.customer,
        'Amount (INR)': t.amount,
        'Payment Method': t.method,
        Status: t.status,
        Date: t.date,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `garagebook_financial_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Landmark size={22} color="var(--text-main)" /> Financial Accounting & Taxes
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Real-time revenue, expense reconciliation, tax calculations (CGST/SGST), and export.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-glass"
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px' }}
            >
              <option value="ALL_TIME">All Time</option>
              <option value="YEAR_TO_DATE">Year to Date</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="btn-secondary"
            >
              <Download size={15} color="var(--text-main)" /> Export Excel Report
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        {financialSummary.netProfit < 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--danger)', fontWeight: '800', fontSize: '14px' }}>⚠️ Net Profit Warning:</span>
            <span style={{ color: '#991b1b', fontSize: '13px' }}>Your expenses (Procurement + Labour) currently exceed your generated revenue for this period.</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Gross Revenue</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: 'var(--text-main)', fontWeight: '800' }}>₹{formatCurrency(financialSummary.totalGrossRevenue)}</h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Procurement</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: 'var(--danger)', fontWeight: '800' }}>₹{formatCurrency(financialSummary.totalProcurementExpense)}</h2>
          </div>
          
          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Labour / Salaries</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: 'var(--warning)', fontWeight: '800' }}>₹{formatCurrency(financialSummary.totalLabourCost)}</h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px', border: financialSummary.netProfit < 0 ? '1px solid var(--danger)' : undefined }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Net Profit</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: financialSummary.netProfit < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '800' }}>
              {financialSummary.netProfit < 0 ? '-' : ''}₹{formatCurrency(Math.abs(financialSummary.netProfit))}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>GST Output</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: 'var(--text-main)', fontWeight: '800' }}>₹{formatCurrency(financialSummary.gstCollected)}</h2>
          </div>
        </div>

        {/* GST Tax Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={17} color="var(--text-main)" /> Tax Liability Breakdown (18% GST)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span>CGST (9%)</span>
                <strong style={{ color: 'var(--text-main)' }}>₹{formatCurrency(financialSummary.cgst)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span>SGST (9%)</span>
                <strong style={{ color: 'var(--text-main)' }}>₹{formatCurrency(financialSummary.sgst)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span>IGST (Interstate)</span>
                <strong style={{ color: 'var(--text-main)' }}>₹{formatCurrency(financialSummary.igst)}</strong>
              </div>
            </div>
          </div>

          {/* Transaction Ledger */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>Recent Payment Ledger</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>Txn ID</th>
                  <th style={{ padding: '10px 0' }}>Invoice</th>
                  <th style={{ padding: '10px 0' }}>Customer</th>
                  <th style={{ padding: '10px 0' }}>Amount (₹)</th>
                  <th style={{ padding: '10px 0' }}>Method</th>
                  <th style={{ padding: '10px 0', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{t.id}</td>
                    <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{t.invoice}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{t.customer}</td>
                    <td style={{ color: 'var(--text-main)', fontWeight: '800' }}>₹{formatCurrency(t.amount)}</td>
                    <td><span style={{ background: 'var(--bg-canvas)', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-main)', fontWeight: '600' }}>{t.method}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {recentTransactions.length === 0 && (
              <EmptyState
                icon={Landmark}
                title="No Transactions Found"
                description="No recent payments or ledger transactions found for the selected filter."
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
