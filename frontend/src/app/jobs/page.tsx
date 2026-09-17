'use client';
import { useToast } from '@/components/ToastProvider';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PaymentModal from '@/components/PaymentModal';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/utils/format';
import { FileText, Camera, Plus, Search, UserCheck, Package, Trash2, X, Check, Wrench, User, Loader2, Printer } from 'lucide-react';
import Autofill2Field from '@/components/Autofill2Field';
import { getJobCards, createJobCard as createJobCardApi, updateJobCardStatus, getCustomers, getVehicles, getMechanics, getInventoryItems } from '@/utils/api';
import PageLoader from '@/components/PageLoader';

interface JobCardItem {
  id: string;
  jobId: string;
  customerName: string;
  phone: string;
  vehicleModel: string;
  registrationNo: string;
  serviceType: string;
  assignedMechanic: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED';
  estimatedCost: number;
  createdAt: string;
}

interface WorkOrderPart {
  id: string;
  partId?: string;
  name: string;
  qty: number;
  unitCost: number;
  totalCost: number;
}



export default function JobsPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED'>('ALL');
  const [search, setSearch] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCardItem | null>(null);

  const [jobCards, setJobCards] = useState<JobCardItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchLiveJobCards = async () => {
    try {
      const data = await getJobCards();
      if (data && Array.isArray(data)) {
        const mapped: JobCardItem[] = data.map((job: any) => ({
          id: job.id,
          jobId: job.jobNo || `JOB-${job.id.substring(0, 5).toUpperCase()}`,
          customerName: job.customer?.name || 'Unknown',
          phone: job.customer?.phone || 'Unknown',
          vehicleModel: job.vehicle?.model || 'Unknown',
          registrationNo: job.vehicle?.registrationNo || 'Unknown',
          serviceType: job.description || 'General Service',
          assignedMechanic: job.mechanic?.name || job.mechanicName || 'Unassigned',
          status: job.status || 'PENDING',
          estimatedCost: job.estimatedCost || 0,
          createdAt: new Date(job.createdAt).toISOString().split('T')[0],
        }));
        setJobCards(mapped);
      }
    } catch (err) {
      console.error('Failed to load job cards:', err);
    }
  };

  const fetchDependencies = async () => {
    const [custs, vehs, mechs, parts] = await Promise.all([
      getCustomers(),
      getVehicles(),
      getMechanics(),
      getInventoryItems(),
    ]);
    if (custs) setLiveCustomers(custs);
    if (vehs) setLiveVehicles(vehs);
    if (mechs) setMechanicsList(mechs.map((m: any) => m.name));
    if (parts) setCatalogParts(parts);
  };

  useEffect(() => {
    Promise.all([fetchLiveJobCards(), fetchDependencies()]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setNewJobModalOpen(true);
      window.history.replaceState(null, '', '/jobs');
    }
  }, [searchParams]);


  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [mechanic, setMechanic] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [liveCustomers, setLiveCustomers] = useState<any[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<any[]>([]);
  const [mechanicsList, setMechanicsList] = useState<string[]>([]);
  const [catalogParts, setCatalogParts] = useState<any[]>([]);

  // Autofill 2 Autocomplete State for Job Cards
  const [showCustSuggestions, setShowCustSuggestions] = useState(false);
  const [showRegSuggestions, setShowRegSuggestions] = useState(false);
  const [showPartSuggestions, setShowPartSuggestions] = useState(false);
  const [partSearch, setPartSearch] = useState('');

  const vehicleModels = Array.from(new Set(liveVehicles.map(v => `${v.make || ''} ${v.model || ''}`.trim()))).filter(Boolean);
  const serviceTypes = Array.from(new Set(jobCards.map(j => j.serviceType))).filter(Boolean);

  // Spare Parts & Cost State
  const [selectedParts, setSelectedParts] = useState<WorkOrderPart[]>([]);
  const [selectedCatalogIndex, setSelectedCatalogIndex] = useState<string>('');
  const [customPartName, setCustomPartName] = useState('');
  const [customPartCost, setCustomPartCost] = useState('');
  const [laborCost, setLaborCost] = useState('');

  const partsSubtotal = selectedParts.reduce((sum, p) => sum + p.totalCost, 0);
  const totalEstimatedCost = partsSubtotal + (Number(laborCost) || 0);

  const handleAddCatalogPart = () => {
    if (selectedCatalogIndex === '') return;
    const idx = Number(selectedCatalogIndex);
    const item = catalogParts[idx];
    if (!item) return;

    const newPart: WorkOrderPart = {
      id: Date.now().toString(),
      partId: item.id,
      name: item.name,
      qty: 1,
      unitCost: item.price,
      totalCost: item.price,
    };

    setSelectedParts([...selectedParts, newPart]);
    setSelectedCatalogIndex('');
  };

  const handleAddCustomPart = () => {
    if (!customPartName) return;
    const unitPrice = Number(customPartCost) || 0;
    const newPart: WorkOrderPart = {
      id: Date.now().toString(),
      name: customPartName,
      qty: 1,
      unitCost: unitPrice,
      totalCost: unitPrice,
    };

    setSelectedParts([...selectedParts, newPart]);
    setCustomPartName('');
    setCustomPartCost('');
  };

  const handleRemovePart = (id: string) => {
    setSelectedParts(selectedParts.filter((p) => p.id !== id));
  };

  const handleUpdateQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setSelectedParts(
      selectedParts.map((p) =>
        p.id === id ? { ...p, qty: newQty, totalCost: newQty * p.unitCost } : p
      )
    );
  };

  const filteredJobs = jobCards.filter((job) => {
    const matchesTab = activeTab === 'ALL' || job.status === activeTab;
    const matchesSearch =
      job.customerName.toLowerCase().includes(search.toLowerCase()) ||
      job.phone.includes(search) ||
      job.vehicleModel.toLowerCase().includes(search.toLowerCase()) ||
      job.registrationNo.toLowerCase().includes(search.toLowerCase()) ||
      job.jobId.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when search or tab changes
  useEffect(() => { setCurrentPage(1); }, [search, activeTab]);

  const handleCreateJob = async () => {
    if (!customerName || !vehicleModel || !registrationNo) {
      toast.error('Please fill in Customer Name, Vehicle Model, and Registration Number.');
      return;
    }
    setIsSubmitting(true);

    try {
      await createJobCardApi({
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        customerName,
        phone: phone || '+91 98000 00000',
        vehicleModel,
        registrationNo,
        description: serviceType || 'General Inspection & Maintenance',
        mechanicName: mechanic,
        estimatedCost: totalEstimatedCost,
        parts: selectedParts.map(p => ({ partId: p.partId, qty: p.qty })).filter(p => p.partId),
      });
      toast.success(`Job Card created & saved to database successfully!`);
      await fetchLiveJobCards();
    } catch (e) {
      console.warn('Create job card API call notice:', e);
      toast.error('Failed to save job card to database.');
    }

    setNewJobModalOpen(false);
    setCustomerName('');
    setPhone('');
    setVehicleModel('');
    setRegistrationNo('');
    setServiceType('');
    setSelectedCustomerId('');
    setSelectedVehicleId('');
    setMechanic('');
    setSelectedParts([]);
    setLaborCost('');
    setIsSubmitting(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const oldJob = jobCards.find((j) => j.id === id);
    if (oldJob) {
      const STATUS_ORDER: Record<string, number> = { 'PENDING': 0, 'IN_PROGRESS': 1, 'COMPLETED': 2, 'DELIVERED': 3 };
      if (STATUS_ORDER[newStatus] < STATUS_ORDER[oldJob.status]) {
        if (!window.confirm(`Are you sure you want to revert status from ${oldJob.status} to ${newStatus}?`)) return;
      }
    }

    setJobCards(jobCards.map(j => j.id === id ? { ...j, status: newStatus as any } : j));
    try {
      await updateJobCardStatus(id, newStatus);
      await fetchLiveJobCards();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update job status.');
    }
  };

  const handleOpenPayment = (job: JobCardItem) => {
    setSelectedJob(job);
    setPaymentModalOpen(true);
  };
  const handleScanResult = (code: string) => {
    toast.success(`Barcode Scanned: ${code}\nItem SKU attached to job card!`);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-canvas)' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PageLoader text="Loading Job Cards..." />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={22} color="var(--text-main)" /> Job Cards Management
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Create vehicle repair work orders and track mechanic workflow status.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setBarcodeModalOpen(true)} className="btn-secondary">
              <Camera size={15} color="var(--text-main)" /> Scan Barcode
            </button>

            <button onClick={() => setNewJobModalOpen(true)} className="btn-primary">
              <Plus size={15} color="var(--bg-card)" /> Create Job Card
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="glass-card" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '360px' }}>
            <input
              type="text"
              className="input-glass"
              placeholder="Search by customer, vehicle plate, or job ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-canvas)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeTab === tab ? '#18181b' : 'transparent',
                  color: activeTab === tab ? 'var(--bg-card)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Job Cards Table */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Job ID / Date</th>
                <th style={{ padding: '10px 8px' }}>Vehicle & Owner</th>
                <th style={{ padding: '10px 8px' }}>Service Details</th>
                <th style={{ padding: '10px 8px' }}>Assigned Mechanic</th>
                <th style={{ padding: '10px 8px' }}>Est. Cost</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.map((job) => {
                const statusClass =
                  job.status === 'PENDING'
                    ? 'badge-pending'
                    : job.status === 'IN_PROGRESS'
                    ? 'badge-progress'
                    : job.status === 'COMPLETED'
                    ? 'badge-completed'
                    : 'badge-delivered';

                return (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>{job.jobId}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{job.createdAt}</span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>{job.vehicleModel}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{job.registrationNo} • {job.customerName}</span>
                    </td>

                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      {job.serviceType}
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={13} color="var(--text-muted)" /> {job.assignedMechanic}
                      </span>
                    </td>

                    <td style={{ padding: '12px 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                      ₹{formatCurrency(job.estimatedCost)}
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <select 
                        className={`badge ${statusClass}`}
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        style={{ outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', border: 'none', fontSize: '11px', paddingRight: '12px' }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </select>
                    </td>

                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setViewModalOpen(true);
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-canvas)',
                            color: 'var(--text-main)',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        {job.status !== 'DELIVERED' && (
                          <button
                            onClick={() => handleOpenPayment(job)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Collect Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredJobs.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No Job Cards Found"
              description="No job cards match your current tab or search criteria. Create a new job card to get started."
              actionLabel="+ Create New Job Card"
              onAction={() => setNewJobModalOpen(true)}
            />
          )}

          {/* Pagination Controls */}
          {filteredJobs.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '12px' }}
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

        {/* Full-Screen Create New Job Card View */}
        {newJobModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--bg-canvas)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 36px',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    Create New Repair Work Order &amp; Job Card
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Enter customer details, assign mechanic, select spare parts to replace &amp; calculate total repair costs.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setNewJobModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: 'var(--bg-card)',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateJob}
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 22px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="spin-animation" /> Saving...</>
                  ) : (
                    <><Check size={16} /> Save &amp; Issue Work Order</>
                  )}
                </button>
                <button
                  onClick={() => setNewJobModalOpen(false)}
                  style={{
                    background: 'var(--bg-canvas)',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    marginLeft: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ──────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* 1. Customer & Vehicle Details (Autofill 2 Powered) */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--bg-canvas)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={17} color="#18181b" />
                      <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        1. Customer &amp; Vehicle Identification (Autofill 2)
                      </h3>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '600' }}>
                      ⚡ Type to search Customer or Registration Plate
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                    {/* Customer Name with Autofill 2 floating lookup */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Customer Name *</span>
                        {liveCustomers.some((c: any) => c.name.toLowerCase() === customerName.toLowerCase().trim() && customerName.trim() !== '') && (
                          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700' }}>Matched ✓</span>
                        )}
                      </label>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Type letters to search customer (e.g. Rahul)..."
                          value={customerName}
                          onFocus={() => setShowCustSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowCustSuggestions(false), 200)}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            setShowCustSuggestions(true);
                            const matched = liveCustomers.find((c: any) => c.name.toLowerCase() === e.target.value.toLowerCase().trim());
                            if (matched) {
                              setPhone(matched.phone || '');
                              if (matched.vehicles && matched.vehicles.length > 0) {
                                setVehicleModel(matched.vehicles[0].model || '');
                                setRegistrationNo(matched.vehicles[0].registrationNo || '');
                              }
                            }
                          }}
                          style={{ width: '100%', padding: '9px 30px 9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        />
                        {customerName && (
                          <button
                            type="button"
                            onClick={() => { setCustomerName(''); setPhone(''); setShowCustSuggestions(false); }}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Floating Customer Suggestions Popup */}
                      {showCustSuggestions && customerName.trim().length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '180px', overflowY: 'auto', zIndex: 100 }}>
                          {liveCustomers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase().trim()) || c.phone.includes(customerName.trim())).length > 0 ? (
                            liveCustomers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase().trim()) || c.phone.includes(customerName.trim())).map(c => (
                              <div
                                key={c.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCustomerName(c.name);
                                  setPhone(c.phone || c.customerPhone || '');
                                  setSelectedCustomerId(c.id);
                                  if (c.vehicles && c.vehicles.length > 0) {
                                    setVehicleModel(`${c.vehicles[0].make} ${c.vehicles[0].model}`);
                                    setRegistrationNo(c.vehicles[0].registrationNo || '');
                                    setSelectedVehicleId(c.vehicles[0].id);
                                  }
                                  setShowCustSuggestions(false);
                                }}
                                style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                              >
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{c.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.phone} {c.vehicles && c.vehicles[0] ? `• ${c.vehicles[0].make} ${c.vehicles[0].model}` : ''}</div>
                                </div>
                                <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>Autofill ⚡</span>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>No matching customer found. New customer entry.</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+91 98230 11223"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <Autofill2Field
                      label="Vehicle Make & Model"
                      placeholder="e.g. Honda City i-VTEC..."
                      value={vehicleModel}
                      onChange={setVehicleModel}
                      options={vehicleModels.length > 0 ? vehicleModels : ['General Car']}
                      required
                    />

                    {/* Registration Number with Autofill 2 Lookup */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Registration Number *</span>
                        {liveVehicles.some(v => v.registrationNo.toLowerCase() === registrationNo.toLowerCase().trim() && registrationNo.trim() !== '') && (
                          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700' }}>Matched ✓</span>
                        )}
                      </label>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="e.g. MH12 AB 1234..."
                          value={registrationNo}
                          onFocus={() => setShowRegSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowRegSuggestions(false), 200)}
                          onChange={(e) => {
                            setRegistrationNo(e.target.value);
                            setShowRegSuggestions(true);
                            const matched = liveVehicles.find(v => v.registrationNo.toLowerCase() === e.target.value.toLowerCase().trim());
                            if (matched) {
                              setCustomerName(matched.customerName);
                              setPhone(matched.phone || matched.customerPhone || '');
                              setVehicleModel(matched.makeModel || matched.model || '');
                              setSelectedVehicleId(matched.id);
                              if (matched.customer) {
                                setSelectedCustomerId(matched.customer.id);
                              }
                            }
                          }}
                          style={{ width: '100%', padding: '9px 30px 9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box', textTransform: 'uppercase' }}
                        />
                        {registrationNo && (
                          <button
                            type="button"
                            onClick={() => { setRegistrationNo(''); setShowRegSuggestions(false); }}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Floating Vehicle Reg Plate Suggestions */}
                      {showRegSuggestions && registrationNo.trim().length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '180px', overflowY: 'auto', zIndex: 100 }}>
                          {liveVehicles.filter(v => v.registrationNo.toLowerCase().includes(registrationNo.toLowerCase().trim())).length > 0 ? (
                            liveVehicles.filter(v => v.registrationNo.toLowerCase().includes(registrationNo.toLowerCase().trim())).map(v => (
                              <div
                                key={v.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setRegistrationNo(v.registrationNo);
                                  setVehicleModel(v.makeModel || v.model || '');
                                  setCustomerName(v.customerName);
                                  setPhone(v.phone || v.customerPhone || '');
                                  setSelectedVehicleId(v.id);
                                  if (v.customer) {
                                    setSelectedCustomerId(v.customer.id);
                                  }
                                  setShowRegSuggestions(false);
                                }}
                                style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                              >
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{v.registrationNo}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{v.makeModel || v.model} • {v.customerName}</div>
                                </div>
                                <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>Autofill ⚡</span>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>New vehicle registration plate.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Service Request & Mechanic Assignment (Autofill 2) */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid var(--bg-canvas)' }}>
                    <Wrench size={17} color="#18181b" />
                    <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      2. Service Request &amp; Lead Mechanic Assignment
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
                    <Autofill2Field
                      label="Service Requested / Reported Issue"
                      placeholder="e.g. Full Inspection, Oil Service & Brake Replacement..."
                      value={serviceType}
                      onChange={setServiceType}
                      options={serviceTypes}
                    />

                    <Autofill2Field
                      label="Assign Lead Mechanic"
                      placeholder="Type to search mechanic..."
                      value={mechanic}
                      onChange={setMechanic}
                      options={mechanicsList}
                    />
                  </div>
                </div>

                {/* 3. Spare Parts & Replacement Items Selection Area */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--bg-canvas)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={17} color="#18181b" />
                      <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        3. Replacement Spare Parts &amp; Items
                      </h3>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {selectedParts.length} Items Added
                    </span>
                  </div>

                  {/* Catalog Search Row (Autofill 2 Searchable) */}
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>
                      Search Spare Parts Catalog:
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search catalog parts by typing (e.g. Engine Oil, Brake Pads)..."
                        value={partSearch}
                        onFocus={() => setShowPartSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowPartSuggestions(false), 200)}
                        onChange={(e) => {
                          setPartSearch(e.target.value);
                          setShowPartSuggestions(true);
                        }}
                        style={{ width: '100%', padding: '9px 30px 9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box', background: 'var(--bg-card)' }}
                      />
                      {partSearch && (
                        <button
                          type="button"
                          onClick={() => { setPartSearch(''); setShowPartSuggestions(false); }}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Floating Spare Parts Suggestions List */}
                    {showPartSuggestions && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', zIndex: 100 }}>
                        {catalogParts.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase().trim())).length > 0 ? (
                          catalogParts.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase().trim())).map((p, idx) => (
                            <div
                              key={p.id || idx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const newPart: WorkOrderPart = {
                                  id: p.id || Date.now().toString(),
                                  partId: p.id,
                                  name: p.name,
                                  qty: 1,
                                  unitCost: p.price ?? 0,
                                  totalCost: p.price ?? 0,
                                };
                                setSelectedParts([...selectedParts, newPart]);
                                setPartSearch('');
                                setShowPartSuggestions(false);
                              }}
                              style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                            >
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{p.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Stock: {p.quantity})</div>
                              </div>
                              <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '3px 10px', borderRadius: '6px' }}>
                                + Add ₹{(p.price || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>No catalog part found. Enter custom item below.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Custom Item Entry Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: '12px', marginBottom: '18px' }}>
                    <input
                      type="text"
                      placeholder="Or enter custom part name (e.g. Headlight Bulb)"
                      value={customPartName}
                      onChange={(e) => setCustomPartName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={customPartCost}
                      onChange={(e) => setCustomPartCost(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPart}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#18181b', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={15} /> Add Custom Item
                    </button>
                  </div>

                  {/* Selected Parts List Table */}
                  {selectedParts.length > 0 ? (
                    <div style={{ borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px' }}>
                            <th style={{ padding: '10px 14px' }}>Part Description</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Unit Price</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total (₹)</th>
                            <th style={{ padding: '10px 10px', textAlign: 'center', width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedParts.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--bg-canvas)', background: 'var(--bg-card)' }}>
                              <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-main)' }}>{p.name}</td>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', background: 'var(--bg-card)' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(p.id, p.qty - 1)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '14px', color: '#475569' }}
                                  >
                                    -
                                  </button>
                                  <span style={{ fontWeight: '700', fontSize: '13px', minWidth: '18px', textAlign: 'center' }}>{p.qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(p.id, p.qty + 1)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '14px', color: '#475569' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                ₹{p.unitCost.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                                ₹{p.totalCost.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePart(p.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      No replacement spare parts added yet. Search catalog above or enter custom item.
                    </div>
                  )}
                </div>

                {/* 4. Labor Charges & Grand Total Estimate */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        Labor &amp; Workshop Service Fee (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="1500"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ background: 'var(--bg-canvas)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <span>Spare Parts Subtotal:</span>
                        <strong>₹{partsSubtotal.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Labor &amp; Service Charges:</span>
                        <strong>₹{(Number(laborCost) || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '900', color: 'var(--text-main)', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
                        <span>Grand Estimated Total:</span>
                        <span style={{ color: 'var(--success)' }}>₹{totalEstimatedCost.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedJob && (
          <PaymentModal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            jobCardId={selectedJob.jobId}
            totalAmount={selectedJob.estimatedCost}
            customerName={selectedJob.customerName}
            vehicleNo={selectedJob.vehicleModel}
          />
        )}

        <BarcodeScannerModal
          isOpen={barcodeModalOpen}
          onClose={() => setBarcodeModalOpen(false)}
          onScanResult={handleScanResult}
        />

        {/* View Modal */}
        {viewModalOpen && selectedJob && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Job Card Details</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => window.print()} style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                    <Printer size={16} /> Print
                  </button>
                  <button onClick={() => setViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <X size={24} color="#64748b" />
                  </button>
                </div>
              </div>
              <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Job ID</span>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{selectedJob.jobId}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Status</span>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginTop: '4px' }}>{selectedJob.status.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Customer</span>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{selectedJob.customerName}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedJob.phone}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Vehicle</span>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{selectedJob.vehicleModel}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedJob.registrationNo}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Service Type</span>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>{selectedJob.serviceType}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Assigned Mechanic</span>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>{selectedJob.assignedMechanic}</div>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#475569' }}>Total Estimated Cost</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>₹{formatCurrency(selectedJob.estimatedCost)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
