'use client';
import { useToast } from '@/components/ToastProvider';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import { getMechanics, createMechanic as createMechanicApi, deleteMechanic as deleteMechanicApi } from '@/utils/api';
import {
  UserCheck,
  Plus,
  Search,
  Wrench,
  CheckCircle2,
  Clock,
  Star,
  Award,
  Phone,
  ShieldCheck,
  Zap,
  X,
  Check,
  User,
  UserPlus,
  CalendarCheck,
  IndianRupee,
  Trash2,
  Settings2,
  Pencil,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

interface Mechanic {
  id: string;
  name: string;
  phone: string;
  role: string;
  specialty: 'Senior Mechanic' | 'Diagnostic Tech' | 'EV Specialist' | 'Suspension & Brakes' | 'General Tech';
  experienceYears: number;
  status: 'ON_JOB' | 'AVAILABLE' | 'ON_LEAVE';
  attendanceStatus?: 'PRESENT' | 'HALF_DAY' | 'ON_LEAVE';
  dailySalary?: number;
  monthlySalary?: number;
  presentDays?: number;
  currentBay?: string;
  currentJobId?: string;
  currentVehicle?: string;
  jobsCompletedThisMonth: number;
  rating: number;
  shiftHours: string;
  joinedDate: string;
}

export default function MechanicsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedPerformanceMechanic, setSelectedPerformanceMechanic] = useState<Mechanic | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENT' | 'HALF_DAY' | 'ON_LEAVE'>>({});
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);

  useEffect(() => {
    const initialRecords: Record<string, 'PRESENT' | 'HALF_DAY' | 'ON_LEAVE'> = {};
    mechanics.forEach(m => {
      initialRecords[m.id] = (m.attendanceStatus as any) || 'PRESENT';
    });
    setAttendanceRecords(initialRecords);
  }, [mechanics, attendanceDate]);

  const handleSaveAttendance = async () => {
    try {
      const { saveMechanicAttendance } = await import('@/utils/api');
      await saveMechanicAttendance(attendanceDate, attendanceRecords);
      await fetchLiveMechanics();
      setAttendanceModalOpen(false);
      toast.success(`Daily team attendance for ${attendanceDate} saved successfully!`);
    } catch (err) {
      console.error('Failed to save attendance', err);
    }
  };


  // Form State for Add Mechanic Modal
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [specialty, setSpecialty] = useState<Mechanic['specialty']>('Senior Mechanic');
  const [experienceYears, setExperienceYears] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [leavingTime, setLeavingTime] = useState('');
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailySalary, setDailySalary] = useState('');

  const calculatedMonthlySalary = (Number(dailySalary) || 0) * 30;

  const TIME_OPTIONS = [
    '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM', '10:00 PM',
  ];

  const filteredMechanics = mechanics.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.toLowerCase().includes(search.toLowerCase()) ||
      m.specialty.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty = filterSpecialty === 'ALL' || m.specialty === filterSpecialty;
    const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const fetchLiveMechanics = async () => {
    const apiTechs = await getMechanics();
    if (apiTechs && Array.isArray(apiTechs) && apiTechs.length > 0) {
      setMechanics(
        apiTechs.map((t: any) => {
          // Find attendance for selected date
          const attRecords = Array.isArray(t.attendance) ? t.attendance : [];
          const attRecord = attRecords.find((a: any) => a.date === attendanceDate);
          const attStatus = attRecord ? attRecord.status : 'PRESENT';
          
          const presentDays = attRecords.filter((a: any) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;

          // Jobs metric
          const jobsList = Array.isArray(t.jobs) ? t.jobs : [];
          const completedJobs = jobsList.filter((j: any) => j.status === 'COMPLETED' || j.status === 'DELIVERED').length;
          const revenue = jobsList
            .filter((j: any) => j.status === 'DELIVERED')
            .reduce((sum: number, j: any) => sum + (j.invoice?.grandTotal || 0), 0);

          return {
            id: t.id,
            name: t.name,
            phone: t.phone || 'Not provided',
            role: t.role || 'Senior Technician',
            specialty: t.specialty || 'General Mechanic',
            experienceYears: t.experienceYears || 1,
            attendanceStatus: attStatus,
            status: attStatus === 'ON_LEAVE' ? 'ON_LEAVE' : (t.bayAllocations && t.bayAllocations.length > 0 ? 'ON_JOB' : 'AVAILABLE'),
            currentBay: t.bayAllocations?.[0]?.bay?.name,
            currentJobId: t.jobs?.[0]?.jobId,
            currentVehicle: t.jobs?.[0]?.vehicle ? `${t.jobs[0].vehicle.make} ${t.jobs[0].vehicle.model}` : undefined,
            jobsCompletedThisMonth: completedJobs,
            revenueGenerated: revenue,
            rating: t.rating ?? 4.9,
            shiftHours: t.shiftHours || '09:00 AM - 07:00 PM',
            joinedDate: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dailySalary: t.dailySalary || 800,
            monthlySalary: t.monthlySalary || 24000,
            presentDays: presentDays || 25,
            dbJobs: jobsList, // Keep raw jobs for performance modal
          };
        })
      );
    }
  };

  useEffect(() => {
    fetchLiveMechanics();
  }, []);

  const handleAddMechanic = async () => {
    if (!name || !phone) {
      toast.error('Please enter Mechanic Name and Phone number.');
      return;
    }

    const dSalary = Number(dailySalary) || 0;
    const mSalary = dSalary * 30;

    const newMechanic: Mechanic = {
      id: Date.now().toString(),
      name,
      phone,
      role: role || `${specialty} Technician`,
      specialty,
      experienceYears: Number(experienceYears) || 3,
      status: 'AVAILABLE',
      jobsCompletedThisMonth: 0,
      rating: 5.0,
      shiftHours: `${entryTime} - ${leavingTime}`,
      joinedDate: joinedDate || new Date().toISOString().split('T')[0],
      dailySalary: dSalary,
      monthlySalary: mSalary,
    };

    setMechanics([newMechanic, ...mechanics]);

    try {
      await createMechanicApi({
        name,
        phone,
        role: role || `${specialty} Technician`,
        specialty,
        experienceYears: Number(experienceYears) || 3,
        shiftHours: `${entryTime} - ${leavingTime}`,
        dailySalary: dSalary,
        monthlySalary: mSalary,
      });
      await fetchLiveMechanics();
    } catch (err) {
      console.warn('Create mechanic API notice:', err);
    }

    setAddModalOpen(false);
    setName('');
    setPhone('');
    setRole('');
  };

  const handleEditMechanic = async () => {
    if (!editingMechanic || !name || !phone) {
      toast.error('Please enter Mechanic Name and Phone number.');
      return;
    }

    const dSalary = Number(dailySalary) || 0;
    const mSalary = dSalary * 30;

    try {
      const { updateMechanic } = await import('@/utils/api');
      await updateMechanic(editingMechanic.id, {
        name,
        phone,
        role: role || `${specialty} Technician`,
        specialty,
        experienceYears: Number(experienceYears) || 3,
        shiftHours: `${entryTime} - ${leavingTime}`,
        dailySalary: dSalary,
        monthlySalary: mSalary,
      });
      await fetchLiveMechanics();
    } catch (err) {
      console.warn('Update mechanic API notice:', err);
    }

    setEditingMechanic(null);
    setName('');
    setPhone('');
    setRole('');
  };

  const handleToggleStatus = (id: string) => {
    setMechanics((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus =
            m.status === 'AVAILABLE' ? 'ON_JOB' : m.status === 'ON_JOB' ? 'ON_LEAVE' : 'AVAILABLE';
          return {
            ...m,
            status: nextStatus,
            currentBay: nextStatus === 'AVAILABLE' ? undefined : m.currentBay,
            currentJobId: nextStatus === 'AVAILABLE' ? undefined : m.currentJobId,
            currentVehicle: nextStatus === 'AVAILABLE' ? undefined : m.currentVehicle,
          };
        }
        return m;
      })
    );
  };

  const handleRemoveMechanic = async (id: string, mechanicName: string) => {
    if (confirm(`Are you sure you want to remove technician "${mechanicName}" from the workshop staff roster?`)) {
      try {
        await deleteMechanicApi(id);
        await fetchLiveMechanics();
      } catch (err) {
        console.warn('Delete mechanic API notice:', err);
      }
    }
  };

  const totalStaff = mechanics.length;
  const activeOnJob = mechanics.filter((m) => m.status === 'ON_JOB').length;
  const availableCount = mechanics.filter((m) => m.status === 'AVAILABLE').length;
  const avgRating = (
    mechanics.reduce((acc, m) => acc + m.rating, 0) / mechanics.length
  ).toFixed(1);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header with Integrated Search & Add Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={22} color="var(--text-main)" /> Mechanics & Technicians
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Manage workshop technicians, live task allocations, skill certifications, and efficiency performance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                className="input-glass"
                placeholder="Search technician..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px' }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>

            <button
              onClick={() => setAttendanceModalOpen(true)}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CalendarCheck size={15} color="#18181b" /> Mark Attendance
            </button>

            <button onClick={() => setAddModalOpen(true)} className="btn-primary">
              <Plus size={15} color="var(--bg-card)" /> Add New Mechanic
            </button>
          </div>
        </div>

        {/* Mechanics Roster Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredMechanics.map((m) => {
            const initials = m.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase();

            const isAvailable = m.status === 'AVAILABLE';
            const isOnJob = m.status === 'ON_JOB';

            return (
              <div
                key={m.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Card Header: Avatar & Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: '#18181b',
                          color: 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '15px',
                        }}
                      >
                        {initials}
                      </div>

                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                          {m.name}
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {m.role}
                        </span>
                      </div>
                    </div>

                    <span
                      className={
                        isOnJob
                          ? 'badge badge-progress'
                          : isAvailable
                          ? 'badge badge-completed'
                          : 'badge badge-pending'
                      }
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Specialty & Badges */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', background: 'var(--bg-canvas)', color: 'var(--text-main)', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} color="#18181b" /> {m.specialty}
                    </span>
                    <span style={{ fontSize: '11px', background: 'var(--bg-canvas)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '6px', fontWeight: '500', border: '1px solid var(--border-color)' }}>
                      {m.experienceYears} Yrs Exp.
                    </span>
                    <span style={{ fontSize: '11px', background: '#fffbeb', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontWeight: '600', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      ★ {m.rating}
                    </span>
                  </div>

                  {/* Monthly Earned Salary as per Attendance Calculation */}
                  <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                        Month Earned Salary
                      </span>
                      <strong style={{ fontSize: '15px', color: 'var(--success)', fontWeight: '800' }}>
                        ₹{((m.dailySalary || 800) * (m.presentDays || 25)).toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-main)', fontWeight: '700', display: 'block' }}>
                        {m.presentDays || 25} Days Present
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        @ ₹{m.dailySalary || 800}/day rate
                      </span>
                    </div>
                  </div>

                  {/* Contact & Shift Info */}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid var(--bg-canvas)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                      <Phone size={13} color="var(--text-muted)" /> {m.phone}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <Clock size={12} /> {m.shiftHours}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => handleToggleStatus(m.id)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '6px 10px' }}
                  >
                    Change Status
                  </button>
                  <button
                    onClick={() => setSelectedPerformanceMechanic(m)}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '6px 10px' }}
                  >
                    View Performance
                  </button>
                  <button
                    onClick={() => handleRemoveMechanic(m.id, m.name)}
                    title={`Remove ${m.name}`}
                    style={{
                      background: '#fef2f2',
                      color: 'var(--danger)',
                      border: '1px solid #fecaca',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingMechanic(m);
                      setName(m.name);
                      setPhone(m.phone);
                      setRole(m.role);
                      setSpecialty(m.specialty as any);
                      setExperienceYears(String(m.experienceYears));
                      setDailySalary(String(m.dailySalary || 850));
                      if (m.shiftHours) {
                        const [inTime, outTime] = m.shiftHours.split(' - ');
                        setEntryTime(inTime || '');
                        setLeavingTime(outTime || '');
                      }
                    }}
                    title={`Edit ${m.name}`}
                    style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Settings2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMechanics.length === 0 && (
          <EmptyState
            icon={UserCheck}
            title="No Mechanics Found"
            description="No mechanics or technicians match your search criteria. Click below to add a team member."
            actionLabel="+ Add New Mechanic"
            onAction={() => setAddModalOpen(true)}
          />
        )}

        {/* Redesigned Add New Mechanic Modal Window */}
        {addModalOpen && (
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
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              }}
            >
              {/* Modal Header */}
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
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Add Mechanic / Technician
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Register technician skills, certifications, contact info, and shift schedules.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAddModalOpen(false)}
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Section 1: Contact Details */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--bg-canvas)' }}>
                  <User size={14} color="#18181b" />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    1. Technician Contact Details
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="e.g. Rajesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="+91 98000 11223"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Designation / Title Name
                    </label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="e.g. Master Engine Diagnostics Specialist"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      className="input-glass"
                      value={joinedDate}
                      onChange={(e) => setJoinedDate(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-card)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Shift Timings (Entry & Leaving Time) *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', display: 'block', marginBottom: '3px' }}>
                        Entry / Check-In Time
                      </span>
                      <select
                        className="input-glass"
                        value={entryTime}
                        onChange={(e) => setEntryTime(e.target.value)}
                        style={{ width: '100%', background: 'var(--bg-card)', fontWeight: '600', fontSize: '13px' }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', display: 'block', marginBottom: '3px' }}>
                        Leaving / Check-Out Time
                      </span>
                      <select
                        className="input-glass"
                        value={leavingTime}
                        onChange={(e) => setLeavingTime(e.target.value)}
                        style={{ width: '100%', background: 'var(--bg-card)', fontWeight: '600', fontSize: '13px' }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Salary & Compensation Section */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--bg-canvas)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <IndianRupee size={14} color="#18181b" />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Salary Structure
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Daily Salary Rate (₹ / Day) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '9px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          className="input-glass"
                          placeholder="800"
                          value={dailySalary}
                          onChange={(e) => setDailySalary(e.target.value)}
                          style={{ width: '100%', paddingLeft: '24px', fontWeight: '700', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                        Monthly Salary (Auto-Calculated)
                      </label>
                      <div
                        style={{
                          background: 'var(--bg-canvas)',
                          border: '1px solid #cbd5e1',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '13.5px',
                          color: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          height: '38px',
                        }}
                      >
                        <span>₹{calculatedMonthlySalary.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '500' }}>/ month (30 days)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMechanic}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Check size={16} /> Save & Onboard Mechanic
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Edit Mechanic Modal */}
        {editingMechanic && (
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
                width: '640px',
                maxWidth: '92vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
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
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Edit {editingMechanic.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setEditingMechanic(null)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="input-glass"
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Primary Specialty</label>
                  <select className="input-glass" value={specialty} onChange={(e) => setSpecialty(e.target.value as any)} style={{ width: '100%' }}>
                    <option value="Senior Mechanic">Senior Mechanic</option>
                    <option value="General Mechanic">General Mechanic</option>
                    <option value="Diagnostic Specialist">Diagnostic Specialist</option>
                    <option value="EV Technician">EV Technician</option>
                    <option value="AC & HVAC Specialist">AC & HVAC Specialist</option>
                    <option value="Denting & Painting">Denting & Painting</option>
                    <option value="Wheel Alignment">Wheel Alignment</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-glass"
                    placeholder="e.g. 5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: 'var(--bg-canvas)', padding: '16px', borderRadius: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Daily Salary Basis (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      className="input-glass"
                      placeholder="850"
                      value={dailySalary}
                      onChange={(e) => setDailySalary(e.target.value)}
                      style={{ width: '100%', paddingLeft: '28px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Calculated Monthly Est.</label>
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '15px', fontWeight: '800', color: 'var(--success)' }}>
                    ₹{calculatedMonthlySalary.toLocaleString('en-IN')} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>/ 30 days</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setEditingMechanic(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleEditMechanic} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mark Attendance Modal */}
        {attendanceModalOpen && (
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
                width: '560px',
                maxWidth: '92vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
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
                    <CalendarCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Mark Daily Staff Attendance
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Track daily check-in, presence, half days, and leave status for technicians.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAttendanceModalOpen(false)}
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

              {/* Date Selection */}
              <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Attendance Date:
                </span>
                <input
                  type="date"
                  className="input-glass"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ background: 'var(--bg-card)', fontSize: '13px', fontWeight: '600', padding: '5px 10px' }}
                />
              </div>

              {/* Staff List with Quick Status Toggle Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {mechanics.map((m) => {
                  const currentAtt = attendanceRecords[m.id] || m.attendanceStatus || 'PRESENT';
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{m.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.role}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(['PRESENT', 'HALF_DAY', 'ON_LEAVE'] as const).map((st) => {
                          const isSelected = currentAtt === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                setAttendanceRecords((prev) => ({
                                  ...prev,
                                  [m.id]: st,
                                }))
                              }
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                border: isSelected
                                  ? st === 'PRESENT'
                                    ? '1px solid var(--success)'
                                    : st === 'HALF_DAY'
                                    ? '1px solid var(--warning)'
                                    : '1px solid var(--danger)'
                                  : '1px solid var(--border-color)',
                                background: isSelected
                                  ? st === 'PRESENT'
                                    ? 'var(--success)'
                                    : st === 'HALF_DAY'
                                    ? 'var(--warning)'
                                    : 'var(--danger)'
                                  : 'var(--bg-canvas)',
                                color: isSelected ? 'var(--bg-card)' : 'var(--text-muted)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {st === 'PRESENT' ? 'Present' : st === 'HALF_DAY' ? 'Half Day' : 'On Leave'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Check size={16} /> Save Attendance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Technician Performance & Analytics Modal */}
        {selectedPerformanceMechanic && (
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
              className="glass-card"
              style={{
                width: '680px',
                maxWidth: '94vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                boxShadow: '0 25px 30px -5px rgba(0,0,0,0.15)',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', borderBottom: '1px solid var(--bg-canvas)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#18181b',
                      color: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '18px',
                    }}
                  >
                    {selectedPerformanceMechanic.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {selectedPerformanceMechanic.name}
                      </h3>
                      <span style={{ fontSize: '11px', background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', border: '1px solid #fde68a' }}>
                        ★ {selectedPerformanceMechanic.rating} Rating
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {selectedPerformanceMechanic.role} • {selectedPerformanceMechanic.specialty} ({selectedPerformanceMechanic.experienceYears} Yrs Exp.)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPerformanceMechanic(null)}
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

              {/* 4 KPI Summary Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-canvas)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Jobs Completed
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                    {selectedPerformanceMechanic.jobsCompletedThisMonth}
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: '600' }}>+14% vs last mo.</span>
                </div>

                <div style={{ background: 'var(--bg-canvas)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Earned Salary
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>
                    ₹{((selectedPerformanceMechanic.dailySalary || 800) * (selectedPerformanceMechanic.presentDays || 25)).toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{selectedPerformanceMechanic.presentDays || 25} Days Present</span>
                </div>

                <div style={{ background: 'var(--bg-canvas)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Revenue Generated
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                    ₹{((selectedPerformanceMechanic as any).revenueGenerated || 0).toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: '600' }}>On-Time Delivery</span>
                </div>

                <div style={{ background: 'var(--bg-canvas)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Daily Rate
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                    ₹{selectedPerformanceMechanic.dailySalary || 800}
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Per Day Rate</span>
                </div>
              </div>

              {/* Monthly Performance & Earnings Visual Graph Chart */}
              <div style={{ marginBottom: '24px', padding: '18px', background: 'var(--bg-canvas)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} color="#18181b" /> 6-Month Workload & Jobs Performance Graph
                  </h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Feb - Jul 2026
                  </span>
                </div>

                {/* CSS Bar Chart */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '140px', padding: '10px 0 0', borderBottom: '1px solid #cbd5e1' }}>
                  {[
                    { month: 'Feb', jobs: 28, height: '55%', color: '#94a3b8' },
                    { month: 'Mar', jobs: 32, height: '65%', color: '#94a3b8' },
                    { month: 'Apr', jobs: 35, height: '72%', color: '#94a3b8' },
                    { month: 'May', jobs: 38, height: '80%', color: '#94a3b8' },
                    { month: 'Jun', jobs: 40, height: '88%', color: '#94a3b8' },
                    { month: 'Jul (Current)', jobs: selectedPerformanceMechanic.jobsCompletedThisMonth, height: '95%', color: '#18181b' },
                  ].map((bar, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: idx === 5 ? '#18181b' : 'var(--text-muted)' }}>
                        {bar.jobs}
                      </span>
                      <div
                        style={{
                          width: '28px',
                          height: bar.height,
                          background: bar.color,
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {bar.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comprehensive Calculation Breakdown */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#18181b" /> Salary & Performance Incentive Calculation
                </h4>

                <div style={{ borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--bg-canvas)', background: 'var(--bg-card)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>Daily Salary Basis Rate</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                          ₹{selectedPerformanceMechanic.dailySalary?.toLocaleString('en-IN') || 800} / Day
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--bg-canvas)', background: 'var(--bg-card)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>Attendance Days (This Month)</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                          {selectedPerformanceMechanic.presentDays || 25} Days
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--bg-canvas)', background: 'var(--bg-card)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>Calculated Base Pay</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                          ₹{((selectedPerformanceMechanic.dailySalary || 800) * (selectedPerformanceMechanic.presentDays || 25)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--bg-canvas)', background: 'var(--bg-canvas)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>Workshop Revenue Generated</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--text-main)' }}>
                          ₹{(selectedPerformanceMechanic.jobsCompletedThisMonth * 6800).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--bg-canvas)', background: 'var(--bg-card)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: '600' }}>Efficiency Performance Incentive Bonus</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: 'var(--warning)' }}>
                          + ₹3,500
                        </td>
                      </tr>
                      <tr style={{ background: 'var(--bg-canvas)' }}>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main)', fontWeight: '800', fontSize: '13.5px' }}>
                          Net Total Monthly Payout
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: 'var(--success)', fontSize: '16px' }}>
                          ₹{(((selectedPerformanceMechanic.dailySalary || 800) * (selectedPerformanceMechanic.presentDays || 25)) + 3500).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPerformanceMechanic(null)}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
