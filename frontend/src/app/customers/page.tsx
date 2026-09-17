'use client';
import { useToast } from '@/components/ToastProvider';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/utils/format';
import { getCustomers, createCustomer as createCustomerApi, updateCustomer as updateCustomerApi, deleteCustomer as deleteCustomerApi } from '@/utils/api';
import {
  Users,
  Phone,
  Car,
  Calendar,
  MessageSquare,
  Search,
  Plus,
  UserPlus,
  Mail,
  MapPin,
  X,
  Check,
  Fuel,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  Wrench,
  CreditCard,
  Download,
  CheckCircle2,
  User,
  Eye,
  Upload,
  Loader2,
} from 'lucide-react';
import Snackbar from '@/components/Snackbar';
import PageLoader from '@/components/PageLoader';

import * as XLSX from 'xlsx';

  // Removed dead code
  interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gender?: string;
    totalSpent: number;
    vehicles: any[];
    jobCards: any[];
    lastVisit?: string;
    serviceReminders?: number;
  }
  
  export default function CustomersPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // ── Vehicle Form: Dropdown Option Lists (Add / Remove capable) ──────────────
  const [vehicleTypes, setVehicleTypes] = useState(['Car', 'Motorcycle', 'Scooter', 'Truck', 'Van', 'Auto-Rickshaw', 'Electric Vehicle']);
  const [vehicleBrands, setVehicleBrands] = useState(['Honda', 'Hyundai', 'Maruti Suzuki', 'Tata Motors', 'Mahindra', 'Toyota', 'Ford', 'Volkswagen', 'TVS', 'Bajaj', 'Hero', 'KTM', 'Royal Enfield']);
  const [vehicleNames, setVehicleNames] = useState(['City', 'Creta', 'Swift', 'Nexon', 'Thar', 'Innova', 'Brezza', 'i20', 'Seltos', 'Fortuner', 'Jupiter', 'Activa', 'Splendor', 'Pulsar']);
  const [vehicleYears, setVehicleYears] = useState(['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013']);
  const [vehicleColors, setVehicleColors] = useState(['Pearl White', 'Metallic Grey', 'Midnight Black', 'Racing Red', 'Ocean Blue', 'Forest Green', 'Royal Silver', 'Sandstorm Beige', 'Champagne Gold']);
  const [vehicleModelNames, setVehicleModelNames] = useState(['i-VTEC', 'SX', 'ZXi', 'ZX', '4x4', 'Crysta', 'VXI', 'Sigma', 'EV Max', 'LX', '125', 'Base', 'Plus', 'Pro']);
  const [serviceTypes, setServiceTypes] = useState(['General Service', 'Oil Change', 'Brake Service', 'AC Service', 'Engine Overhaul', 'Tyre Rotation', 'Battery Replacement', 'Suspension Check', 'Wheel Alignment', 'Periodic Maintenance', 'Body Work']);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── Vehicle Form: Selected Values ───────────────────────────────────────────
  const [formVehicleType, setFormVehicleType] = useState('');
  const [formVehicleBrand, setFormVehicleBrand] = useState('');
  const [formVehicleName, setFormVehicleName] = useState('');
  const [formVehicleYear, setFormVehicleYear] = useState('');
  const [formFuelType, setFormFuelType] = useState('');
  const [formVehicleColor, setFormVehicleColor] = useState('');
  const [formVehicleReg, setFormVehicleReg] = useState('');
  const [formVehicleModel, setFormVehicleModel] = useState('');
  const [formNumberPlate, setFormNumberPlate] = useState('');
  const [formServiceType, setFormServiceType] = useState('');
  const [formTotalServiceDone, setFormTotalServiceDone] = useState('');
  const [formNextServiceDate, setFormNextServiceDate] = useState('');
  const [formLastServiceDate, setFormLastServiceDate] = useState('');
  const [formServiceKMs, setFormServiceKMs] = useState('');

  // ── Add / Remove helpers for dropdown option lists ──────────────────────────
  const [addVehicleTypeVal, setAddVehicleTypeVal] = useState('');
  const [addVehicleBrandVal, setAddVehicleBrandVal] = useState('');
  const [addVehicleNameVal, setAddVehicleNameVal] = useState('');
  const [addVehicleYearVal, setAddVehicleYearVal] = useState('');
  const [addVehicleColorVal, setAddVehicleColorVal] = useState('');
  const [addVehicleModelVal, setAddVehicleModelVal] = useState('');
  const [addServiceTypeVal, setAddServiceTypeVal] = useState('');

  // Edit Customer State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editAddress, setEditAddress] = useState('');

  // Customer 360 Full Record Modal State
  const [view360Customer, setView360Customer] = useState<Customer | null>(null);
  const [active360Tab, setActive360Tab] = useState<'VEHICLES' | 'SERVICES' | 'PAYMENTS'>('VEHICLES');

  const handleOpen360View = (c: Customer) => {
    setView360Customer(c);
    setActive360Tab('VEHICLES');
  };

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('ALL');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.vehicles.some((v) => v.registrationNo.toLowerCase().includes(search.toLowerCase()));

    const matchesVehicleFilter =
      selectedVehicleFilter === 'ALL' ||
      c.vehicles.some((v) => v.registrationNo === selectedVehicleFilter);

    return matchesSearch && matchesVehicleFilter;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedVehicleFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const fetchLiveCustomers = async () => {
    const apiCusts = await getCustomers();
    if (apiCusts && Array.isArray(apiCusts)) {
      setCustomers(
        apiCusts.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || `${c.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          gender: c.gender || 'Male',
          address: c.address || 'Pune, Maharashtra',
          vehicles: c.vehicles ? c.vehicles.map((v: any) => ({ model: `${v.make} ${v.model}`, registrationNo: v.registrationNo, fuelType: v.fuelType })) : [],
          totalSpent: c.jobCards ? c.jobCards.reduce((acc: number, j: any) => acc + (j.payments ? j.payments.reduce((pAcc: number, p: any) => pAcc + p.amount, 0) : 0), 0) : 0,
          lastVisit: c.jobCards && c.jobCards.length > 0
            ? new Date(Math.max(...c.jobCards.map((j: any) => new Date(j.createdAt).getTime()))).toISOString().split('T')[0]
            : c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          serviceReminders: 0,
          jobCards: c.jobCards || [],
        }))
      );
    }
  };

  useEffect(() => {
    fetchLiveCustomers().finally(() => setIsLoading(false));
  }, []);

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `+91 ${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
    return phone;
  };

  const isValidEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddCustomer = async () => {
    if (!formName || !formPhone) {
      toast.error('Please fill in Customer Name and Phone Number.');
      return;
    }
    if (formEmail && !isValidEmail(formEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    const vehicleLabel = `${formVehicleBrand} ${formVehicleName} ${formVehicleModel} (${formVehicleYear})`.trim();
    const regNo = formVehicleReg || formNumberPlate;

    if (vehicleLabel && !regNo) {
      toast.error('Vehicle registration number is required to save the vehicle.');
      setIsSubmitting(false);
      return;
    }

    try {
      await createCustomerApi({
        name: formName,
        phone: formatPhoneNumber(formPhone),
        email: formEmail,
        address: formAddress,
        gender: formGender,
        vehicles: (vehicleLabel.trim() && regNo)
          ? [{ model: vehicleLabel, registrationNo: regNo, fuelType: formFuelType, make: formVehicleBrand }]
          : [],
      });
      await fetchLiveCustomers();
    } catch (err) {
      console.warn('Create customer API notice:', err);
      setToastMessage({ type: 'error', text: 'Failed to create customer.' });
    }
    setToastMessage({ type: 'success', text: `Customer ${formName} added successfully!` });

    setAddModalOpen(false);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormGender('Male');
    setFormAddress('');
    setFormVehicleType('Car');
    setFormVehicleBrand('Honda');
    setFormVehicleName('City');
    setFormVehicleYear('2024');
    setFormFuelType('Petrol');
    setFormVehicleColor('Pearl White');
    setFormVehicleReg('');
    setFormVehicleModel('i-VTEC');
    setFormNumberPlate('');
    setFormServiceType('General Service');
    setFormTotalServiceDone('');
    setFormNextServiceDate('');
    setFormLastServiceDate('');
    setFormServiceKMs('');
    setIsSubmitting(false);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditEmail(c.email || '');
    setEditGender(c.gender || 'Male');
    setEditAddress(c.address || '');
    setEditModalOpen(true);
  };

  const handleSaveCustomerEdit = async () => {
    if (!editingCustomer || !editName || !editPhone) {
      toast.error('Customer Name and Phone Number are required.');
      return;
    }
    if (editEmail && !isValidEmail(editEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      await updateCustomerApi(editingCustomer.id, {
        name: editName,
        phone: formatPhoneNumber(editPhone),
        email: editEmail,
        gender: editGender,
        address: editAddress,
      });
      await fetchLiveCustomers();
      setToastMessage({ type: 'success', text: `Customer updated successfully!` });
    } catch (err) {
      console.warn('Update customer API notice:', err);
      setToastMessage({ type: 'error', text: 'Failed to update customer.' });
    }

    setEditModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove customer "${name}"?`)) {
      try {
        await deleteCustomerApi(id);
        await fetchLiveCustomers();
        setToastMessage({ type: 'success', text: `Customer ${name} deleted successfully!` });
      } catch (err) {
        console.warn('Delete customer API notice:', err);
        setToastMessage({ type: 'error', text: 'Failed to delete customer.' });
      }
    }
  };

  const handleDownloadSampleXLSX = () => {
    const sampleData = [
      {
        'Customer Name': 'Rajesh Sharma',
        'Phone Number': '9876543210',
        'Email Address': 'rajesh@example.com',
        'Gender': 'Male',
        'Address': 'FC Road, Pune',
        'Vehicle Model': 'Honda City i-VTEC',
        'Registration Number': 'MH12 AB 1234',
        'Vehicle Type': 'Car',
      },
      {
        'Customer Name': 'Priya Deshmukh',
        'Phone Number': '9822012345',
        'Email Address': 'priya@example.com',
        'Gender': 'Female',
        'Address': 'Baner, Pune',
        'Vehicle Model': 'Hyundai Creta SX',
        'Registration Number': 'MH14 XY 9876',
        'Vehicle Type': 'Car',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'GarageBook_Customers_Sample_Template.xlsx');
  };

  const handleExportCustomersXLSX = () => {
    const exportData = customers.map((c) => ({
      'Customer ID': c.id,
      'Customer Name': c.name,
      'Phone Number': c.phone,
      'Email Address': c.email,
      'Gender': c.gender || 'Male',
      'Address': c.address,
      'Registered Vehicles': c.vehicles.map((v) => `${v.model} (${v.registrationNo})`).join(', '),
      'Total Spent (INR)': c.totalSpent,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers Registry');
    XLSX.writeFile(workbook, `GarageBook_Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportCustomersExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          toast.error('The uploaded file appears to be empty.');
          return;
        }

        const newCustomers: Customer[] = [];

        jsonData.forEach((row, idx) => {
          const name = String(row['Customer Name'] || row['Name'] || row['name'] || '').trim();
          if (!name) return;

          const phone = String(row['Phone Number'] || row['Phone'] || row['phone'] || '9800000000').trim();
          const email = String(row['Email Address'] || row['Email'] || row['email'] || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`).trim();
          const gender = String(row['Gender'] || 'Male').trim();
          const address = String(row['Address'] || 'Pune, Maharashtra').trim();
          const vehicleModel = String(row['Vehicle Model'] || row['Vehicle'] || 'Maruti Swift').trim();
          const regNo = String(row['Registration Number'] || row['Plate'] || `MH12 EX ${1000 + idx}`).trim();
          const vehicleType = String(row['Vehicle Type'] || 'Car').trim();

          newCustomers.push({
            id: `CUST-XLSX-${Date.now().toString().slice(-4)}-${idx}`,
            name,
            phone,
            email,
            gender,
            address,
            vehicles: [
              {
                model: vehicleModel,
                registrationNo: regNo,
                fuelType: vehicleType,
              },
            ],
            totalSpent: 0,
            lastVisit: new Date().toISOString().split('T')[0],
            jobCards: [],
          });
        });

        if (newCustomers.length > 0) {
          Promise.all(newCustomers.map(c => createCustomerApi({
            name: c.name,
            phone: c.phone,
            email: c.email,
            gender: c.gender,
            address: c.address,
            vehicles: c.vehicles.map(v => ({ model: v.model, registrationNo: v.registrationNo, fuelType: v.fuelType }))
          })))
          .then(() => {
            fetchLiveCustomers();
            toast.success(`Successfully imported ${newCustomers.length} customer records from Excel.`);
          })
          .catch(err => {
            console.warn('Import error:', err);
            toast.error('Failed to import some records to the database.');
          });
        }
      } catch (err) {
        toast.error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv spreadsheet.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-canvas)' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PageLoader text="Loading Customers..." />
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
              <Users size={22} color="var(--text-main)" /> Customer CRM & Vehicle Records
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage customer profiles, service histories, vehicle fleets, and automated reminders.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleDownloadSampleXLSX} className="btn-secondary" style={{ borderRadius: '8px' }}>
              <Download size={15} /> Sample Excel (.xlsx)
            </button>

            <label className="btn-secondary" style={{ borderRadius: '8px', cursor: 'pointer', margin: 0 }}>
              <Upload size={15} /> Import Excel
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportCustomersExcel}
                style={{ display: 'none' }}
              />
            </label>

            <button onClick={handleExportCustomersXLSX} className="btn-secondary" style={{ borderRadius: '8px' }}>
              <Download size={15} /> Export Customers
            </button>

            <button onClick={() => setAddModalOpen(true)} className="btn-primary">
              <Plus size={15} color="var(--bg-card)" /> Add New Customer
            </button>
          </div>
        </div>

        {/* CRM KPI Metric Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Customers</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '800' }}>1,248</h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active Vehicles</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '800' }}>1,680</h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Retention Rate</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--success)', fontWeight: '800' }}>88.4%</h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Pending Reminders</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--warning)', fontWeight: '800' }}>24 Due</h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-card" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              className="input-glass"
              placeholder="Search name, phone, or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredCustomers.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredCustomers.length)}</strong> of <strong>{filteredCustomers.length}</strong> customers
          </span>
        </div>

        {/* Customer Directory Table */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Customer ID / Name</th>
                <th style={{ padding: '10px 8px' }}>Contact Details</th>
                <th style={{ padding: '10px 8px' }}>Registered Vehicles</th>
                <th style={{ padding: '10px 8px' }}>Lifetime Spend</th>
                <th style={{ padding: '10px 8px' }}>Last Visit</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpen360View(c)}
                        title="View Customer 360 Report & Service History"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: 'var(--bg-card)',
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2563eb';
                          e.currentTarget.style.color = 'var(--bg-card)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-card)';
                          e.currentTarget.style.color = '#2563eb';
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <div>
                        <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '13.5px' }}>{c.name}</strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {c.id} {c.gender && `• ${c.gender}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                      <Phone size={13} color="var(--text-muted)" /> {c.phone}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{c.email}</span>
                  </td>

                  <td style={{ padding: '12px 8px' }}>
                    {c.vehicles.map((v, i) => (
                      <div key={i} style={{ marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Car size={13} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{v.model}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({v.registrationNo})</span>
                      </div>
                    ))}
                  </td>

                  <td style={{ padding: '12px 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                    ₹{formatCurrency(c.totalSpent)}
                  </td>

                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {c.lastVisit}
                    </span>
                  </td>

                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        title="Modify Customer Details"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: 'var(--bg-card)',
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Pencil size={15} color="#2563eb" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(c.id, c.name)}
                        title="Remove Customer Record"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid #fca5a5',
                          background: '#fef2f2',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Trash2 size={15} color="var(--danger)" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toast.error(`WhatsApp Reminder sent to ${c.phone}!`)}
                        title="Send WhatsApp Reminder"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <MessageSquare size={15} color="var(--text-main)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <EmptyState
              icon={Users}
              title="No Customer Profiles Found"
              description="No customers match your search criteria. Add a customer or import from an Excel file."
              actionLabel="+ Add New Customer"
              onAction={() => setAddModalOpen(true)}
            />
          )}
        </div>

        {/* Pagination UI */}
        {filteredCustomers.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries per page</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === 1 ? 'var(--bg-canvas)' : 'var(--bg-card)',
                  color: currentPage === 1 ? '#94a3b8' : 'var(--text-main)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                let pageNum = idx + 1;
                // Simple logic to keep active page centered if many pages
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + idx;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: currentPage === pageNum ? 'var(--primary)' : 'var(--border-color)',
                      background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-card)',
                      color: currentPage === pageNum ? 'var(--bg-canvas)' : 'var(--text-main)',
                      fontWeight: currentPage === pageNum ? '800' : '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === totalPages || totalPages === 0 ? 'var(--bg-canvas)' : 'var(--bg-card)',
                  color: currentPage === totalPages || totalPages === 0 ? '#94a3b8' : 'var(--text-main)',
                  cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Full Screen Add Customer Form Overlay */}
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
            {/* Top Bar Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 36px',
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
                  <UserPlus size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    Register New Customer & Vehicle Profile
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Spacious registration form to add customer contact details, gender, and primary vehicle information.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
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
                  onClick={handleAddCustomer}
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
                    <><Check size={16} /> Save & Register Customer</>
                  )}
                </button>

                <button
                  onClick={() => setAddModalOpen(false)}
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
                    marginLeft: '8px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '36px 48px' }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Section 1: Customer Personal Details & Gender */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--bg-canvas)' }}>
                    <Users size={18} color="#18181b" />
                    <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      1. Customer Personal Details
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        Customer Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Chandra"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Gender Selection Field */}
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        Gender *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setFormGender(g)}
                            style={{
                              padding: '9px 10px',
                              borderRadius: '8px',
                              border: formGender === g ? '2px solid #18181b' : '1px solid #cbd5e1',
                              background: formGender === g ? '#18181b' : 'var(--bg-card)',
                              color: formGender === g ? 'var(--bg-card)' : '#475569',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        Phone Number *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                          type="text"
                          placeholder="+91 98220 00000"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        Official Email Address
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                          type="email"
                          placeholder="ramesh@gmail.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Residential / Business Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      <input
                        type="text"
                        placeholder="e.g. Plot 42, Kothrud, Pune, Maharashtra"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', color: 'var(--text-main)', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Details Modal */}
        {editModalOpen && editingCustomer && (
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
                width: '500px',
                maxWidth: '92vw',
                padding: '28px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#18181b',
                      color: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Pencil size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Modify Customer Details
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Updating profile for {editingCustomer.id}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setEditModalOpen(false)}
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

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Gender *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setEditGender(g)}
                        style={{
                          padding: '7px 6px',
                          borderRadius: '6px',
                          border: editGender === g ? '2px solid #18181b' : '1px solid #cbd5e1',
                          background: editGender === g ? '#18181b' : 'var(--bg-card)',
                          color: editGender === g ? 'var(--bg-card)' : '#475569',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input-glass"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Full Address / Location
                  </label>
                  <textarea
                    rows={3}
                    className="input-glass"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: 'var(--bg-canvas)',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomerEdit}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer 360 Complete Profile, Vehicle Service Records & Payments Modal */}
        {view360Customer && (
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
              zIndex: 1100,
            }}
          >
            <div
              className="glass-card"
              style={{
                width: '940px',
                maxWidth: '94vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Top Header Bar */}
              <div
                style={{
                  padding: '24px 28px',
                  background: '#18181b',
                  color: 'var(--bg-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '800',
                      boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
                    }}
                  >
                    {view360Customer.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--bg-card)' }}>
                        {view360Customer.name}
                      </h2>
                      <span style={{ background: 'rgba(255,255,255,0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        {view360Customer.id}
                      </span>
                      {view360Customer.gender && (
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--border-color)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {view360Customer.gender}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12.5px', color: '#a1a1aa' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={13} color="#93c5fd" /> {view360Customer.phone}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={13} color="#93c5fd" /> {view360Customer.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} color="#93c5fd" /> {view360Customer.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setView360Customer(null);
                      handleOpenEdit(view360Customer);
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'var(--bg-card)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Pencil size={13} /> Edit Profile
                  </button>

                  <button
                    onClick={() => setView360Customer(null)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--bg-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px 28px', background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Lifetime Revenue</span>
                  <h4 style={{ margin: '3px 0 0', fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>
                    ₹{formatCurrency(view360Customer.totalSpent)}
                  </h4>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Registered Vehicles</span>
                  <h4 style={{ margin: '3px 0 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                    {view360Customer.vehicles.length} Vehicles
                  </h4>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Last Workshop Visit</span>
                  <h4 style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {view360Customer.lastVisit}
                  </h4>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Service Reminders</span>
                  <h4 style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: '700', color: (view360Customer.serviceReminders || 0) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    {(view360Customer.serviceReminders || 0) > 0 ? `${view360Customer.serviceReminders} Reminder Due` : 'Up to Date'}
                  </h4>
                </div>
              </div>

              {/* Navigation Tabs Bar */}
              <div style={{ display: 'flex', gap: '8px', padding: '12px 28px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                <button
                  type="button"
                  onClick={() => setActive360Tab('VEHICLES')}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    borderBottom: active360Tab === 'VEHICLES' ? '3px solid #18181b' : '3px solid transparent',
                    background: active360Tab === 'VEHICLES' ? 'var(--bg-canvas)' : 'transparent',
                    color: active360Tab === 'VEHICLES' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Car size={16} /> Registered Vehicles ({view360Customer.vehicles.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActive360Tab('SERVICES')}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    borderBottom: active360Tab === 'SERVICES' ? '3px solid #18181b' : '3px solid transparent',
                    background: active360Tab === 'SERVICES' ? 'var(--bg-canvas)' : 'transparent',
                    color: active360Tab === 'SERVICES' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Wrench size={16} /> Service & Maintenance Record
                </button>

                <button
                  type="button"
                  onClick={() => setActive360Tab('PAYMENTS')}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    borderBottom: active360Tab === 'PAYMENTS' ? '3px solid #18181b' : '3px solid transparent',
                    background: active360Tab === 'PAYMENTS' ? 'var(--bg-canvas)' : 'transparent',
                    color: active360Tab === 'PAYMENTS' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CreditCard size={16} /> Payments & Invoices Ledger
                </button>
              </div>

              {/* Scrollable Tab Content Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                
                {/* TAB 1: REGISTERED VEHICLES */}
                {active360Tab === 'VEHICLES' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {view360Customer.vehicles.map((v, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Car size={18} color="#18181b" />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                                {v.model}
                              </h4>
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Fuel: {v.fuelType}</span>
                            </div>
                          </div>

                          <span style={{ background: '#18181b', color: 'var(--bg-card)', padding: '4px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '12px' }}>
                            {v.registrationNo}
                          </span>
                        </div>

                        <div style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span>Odometer: <strong>N/A</strong></span>
                          <span style={{ color: 'var(--success)', fontWeight: '700' }}>● Active Profile</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: SERVICE & MAINTENANCE HISTORY */}
                {active360Tab === 'SERVICES' && (
                  <div>
                    {((view360Customer.jobCards || []).length > 0) ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px' }}>
                            <th style={{ padding: '10px 8px' }}>Job ID / Date</th>
                            <th style={{ padding: '10px 8px' }}>Vehicle</th>
                            <th style={{ padding: '10px 8px' }}>Services Performed</th>
                            <th style={{ padding: '10px 8px' }}>Assigned Mechanic</th>
                            <th style={{ padding: '10px 8px' }}>Total Cost</th>
                            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(view360Customer.jobCards || []).map((s: any) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-canvas)' }}>
                              <td style={{ padding: '12px 8px' }}>
                                <strong style={{ color: 'var(--text-main)', display: 'block' }}>{s.id.slice(0, 8).toUpperCase()}</strong>
                                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toISOString().split('T')[0]}</span>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <strong style={{ color: 'var(--text-main)', display: 'block' }}>{s.vehicle?.model || 'Unknown'}</strong>
                                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{s.vehicle?.registrationNo || 'N/A'}</span>
                              </td>
                              <td style={{ padding: '12px 8px', color: '#334155', fontWeight: '600' }}>
                                {s.description || 'General Service'}
                              </td>
                              <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                                {s.mechanic?.name || 'Unassigned'}
                              </td>
                              <td style={{ padding: '12px 8px', fontWeight: '800', color: 'var(--text-main)' }}>
                                ₹{formatCurrency((s.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0))}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <Wrench size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>No past service records logged yet for this customer.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PAYMENTS & BILLING LEDGER */}
                {active360Tab === 'PAYMENTS' && (
                  <div>
                    {(((view360Customer.jobCards || []).flatMap((j: any) => j.payments || [])).length > 0) ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px' }}>
                            <th style={{ padding: '10px 8px' }}>Invoice No</th>
                            <th style={{ padding: '10px 8px' }}>Invoice Date</th>
                            <th style={{ padding: '10px 8px' }}>Payment Mode</th>
                            <th style={{ padding: '10px 8px' }}>Amount Paid</th>
                            <th style={{ padding: '10px 8px' }}>Status</th>
                            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {((view360Customer.jobCards || []).flatMap((j: any) => (j.payments || []).map((p: any) => ({ ...p, jobCardId: j.id })))).map((p: any, pIdx: number) => (
                            <tr key={pIdx} style={{ borderBottom: '1px solid var(--bg-canvas)' }}>
                              <td style={{ padding: '12px 8px', fontWeight: '800', color: 'var(--text-main)' }}>
                                INV-{p.id.slice(0, 6).toUpperCase()}
                              </td>
                              <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                                {new Date(p.createdAt).toISOString().split('T')[0]}
                              </td>
                              <td style={{ padding: '12px 8px', color: '#334155', fontWeight: '600' }}>
                                {p.paymentMethod}
                              </td>
                              <td style={{ padding: '12px 8px', fontWeight: '800', color: 'var(--success)' }}>
                                ₹{formatCurrency(p.amount)}
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                  {p.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                {typeof window !== 'undefined' && p.status === 'COMPLETED' ? (
                                  <PDFDownloadLink
                                    document={<InvoicePDF invoice={{
                                      invoiceNo: p.jobCardId ? `INV-${p.jobCardId.slice(0, 8).toUpperCase()}` : `INV-${p.id.slice(0, 8).toUpperCase()}`,
                                      customerName: view360Customer.name,
                                      vehicleNo: p.jobCardId ? p.jobCardId : 'N/A', // fallback
                                      partsTotal: p.amount / 1.18 * 0.4, // placeholder estimation for legacy payments
                                      laborTotal: p.amount / 1.18 * 0.6,
                                      taxAmount: p.amount - (p.amount / 1.18),
                                      taxRate: 18,
                                      grandTotal: p.amount,
                                      status: 'PAID',
                                      createdAt: p.createdAt
                                    }} />}
                                    fileName={`Receipt-${p.jobCardId || p.id}.pdf`}
                                    style={{ textDecoration: 'none' }}
                                  >
                                    {/* @ts-ignore */}
                                    {({ loading }) => (
                                      <button
                                        type="button"
                                        disabled={loading}
                                        style={{
                                          padding: '5px 10px',
                                          borderRadius: '6px',
                                          border: '1px solid #cbd5e1',
                                          background: 'var(--bg-card)',
                                          color: 'var(--text-main)',
                                          fontSize: '11.5px',
                                          fontWeight: '600',
                                          cursor: loading ? 'not-allowed' : 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                        }}
                                      >
                                        <Download size={12} /> {loading ? 'Loading...' : 'Invoice PDF'}
                                      </button>
                                    )}
                                  </PDFDownloadLink>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      background: '#f8fafc',
                                      color: '#94a3b8',
                                      fontSize: '11.5px',
                                      fontWeight: '600',
                                      cursor: 'not-allowed',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                    }}
                                  >
                                    <Download size={12} /> Invoice PDF
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <CreditCard size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>No billing transactions found for this customer.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

