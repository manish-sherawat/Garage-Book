'use client';
import { useToast } from '@/components/ToastProvider';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/utils/format';
import {
  Car,
  Plus,
  Search,
  Wrench,
  Calendar,
  Fuel,
  Gauge,
  User,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  Tag,
  X,
  Check,
  Trash2,
  Palette,
  MapPin,
  Users,
  Upload,
  Loader2,
} from 'lucide-react';
import Snackbar from '@/components/Snackbar';

// Removed INITIAL imports

import Autofill2Field from '@/components/Autofill2Field';

import { getCustomers, getVehicles } from '@/utils/api';
import PageLoader from '@/components/PageLoader';

function VehiclesContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterFuel, setFilterFuel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setAddModalOpen(true);
    }
  }, [searchParams]);

  const fetchLiveCustomers = async () => {
    const apiCusts = await getCustomers();
    if (apiCusts && Array.isArray(apiCusts)) {
      setExistingCustomers(
        apiCusts.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || '',
          gender: c.gender || 'Male',
          address: c.address || '',
          vehicles: c.vehicles ? c.vehicles.map((v: any) => ({ model: `${v.make} ${v.model}`, registrationNo: v.registrationNo, fuelType: v.fuelType })) : [],
          totalSpent: 0,
          lastVisit: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          serviceReminders: 0,
        }))
      );
    }
  };

  const fetchLiveVehicles = async () => {
    const apiVehicles = await getVehicles();
    if (apiVehicles && Array.isArray(apiVehicles)) {
      setVehicles(apiVehicles.map((v: any) => {
        const lastJob = v.jobCards && v.jobCards.length > 0 ? v.jobCards[0] : null;
        let derivedStatus = 'SERVICED';
        if (lastJob) {
          if (lastJob.status === 'PENDING' || lastJob.status === 'IN_PROGRESS') {
            derivedStatus = 'IN_WORKSHOP';
          }
        } else {
          // If no job cards but created recently, SERVICED, else SERVICE_DUE
          const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
          // if we don't have created date, default to SERVICED for now
          derivedStatus = 'SERVICED';
        }

        return {
          id: v.id,
          registrationNo: v.registrationNo,
          makeModel: `${v.make} ${v.model}`,
          year: v.year || 2024,
          color: v.color || 'Pearl White',
          customerName: v.customer?.name || 'Unknown',
          phone: v.customer?.phone || 'Unknown',
          fuelType: v.fuelType,
          odometerKm: v.odometer || 0,
          lastServiceDate: lastJob ? new Date(lastJob.createdAt || Date.now()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          nextDueDate: lastJob ? new Date(new Date(lastJob.createdAt || Date.now()).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: derivedStatus as any,
          totalServicesCount: v.jobCards ? v.jobCards.length : 0,
          totalSpent: v.jobCards ? v.jobCards.reduce((acc: number, j: any) => acc + (j.payments ? j.payments.reduce((pAcc: number, p: any) => pAcc + p.amount, 0) : 0), 0) : 0,
        };
      }));
    }
  };

  useEffect(() => {
    Promise.all([fetchLiveCustomers(), fetchLiveVehicles()]).finally(() => setIsLoading(false));
  }, []);

  // Brand / Manufacturer State
  const [brands, setBrands] = useState<string[]>([
    'Honda',
    'Hyundai',
    'Mahindra',
    'Tata',
    'Maruti Suzuki',
    'Toyota',
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Ford',
    'Kia',
    'Volkswagen',
    'Skoda',
    'Nissan',
    'Renault',
  ]);
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [addBrandModalOpen, setAddBrandModalOpen] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');

  interface RegisteredVehicle {
    id: string;
    registrationNo: string;
    makeModel: string;
    customerName: string;
    phone: string;
    year: number;
    color: string;
    fuelType: string;
    odometerKm: number;
    lastServiceDate: string;
    nextDueDate: string;
    status: 'ACTIVE' | 'IN_SERVICE' | 'PENDING_PICKUP' | 'SERVICED' | 'IN_WORKSHOP' | 'SERVICE_DUE';
    totalServicesCount: number;
    totalSpent: number;
  }
  const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);

  // ── Existing Customers (Fetched from Customer Tab) ──
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // ── Modal Form State ──────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState<RegisteredVehicle['fuelType']>('Petrol');
  const [odometerKm, setOdometerKm] = useState('');

  // ── Vehicle Type dropdown ─────────────────────────────────────────────────
  const [vehicleTypes, setVehicleTypes] = useState(['Car', 'Motorcycle', 'Scooter', 'Truck', 'Van', 'Auto-Rickshaw', 'Electric Vehicle']);
  const [formVehicleType, setFormVehicleType] = useState('');
  const [addVehicleTypeVal, setAddVehicleTypeVal] = useState('');

  // ── Vehicle Name dropdown ─────────────────────────────────────────────────
  const [vehicleNames, setVehicleNames] = useState(['City', 'Creta', 'Swift', 'Nexon', 'Thar', 'Innova', 'Brezza', 'i20', 'Seltos', 'Fortuner', 'Jupiter', 'Activa', 'Splendor', 'Pulsar']);
  const [formVehicleName, setFormVehicleName] = useState('');
  const [addVehicleNameVal, setAddVehicleNameVal] = useState('');

  // ── Vehicle Year dropdown ─────────────────────────────────────────────────
  const [vehicleYears, setVehicleYears] = useState(['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015']);
  const [formVehicleYear, setFormVehicleYear] = useState('');
  const [addVehicleYearVal, setAddVehicleYearVal] = useState('');

  // ── Vehicle Color dropdown ────────────────────────────────────────────────
  const [vehicleColors, setVehicleColors] = useState(['Pearl White', 'Metallic Grey', 'Midnight Black', 'Racing Red', 'Ocean Blue', 'Forest Green', 'Royal Silver', 'Champagne Gold']);
  const [formVehicleColor, setFormVehicleColor] = useState('');
  const [addVehicleColorVal, setAddVehicleColorVal] = useState('');

  // ── Model Name / Variant dropdown ─────────────────────────────────────────
  const [vehicleModelNames, setVehicleModelNames] = useState(['i-VTEC', 'SX', 'ZXi', 'ZX', '4x4', 'Crysta', 'VXI', 'Sigma', 'EV Max', 'LX', '125', 'Base', 'Plus', 'Pro']);
  const [formVehicleModel, setFormVehicleModel] = useState('');
  const [addVehicleModelVal, setAddVehicleModelVal] = useState('');

  // ── Number Plate ──────────────────────────────────────────────────────────
  const [numberPlate, setNumberPlate] = useState('');

  // ── Service Type dropdown ─────────────────────────────────────────────────
  const [serviceTypes, setServiceTypes] = useState(['General Service', 'Oil Change', 'Brake Service', 'AC Service', 'Engine Overhaul', 'Tyre Rotation', 'Battery Replacement', 'Suspension Check', 'Wheel Alignment', 'Periodic Maintenance', 'Body Work']);
  const [formServiceType, setFormServiceType] = useState('');
  const [addServiceTypeVal, setAddServiceTypeVal] = useState('');

  // ── Service Details ───────────────────────────────────────────────────────
  const [totalServiceDone, setTotalServiceDone] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');

  const filteredVehicles = vehicles.filter((v) => {
    const makeModelStr = v.makeModel || '';
    const phoneStr = v.phone || '';

    const matchesSearch =
      v.registrationNo.toLowerCase().includes(search.toLowerCase()) ||
      makeModelStr.toLowerCase().includes(search.toLowerCase()) ||
      v.customerName.toLowerCase().includes(search.toLowerCase()) ||
      phoneStr.toLowerCase().includes(search.toLowerCase());

    const matchesFuel = filterFuel === 'ALL' || v.fuelType === filterFuel;
    const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
    const matchesBrand =
      selectedBrand === 'ALL' ||
      makeModelStr.toLowerCase().includes(selectedBrand.toLowerCase());

    return matchesSearch && matchesFuel && matchesStatus && matchesBrand;
  });

  const handleAddBrand = () => {
    if (!newBrandInput.trim()) return;
    const formatted = newBrandInput.trim();
    if (!brands.includes(formatted)) {
      const updated = [...brands, formatted].sort();
      setBrands(updated);
      setSelectedBrand(formatted);
      setFormBrand(formatted);
    }
    setNewBrandInput('');
    setAddBrandModalOpen(false);
  };

  const handleRemoveBrand = (brandToRemove: string) => {
    if (!brandToRemove || brandToRemove === 'ALL') {
      toast.error('Please select a specific brand from the dropdown menu to remove.');
      return;
    }
    if (confirm(`Remove "${brandToRemove}" brand from the dropdown menu?`)) {
      const updated = brands.filter((b) => b !== brandToRemove);
      setBrands(updated);
      if (selectedBrand === brandToRemove) {
        setSelectedBrand('ALL');
      }
      if (formBrand === brandToRemove) {
        setFormBrand(updated[0] || 'Honda');
      }
    }
  };

  const handleRegisterVehicle = async () => {
    if (!customerName || !registrationNo) {
      toast.error('Please fill in Customer Name and Registration Plate Number.');
      return;
    }
    setIsSubmitting(true);

    const vehicleNameStr = formVehicleName || makeModel;
    const fullMakeModel = `${formBrand} ${vehicleNameStr} ${formVehicleModel}`.trim();
    const regNo = registrationNo || numberPlate;

    const newVehicle: RegisteredVehicle = {
      id: Date.now().toString(),
      registrationNo: regNo.toUpperCase(),
      makeModel: fullMakeModel,
      color: 'Unknown',
      year: Number(formVehicleYear) || 2024,
      customerName,
      phone: phone || '+91 98000 00000',
      fuelType,
      odometerKm: Number(odometerKm) || 0,
      lastServiceDate: lastServiceDate || new Date().toISOString().split('T')[0],
      nextDueDate: nextServiceDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'SERVICED',
      totalServicesCount: Number(totalServiceDone) || 1,
      totalSpent: 0,
    };

    setVehicles([newVehicle, ...vehicles]);

    try {
      const { createCustomer: createCustomerApi, createVehicle: createVehicleApi } = await import('@/utils/api');
      if (selectedCustomerId) {
        await createVehicleApi({
          customerId: selectedCustomerId,
          registrationNo: regNo.toUpperCase(),
          make: formBrand,
          model: vehicleNameStr + ' ' + formVehicleModel,
          fuelType: fuelType,
          year: Number(formVehicleYear) || 2024,
          color: formVehicleColor || 'Pearl White',
          odometer: Number(odometerKm) || 0
        });
      } else {
        await createCustomerApi({
          name: customerName,
          phone: phone || `CUST_${Date.now()}`,
          email: `${customerName.toLowerCase().replace(/\\s+/g, '.')}@gmail.com`,
          address: 'Pune, Maharashtra',
          vehicles: [{ 
            make: formBrand,
            model: vehicleNameStr + ' ' + formVehicleModel,
            registrationNo: regNo.toUpperCase(), 
            fuelType: fuelType,
            year: Number(formVehicleYear) || 2024,
            color: formVehicleColor || 'Pearl White',
            odometer: Number(odometerKm) || 0
          }],
        });
      }
      await fetchLiveCustomers();
      await fetchLiveVehicles();
    } catch (e) {
      console.warn('Register vehicle API call notice:', e);
      setToastMessage({ type: 'error', text: 'Failed to register vehicle.' });
    }
    
    setToastMessage({ type: 'success', text: `Vehicle ${regNo} registered successfully!` });
    setAddModalOpen(false);
    // reset
    setCustomerName('');
    setPhone('');
    setSelectedCustomerId('');
    setRegistrationNo('');
    setMakeModel('');
    setNumberPlate('');
    setFormVehicleType('Car');
    setFormVehicleName('City');
    setFormVehicleYear('2024');
    setFormVehicleColor('Pearl White');
    setFormVehicleModel('i-VTEC');
    setFormServiceType('General Service');
    setTotalServiceDone('');
    setNextServiceDate('');
    setLastServiceDate('');
    setOdometerKm('0');
    setIsSubmitting(false);
  };

  const totalRegistered = vehicles.length;
  const inWorkshopCount = vehicles.filter((v) => v.status === 'IN_WORKSHOP').length;
  const serviceDueCount = vehicles.filter((v) => v.status === 'SERVICE_DUE').length;
  const fleetLifetimeValue = vehicles.reduce((sum, v) => sum + (v.totalSpent || 0), 0);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-canvas)' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PageLoader text="Loading Vehicles..." />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />
      {toastMessage && (
        <Snackbar message={toastMessage.text} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}

      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Car size={22} color="var(--text-main)" /> Vehicle Registry & Serviced Fleet
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Comprehensive database of customer vehicles, service logs, mileage records, and active workshop status.
            </p>
          </div>

          <button onClick={() => setAddModalOpen(true)} className="btn-primary">
            <Plus size={15} color="var(--bg-card)" /> Register New Vehicle
          </button>
        </div>

        {/* Top Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Registered Fleet</span>
              <Car size={16} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{totalRegistered}</div>
            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '500' }}>Active Customer Vehicles</span>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Currently In Workshop</span>
              <Wrench size={16} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{inWorkshopCount}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Under Maintenance Today</span>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Service Due Soon</span>
              <Clock size={16} color="var(--warning)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)' }}>{serviceDueCount}</div>
            <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '500' }}>Reminders Sent</span>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Fleet Lifetime Value</span>
              <Tag size={16} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {formatCurrency(fleetLifetimeValue)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '500' }}>Total Service Revenue</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-card" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              className="input-glass"
              placeholder="Search by reg plate, vehicle model, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>

          {/* Brand / Manufacturer Filter, Plus (+), and Remove (-) Buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Tag size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Brand:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select
                className="input-glass"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{ background: 'var(--bg-card)', padding: '6px 10px', fontSize: '12px', minWidth: '140px', fontWeight: '600' }}
              >
                <option value="ALL">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddBrandModalOpen(true)}
                title="Add new Brand / Manufacturer to dropdown menu"
                style={{
                  background: '#18181b',
                  color: 'var(--bg-card)',
                  border: 'none',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '700',
                  transition: 'all 0.15s ease',
                }}
              >
                +
              </button>

              <button
                type="button"
                onClick={() => handleRemoveBrand(selectedBrand)}
                disabled={selectedBrand === 'ALL'}
                title={selectedBrand === 'ALL' ? 'Select a brand to remove' : `Remove "${selectedBrand}" brand from dropdown`}
                style={{
                  background: selectedBrand === 'ALL' ? 'var(--bg-canvas)' : 'var(--danger)',
                  color: selectedBrand === 'ALL' ? '#94a3b8' : 'var(--bg-card)',
                  border: 'none',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: selectedBrand === 'ALL' ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Fuel Filter */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Fuel Type:</span>
            <select
              className="input-glass"
              value={filterFuel}
              onChange={(e) => setFilterFuel(e.target.value)}
              style={{ background: 'var(--bg-card)', padding: '6px 10px', fontSize: '12px' }}
            >
              <option value="ALL">All Fuels</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="EV">EV & Hybrid</option>
              <option value="CNG">CNG</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-canvas)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {(['ALL', 'IN_WORKSHOP', 'SERVICED', 'SERVICE_DUE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: filterStatus === st ? '#18181b' : 'transparent',
                  color: filterStatus === st ? 'var(--bg-card)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Registration Plate</th>
                <th style={{ padding: '10px 8px' }}>Make, Model & Year</th>
                <th style={{ padding: '10px 8px' }}>Owner Info</th>
                <th style={{ padding: '10px 8px' }}>Odometer & Fuel</th>
                <th style={{ padding: '10px 8px' }}>Last Serviced / Next Due</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => {
                const statusClass =
                  v.status === 'IN_WORKSHOP'
                    ? 'badge-progress'
                    : v.status === 'SERVICED'
                    ? 'badge-completed'
                    : 'badge-pending';

                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          background: 'var(--bg-canvas)',
                          border: '1px solid #cbd5e1',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '800',
                          fontSize: '12.5px',
                          color: 'var(--text-main)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {v.registrationNo}
                      </span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>{v.makeModel}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Year {v.year}</span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600', display: 'block' }}>
                        {v.customerName}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{v.phone}</span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: '600' }}>
                        <Gauge size={13} color="var(--text-muted)" /> {(v.odometerKm || 0).toLocaleString()} km
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <Fuel size={11} color="var(--text-muted)" /> {v.fuelType}
                      </span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-main)', display: 'block' }}>
                        {v.lastServiceDate}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Next: {v.nextDueDate}</span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${statusClass}`}>{v.status.replace('_', ' ')}</span>
                    </td>

                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => window.location.href = `/jobs?register=true&registrationNo=${v.registrationNo}`}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #18181b',
                            background: '#18181b',
                            color: 'var(--bg-card)',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          + Job Card
                        </button>
                        <button
                          onClick={() => window.location.href = `/customers?search=${v.registrationNo}`}
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
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredVehicles.length === 0 && (
            <EmptyState
              icon={Car}
              title="No Registered Vehicles Found"
              description="No vehicle records match your search or brand filter. Click below to register a new vehicle."
              actionLabel="+ Register New Vehicle"
              onAction={() => setAddModalOpen(true)}
            />
          )}
        </div>

        {/* Full-Screen Register New Vehicle Form */}
        {addModalOpen && (
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 36px',
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-color)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#18181b', color: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Register New Customer Vehicle</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Vehicle Registry &amp; Serviced Fleet — add vehicle type, brand, model, service history &amp; more.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button type="button" onClick={() => setAddModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: 'var(--bg-card)', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleRegisterVehicle}
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#18181b', color: 'var(--bg-card)', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                  {isSubmitting ? (
                    <><Loader2 size={16} className="spin-animation" /> Saving...</>
                  ) : (
                    <><Check size={16} /> Save &amp; Register Vehicle</>
                  )}
                </button>
                <button onClick={() => setAddModalOpen(false)}
                  style={{ background: 'var(--bg-canvas)', border: 'none', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '4px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ──────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Section A: Owner Details */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid var(--bg-canvas)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={17} color="#18181b" />
                      <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        A. Owner / Customer Details
                      </h3>
                    </div>
                    {selectedCustomerId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={13} /> Auto-filled from Customer Tab ({selectedCustomerId})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId('');
                            setCustomerName('');
                            setPhone('');
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        💡 Start typing name to search &amp; auto-fill from Customer tab
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    {/* Customer Name Field with Live Autocomplete Floating List */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Customer Name *</span>
                        {selectedCustomerId && <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700' }}>Matched ✓</span>}
                      </label>
                      
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Type letters to search customer (e.g. Rahul)..."
                          value={customerName}
                          onFocus={() => setShowCustomerSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomerName(val);
                            setShowCustomerSuggestions(true);
                            const matched = existingCustomers.find((c) => c.name.toLowerCase() === val.toLowerCase());
                            if (matched) {
                              setPhone(matched.phone);
                              setSelectedCustomerId(matched.id);
                            } else if (selectedCustomerId) {
                              setSelectedCustomerId('');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '9px 30px 9px 12px',
                            borderRadius: '8px',
                            border: selectedCustomerId ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            boxSizing: 'border-box',
                            background: 'var(--bg-card)',
                          }}
                        />
                        {customerName && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerName('');
                              setPhone('');
                              setSelectedCustomerId('');
                              setShowCustomerSuggestions(false);
                            }}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Interactive Floating Match List on Typing */}
                      {showCustomerSuggestions && customerName.trim().length > 0 && !selectedCustomerId && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            background: 'var(--bg-card)',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            zIndex: 100,
                          }}
                        >
                          {existingCustomers.filter(
                            (c) =>
                              c.name.toLowerCase().includes(customerName.toLowerCase().trim()) ||
                              c.phone.toLowerCase().includes(customerName.toLowerCase().trim())
                          ).length > 0 ? (
                            existingCustomers
                              .filter(
                                (c) =>
                                  c.name.toLowerCase().includes(customerName.toLowerCase().trim()) ||
                                  c.phone.toLowerCase().includes(customerName.toLowerCase().trim())
                              )
                              .map((c) => (
                                <div
                                  key={c.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setCustomerName(c.name);
                                    setPhone(c.phone);
                                    setSelectedCustomerId(c.id);
                                    setShowCustomerSuggestions(false);
                                  }}
                                  style={{
                                    padding: '10px 14px',
                                    borderBottom: '1px solid var(--bg-canvas)',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-canvas)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                                >
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <User size={13} color="#2563eb" /> {c.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {c.phone} {c.address ? `• ${c.address}` : ''}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                                    Autofill ⚡
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                              No matching customer found in tab. New customer will be registered automatically.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Phone Number Field */}
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
                </div>

                {/* Section B: Vehicle Details — all 14 fields with Autofill 2 */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--bg-canvas)' }}>
                    <Car size={17} color="#18181b" />
                    <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>B. Vehicle Registration Details</h3>
                  </div>

                  {/* Row 1: Vehicle Type & Vehicle Brand */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                    <Autofill2Field
                      label="1. Vehicle Type"
                      placeholder="e.g. Car, Motorcycle, Scooter, Truck..."
                      value={formVehicleType}
                      onChange={setFormVehicleType}
                      options={vehicleTypes}
                      onAddOption={(newVal) => {
                        if (!vehicleTypes.includes(newVal)) setVehicleTypes([...vehicleTypes, newVal]);
                        setFormVehicleType(newVal);
                      }}
                    />

                    <Autofill2Field
                      label="2. Vehicle Brand"
                      placeholder="e.g. Honda, Hyundai, Mahindra, Tata..."
                      value={formBrand}
                      onChange={setFormBrand}
                      options={brands}
                      onAddOption={(newVal) => {
                        if (!brands.includes(newVal)) setBrands([...brands, newVal].sort());
                        setFormBrand(newVal);
                      }}
                    />
                  </div>

                  {/* Row 2: Vehicle Name & Vehicle Year */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                    <Autofill2Field
                      label="3. Vehicle Name"
                      placeholder="e.g. City, Creta, Swift, Nexon..."
                      value={formVehicleName}
                      onChange={setFormVehicleName}
                      options={vehicleNames}
                      onAddOption={(newVal) => {
                        if (!vehicleNames.includes(newVal)) setVehicleNames([...vehicleNames, newVal]);
                        setFormVehicleName(newVal);
                      }}
                    />

                    <Autofill2Field
                      label="4. Vehicle Year"
                      placeholder="e.g. 2026, 2025, 2024, 2023..."
                      value={formVehicleYear}
                      onChange={setFormVehicleYear}
                      options={vehicleYears}
                      onAddOption={(newVal) => {
                        if (!vehicleYears.includes(newVal)) setVehicleYears([newVal, ...vehicleYears]);
                        setFormVehicleYear(newVal);
                      }}
                    />
                  </div>

                  {/* Row 3: Fuel Type & Vehicle Color */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                    <Autofill2Field
                      label="5. Vehicle Fuel Type"
                      placeholder="e.g. Petrol, Diesel, EV, CNG..."
                      value={fuelType}
                      onChange={(val) => setFuelType(val as RegisteredVehicle['fuelType'])}
                      options={['Petrol', 'Diesel', 'EV', 'CNG', 'Hybrid', 'LPG']}
                    />

                    <Autofill2Field
                      label="6. Vehicle Color"
                      placeholder="e.g. Pearl White, Metallic Grey..."
                      value={formVehicleColor}
                      onChange={setFormVehicleColor}
                      options={vehicleColors}
                      onAddOption={(newVal) => {
                        if (!vehicleColors.includes(newVal)) setVehicleColors([...vehicleColors, newVal]);
                        setFormVehicleColor(newVal);
                      }}
                    />
                  </div>

                  {/* Row 4: Registration Number & Number Plate */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>7. Vehicle Registration Number *</label>
                      <input type="text" placeholder="e.g. MH12 AB 1234" value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box', textTransform: 'uppercase' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>9. Number Plate</label>
                      <input type="text" placeholder="e.g. MH 12 AB 1234" value={numberPlate} onChange={(e) => setNumberPlate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box', textTransform: 'uppercase' }} />
                    </div>
                  </div>

                  {/* Row 5: Model Name & Service Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                    <Autofill2Field
                      label="8. Model Name / Trim / Variant"
                      placeholder="e.g. i-VTEC, SX, ZXi, ZX..."
                      value={formVehicleModel}
                      onChange={setFormVehicleModel}
                      options={vehicleModelNames}
                      onAddOption={(newVal) => {
                        if (!vehicleModelNames.includes(newVal)) setVehicleModelNames([...vehicleModelNames, newVal]);
                        setFormVehicleModel(newVal);
                      }}
                    />

                    <Autofill2Field
                      label="10. Service Type"
                      placeholder="e.g. General Service, Oil Change..."
                      value={formServiceType}
                      onChange={setFormServiceType}
                      options={serviceTypes}
                      onAddOption={(newVal) => {
                        if (!serviceTypes.includes(newVal)) setServiceTypes([...serviceTypes, newVal]);
                        setFormServiceType(newVal);
                      }}
                    />
                  </div>

                  {/* Row 6: Total Service Done & Service KMs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                    {/* 11. Total Service Done */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>11. Total Service Done (Count)</label>
                      <input type="number" min="0" placeholder="e.g. 4" value={totalServiceDone} onChange={(e) => setTotalServiceDone(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                    </div>
                    {/* 14. Service KMs */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>14. Service KMs / Odometer Reading</label>
                      <input type="text" placeholder="e.g. 34500" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* Row 7: Last Service Date & Next Service Date */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* 13. Last Service Date */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>13. Last Service Date</label>
                      <input type="date" value={lastServiceDate} onChange={(e) => setLastServiceDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                    </div>
                    {/* 12. Next Service Date */}
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '5px' }}>12. Next Service Date</label>
                      <input type="date" value={nextServiceDate} onChange={(e) => setNextServiceDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* Live Preview Strip */}
                  {(formBrand || formVehicleName) && (
                    <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#18181b', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>PREVIEW</span>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {formVehicleYear} {formBrand} {formVehicleName} {formVehicleModel} • {fuelType} • {formVehicleColor} • {formVehicleType}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {registrationNo && <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: '700', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>{registrationNo.toUpperCase()}</span>}
                        {fuelType && <span style={{ background: '#dcfce7', color: 'var(--success)', fontWeight: '700', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>{fuelType}</span>}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Add Brand / Manufacturer Modal */}
        {addBrandModalOpen && (
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
                width: '400px',
                maxWidth: '90vw',
                padding: '24px',
                borderRadius: '14px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} /> Add Vehicle Brand / Manufacturer
                </h3>
                <button
                  onClick={() => setAddBrandModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Volvo, Tesla, Porsche, BYD"
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setAddBrandModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBrand}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Check size={16} /> Add Brand
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VehiclesPage() {
  const toast = useToast();
  return (
    <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Vehicles Page...</div>}>
      <VehiclesContent />
    </Suspense>
  );
}
