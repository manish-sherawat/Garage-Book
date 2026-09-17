'use client';
import { useToast } from '@/components/ToastProvider';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import PaymentModal from '@/components/PaymentModal';
import { formatCurrency } from '@/utils/format';
import { getInvoices, createInvoice, updateInvoiceStatus, getJobCards } from '@/utils/api';
import {
  CreditCard,
  Zap,
  Printer,
  Plus,
  X,
  Check,
  Eye,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  Receipt,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  vehicleNo: string;
  partsTotal: number;
  laborTotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  date: string;
  jobCardId?: string;
}

export default function BillingPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createInvoiceModalOpen, setCreateInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState<InvoiceItem | null>(null);

  // New Invoice Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newVehicleNo, setNewVehicleNo] = useState('');
  const [newPartsTotal, setNewPartsTotal] = useState('');
  const [newLaborTotal, setNewLaborTotal] = useState('');
  
  // New Additions
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState('');
  const [gstRate, setGstRate] = useState<number>(18);

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchLiveInvoices = async () => {
    try {
      const data = await getInvoices();
      if (data && Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (e) {
      console.warn('Failed to fetch live invoices:', e);
    }
  };

  const fetchDependencies = async () => {
    try {
      const data = await getJobCards();
      if (data && Array.isArray(data)) {
        setJobCards(data.filter(j => j.status === 'COMPLETED' || j.status === 'DELIVERED'));
      }
    } catch (e) {
      console.warn('Failed to fetch job cards:', e);
    }
  };

  useEffect(() => {
    fetchLiveInvoices();
    fetchDependencies();
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.vehicleNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const totalBilled = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const unpaidTotal = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const handleOpenPayment = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (selectedInvoice) {
      try {
        await updateInvoiceStatus(selectedInvoice.id, 'PAID');
        await fetchLiveInvoices();
      } catch (e) {
        console.warn('Failed to update invoice status:', e);
      }
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedJobCardId) {
      toast.error('Please select a Job Card to generate an invoice for.');
      return;
    }

    const parts = Number(newPartsTotal) || 0;
    const labor = Number(newLaborTotal) || 0;
    const subtotal = parts + labor;
    const tax = Math.round(subtotal * (gstRate / 100));
    const grand = subtotal + tax;

    const newInvoice = {
      customerName: newCustomerName,
      vehicleNo: newVehicleNo,
      partsTotal: parts,
      laborTotal: labor,
      taxAmount: tax,
      taxRate: gstRate,
      grandTotal: grand,
      jobCardId: selectedJobCardId,
    };

    try {
      await createInvoice(newInvoice);
      await fetchLiveInvoices();
      setCreateInvoiceModalOpen(false);
      setNewCustomerName('');
      setNewVehicleNo('');
      setNewPartsTotal('');
      setNewLaborTotal('');
      setSelectedJobCardId('');
      setGstRate(18);
      toast.success(`GST Tax Invoice generated successfully!`);
    } catch (e) {
      console.warn('Failed to create invoice:', e);
      toast.error('Failed to generate invoice. Please try again.');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
            color: black !important;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            background: white !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 !important;
            border: none !important;
          }
          #print-hide-actions {
            display: none !important;
          }
        }
      `}} />
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={22} color="var(--text-main)" /> Billing & GST Invoicing
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Generate tax-compliant GST invoices, instant dynamic UPI QR codes, and payment links.
            </p>
          </div>

          <button onClick={() => setCreateInvoiceModalOpen(true)} className="btn-primary">
            <Plus size={15} color="var(--bg-card)" /> Create GST Invoice
          </button>
        </div>

        {/* Billing Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Billed</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '800' }}>
              ₹{formatCurrency(totalBilled)}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Paid Invoices</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--success)', fontWeight: '800' }}>
              {paidCount} Cleared
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Outstanding</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--danger)', fontWeight: '800' }}>
              ₹{formatCurrency(unpaidTotal)}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>GST Rate</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '800' }}>18% Standard</h2>
          </div>
        </div>

        {/* Search Input */}
        <div className="glass-card" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div style={{ position: 'relative', width: '380px' }}>
            <input
              type="text"
              className="input-glass"
              placeholder="Search invoice number, customer, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredInvoices.length}</strong> invoices
          </span>
        </div>

        {/* Invoices Table */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Invoice No. & Date</th>
                <th style={{ padding: '10px 8px' }}>Customer & Vehicle</th>
                <th style={{ padding: '10px 8px' }}>Parts & Labor</th>
                <th style={{ padding: '10px 8px' }}>GST Tax (18%)</th>
                <th style={{ padding: '10px 8px' }}>Grand Total</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>{inv.invoiceNo}</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{inv.date}</span>
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>{inv.customerName}</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{inv.vehicleNo}</span>
                  </td>

                  <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Parts: ₹{formatCurrency(inv.partsTotal)} | Labor: ₹{formatCurrency(inv.laborTotal)}
                  </td>

                  <td style={{ padding: '12px 8px', color: 'var(--text-main)', fontWeight: '600' }}>
                    ₹{formatCurrency(inv.taxAmount)}
                  </td>

                  <td style={{ padding: '12px 8px', fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>
                    ₹{formatCurrency(inv.grandTotal)}
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <span className={inv.status === 'PAID' ? 'badge badge-completed' : inv.status === 'PARTIAL' ? 'badge badge-progress' : 'badge badge-pending'}>
                      {inv.status}
                    </span>
                  </td>

                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="btn-primary"
                          style={{
                            padding: '5px 10px',
                            fontSize: '11.5px',
                          }}
                        >
                          <Zap size={13} /> Collect Payment
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedPrintInvoice(inv)}
                        className="btn-secondary"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11.5px',
                        }}
                      >
                        <Printer size={13} /> Print PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="No Invoices Found"
              description="No billing invoices match your search query or status filter. Click below to create a new GST invoice."
              actionLabel="+ Create GST Invoice"
              onAction={() => setCreateInvoiceModalOpen(true)}
            />
          )}

          {/* Pagination Controls */}
          {filteredInvoices.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-canvas)', color: 'var(--text-main)', fontSize: '12px' }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>entries</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'var(--bg-canvas)' : 'var(--bg-card)', color: currentPage === 1 ? 'var(--border-active)' : 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: currentPage === totalPages ? 'var(--bg-canvas)' : 'var(--bg-card)', color: currentPage === totalPages ? 'var(--border-active)' : 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create GST Invoice Modal */}
        {createInvoiceModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              className="glass-card"
              style={{
                width: '540px',
                maxWidth: '92vw',
                padding: '28px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#18181b',
                      color: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Generate New GST Tax Invoice
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Enter customer details, spare parts & labor charges for 18% GST calculation.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCreateInvoiceModalOpen(false)}
                  style={{
                    background: 'var(--bg-canvas)',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Select Job Card to Invoice *
                  </label>
                  <select
                    className="input-glass"
                    style={{ width: '100%' }}
                    value={selectedJobCardId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedJobCardId(id);
                      if (id) {
                        const jc = jobCards.find(j => j.id === id);
                        if (jc) {
                           setNewCustomerName(jc.customer?.name || '');
                           setNewVehicleNo(jc.vehicle?.registrationNo || '');
                        }
                      } else {
                        setNewCustomerName('');
                        setNewVehicleNo('');
                      }
                    }}
                  >
                    <option value="">-- Select Completed Job Card --</option>
                    {jobCards.map(jc => (
                      <option key={jc.id} value={jc.id}>
                        {jc.customer?.name || 'Customer'} - {jc.vehicle?.registrationNo || 'Vehicle'} ({jc.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Customer Name
                    </label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="e.g. Vikram Malhotra"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      style={{ width: '100%' }}
                      disabled
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Vehicle Reg & Model
                    </label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="e.g. Honda City (MH12 AB 9988)"
                      value={newVehicleNo}
                      onChange={(e) => setNewVehicleNo(e.target.value)}
                      style={{ width: '100%' }}
                      disabled
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Spare Parts Subtotal (₹)
                    </label>
                    <input
                      type="number"
                      className="input-glass"
                      placeholder="5000"
                      value={newPartsTotal}
                      onChange={(e) => setNewPartsTotal(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Labor Subtotal (₹)
                    </label>
                    <input
                      type="number"
                      className="input-glass"
                      placeholder="1500"
                      value={newLaborTotal}
                      onChange={(e) => setNewLaborTotal(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      GST Rate
                    </label>
                    <select
                      className="input-glass"
                      style={{ width: '100%' }}
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div style={{ background: 'var(--bg-canvas)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>Subtotal (Parts + Labor):</span>
                    <strong>₹{((Number(newPartsTotal) || 0) + (Number(newLaborTotal) || 0)).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>GST Tax ({gstRate}%):</span>
                    <strong>₹{Math.round(((Number(newPartsTotal) || 0) + (Number(newLaborTotal) || 0)) * (gstRate / 100)).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: 'var(--text-main)', fontWeight: '800', paddingTop: '8px', borderTop: '1px solid #cbd5e1' }}>
                    <span>Grand Total Payable:</span>
                    <span style={{ color: 'var(--success)' }}>₹{Math.round(((Number(newPartsTotal) || 0) + (Number(newLaborTotal) || 0)) * (1 + (gstRate / 100))).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCreateInvoiceModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Check size={16} /> Issue & Save GST Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print PDF Preview Modal */}
        {selectedPrintInvoice && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              id="print-area"
              className="glass-card print-container"
              style={{
                width: '640px',
                maxWidth: '94vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 25px 30px -5px rgba(0,0,0,0.15)',
              }}
            >
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #18181b', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={22} /> GARAGEBOOK WORKSHOP
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    GSTIN: 27AAAAA0000A1Z5 • Reg. Service Center #14
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', background: '#18181b', color: 'var(--bg-card)', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>
                    TAX INVOICE
                  </span>
                  <h4 style={{ margin: '6px 0 0', fontSize: '15px', fontWeight: '800' }}>{selectedPrintInvoice.invoiceNo}</h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Date: {selectedPrintInvoice.date}</span>
                </div>
              </div>

              {/* Customer & Vehicle Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: 'var(--bg-canvas)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '3px' }}>
                    BILLED TO
                  </span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{selectedPrintInvoice.customerName}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>+91 98230 11223</span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '3px' }}>
                    VEHICLE DETAILS
                  </span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{selectedPrintInvoice.vehicleNo}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Odometer: 42,500 km</span>
                </div>
              </div>

              {/* Itemized Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: 'var(--bg-canvas)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--bg-canvas)' }}>
                    <td style={{ padding: '10px' }}>
                      <strong>Genuine Spare Parts & Oils</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Filters, Engine Oil, Brake Pads (HSN: 8708)</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>
                      ₹{formatCurrency(selectedPrintInvoice.partsTotal)}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--bg-canvas)' }}>
                    <td style={{ padding: '10px' }}>
                      <strong>Labor & Workshop Service Charges</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Full Inspection, Bay Service & Alignment (SAC: 9987)</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>
                      ₹{formatCurrency(selectedPrintInvoice.laborTotal)}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--bg-canvas)', background: '#fafafa' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>CGST @ 9%</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      ₹{formatCurrency(Math.round(selectedPrintInvoice.taxAmount / 2))}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#fafafa' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>SGST @ 9%</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      ₹{formatCurrency(Math.round(selectedPrintInvoice.taxAmount / 2))}
                    </td>
                  </tr>

                  <tr style={{ background: 'var(--bg-canvas)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '900', fontSize: '14px', color: 'var(--text-main)' }}>Grand Total (Inclusive of Taxes)</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900', fontSize: '16px', color: 'var(--success)' }}>
                      ₹{formatCurrency(selectedPrintInvoice.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Actions Footer */}
              <div id="print-hide-actions" style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPrintInvoice(null)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Close Preview
                </button>
                {typeof window !== 'undefined' && (
                  <PDFDownloadLink
                    document={<InvoicePDF invoice={selectedPrintInvoice} />}
                    fileName={`${selectedPrintInvoice.invoiceNo}.pdf`}
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    {/* @ts-ignore */}
                    {({ loading }) => (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                      >
                        <Printer size={16} /> {loading ? 'Generating PDF...' : 'Download PDF Invoice'}
                      </button>
                    )}
                  </PDFDownloadLink>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {selectedInvoice && (
          <PaymentModal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            jobCardId={selectedInvoice.jobCardId || selectedInvoice.invoiceNo}
            totalAmount={selectedInvoice.grandTotal}
            customerName={selectedInvoice.customerName}
            vehicleNo={selectedInvoice.vehicleNo}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </main>
    </div>
    </>
  );
}
