'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Wrench, UserCheck, Clock, Hourglass, Car, Settings2, Plus, CheckCircle2 } from 'lucide-react';

interface Bay {
  id: string;
  bayNumber: string;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  currentVehicle?: string;
  customerName?: string;
  assignedMechanic?: string;
  // Timestamp when the bay was assigned (ms since epoch)
  assignedAt?: number;
  estimatedCompletion?: string;
}

import { getWorkshopBays, allocateWorkshopBay, releaseWorkshopBay, updateWorkshopBayStatus } from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

export default function WorkshopBaysPage() {
  const toast = useToast();
  const [bays, setBays] = useState<Bay[]>([]);

  const [now, setNow] = useState<number>(Date.now());
  const [selectedBay, setSelectedBay] = useState<Bay | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [addBayModalOpen, setAddBayModalOpen] = useState(false);
  
  const [pendingJobCards, setPendingJobCards] = useState<any[]>([]);
  const [mechanicsList, setMechanicsList] = useState<any[]>([]);
  
  const [selectedJobCardId, setSelectedJobCardId] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [newMechanic, setNewMechanic] = useState('');
  
  const [newBayNumber, setNewBayNumber] = useState('');
  const [newBayName, setNewBayName] = useState('');

  const [apiError, setApiError] = useState<string | null>(null);

  const fetchLiveBays = async () => {
    try {
      setApiError(null);
      const apiBays = await getWorkshopBays();
      if (apiBays && Array.isArray(apiBays) && apiBays.length > 0) {
        setBays(
          apiBays.map((b: any) => {
            const alloc = b.allocations?.[0];
            let estStr = b.estimatedCompletion || '1 hour remaining';
            if (alloc && alloc.estimatedEndTime) {
              const diffSec = Math.max(0, Math.floor((new Date(alloc.estimatedEndTime).getTime() - Date.now()) / 1000));
              const hrs = Math.floor(diffSec / 3600);
              const mins = Math.floor((diffSec % 3600) / 60);
              estStr = hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`;
            }

            return {
              id: b.id,
              bayNumber: b.bayNumber,
              name: b.name || `Bay ${b.bayNumber}`,
              status: b.status || 'AVAILABLE',
              currentVehicle: b.currentVehicle || alloc?.jobCard?.vehicle?.registrationNo,
              customerName: b.customerName || alloc?.jobCard?.customer?.name,
              assignedMechanic: b.assignedMechanic || alloc?.mechanic?.name,
              assignedAt: alloc?.startTime ? new Date(alloc.startTime).getTime() : undefined,
              estimatedCompletion: estStr,
            };
          })
        );
      }
    } catch (e) {
      setApiError('Failed to fetch workshop bays data. Please ensure the backend server is running.');
      console.error('Fetch bays error:', e);
    }
  };

  const fetchDependencies = async () => {
    const [jobs, mechs] = await Promise.all([
      import('@/utils/api').then(m => m.getJobCards()),
      import('@/utils/api').then(m => m.getMechanics())
    ]);
    if (jobs) setPendingJobCards(jobs.filter((j: any) => j.status === 'PENDING' || j.status === 'IN_PROGRESS'));
    if (mechs) setMechanicsList(mechs);
  };

  // Live updating timer interval every 1 second
  useEffect(() => {
    fetchLiveBays();
    fetchDependencies();
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleOpenAssign = (bay: Bay) => {
    setSelectedBay(bay);
    setAssignModalOpen(true);
  };

  const handleConfirmAllocation = async () => {
    if (!selectedBay) return;
    if (!selectedJobCardId) {
      toast.error('Please select a Job Card for this allocation.');
      return;
    }

    setBays((prev) =>
      prev.map((b) =>
        b.id === selectedBay.id
          ? {
              ...b,
              status: 'OCCUPIED',
              currentVehicle: 'Processing...',
              customerName: 'Loading...',
            }
          : b
      )
    );

    try {
      await allocateWorkshopBay({
        bayId: selectedBay.id,
        jobCardId: selectedJobCardId,
        mechanicId: newMechanic || undefined,
      });
      await fetchLiveBays();
      await fetchDependencies();
    } catch (e) {
      console.warn('Bay allocation API call notice:', e);
      toast.error('Failed to allocate bay. Check connection.');
    }

    setAssignModalOpen(false);
    setSelectedJobCardId('');
    setAssignSearch('');
    setNewMechanic('');
  };

  const handleAddBay = async () => {
    if (!newBayNumber) return;
    try {
      const { createWorkshopBay } = await import('@/utils/api');
      await createWorkshopBay({
        bayNumber: newBayNumber,
        name: newBayName || 'New Service Bay',
        bayType: 'STANDARD'
      });
      await fetchLiveBays();
      setAddBayModalOpen(false);
      setNewBayNumber('');
      setNewBayName('');
    } catch(e) {
      console.error(e);
    }
  };

  const handleReleaseBay = async (id: string) => {
    if (!window.confirm('Are you sure you want to mark this job as completed and release the bay?')) return;
    setBays((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'AVAILABLE', currentVehicle: undefined, customerName: undefined, assignedMechanic: undefined, assignedAt: undefined, estimatedCompletion: undefined } : b)),
    );
    try {
      await releaseWorkshopBay(id);
      await fetchLiveBays();
    } catch (e) {
      console.warn('Bay release API call notice:', e);
    }
  };

  const handleToggleMaintenance = async (bay: Bay) => {
    const newStatus = bay.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    if (!window.confirm(`Are you sure you want to mark this bay as ${newStatus}?`)) return;
    setBays(prev => prev.map(b => b.id === bay.id ? { ...b, status: newStatus } : b));
    try {
      await updateWorkshopBayStatus(bay.id, newStatus);
      await fetchLiveBays();
    } catch (e) {
      toast.error('Failed to update bay status');
    }
  };

  const formatElapsedTime = (assignedAt?: number) => {
    if (!assignedAt) return '0m 0s';
    const diffSec = Math.max(0, Math.floor((now - assignedAt) / 1000));
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench size={22} color="var(--text-main)" /> Live Workshop Bay Board
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Real-time service bay occupancy, live elapsed timers, and mechanic assignments.</p>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <button
              onClick={() => setAddBayModalOpen(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Add Bay
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
              <span>Available ({bays.filter((b) => b.status === 'AVAILABLE').length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#18181b' }} />
              <span>Occupied ({bays.filter((b) => b.status === 'OCCUPIED').length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }} />
              <span>Maintenance ({bays.filter((b) => b.status === 'MAINTENANCE').length})</span>
            </div>
          </div>
        </div>

        {apiError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', color: 'var(--danger)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings2 size={20} />
            <span style={{ fontWeight: '600' }}>{apiError}</span>
          </div>
        )}

        {!apiError && bays.length === 0 && (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '12px' }}>
            <Wrench size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No Workshop Bays Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Click &quot;Add Bay&quot; to create your first service bay and start allocating vehicles.</p>
            <button onClick={() => setAddBayModalOpen(true)} className="btn-primary" style={{ margin: '0 auto' }}>
              <Plus size={16} /> Add First Bay
            </button>
          </div>
        )}

        {/* Bays Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
          {bays.map((bay) => {
            const isOccupied = bay.status === 'OCCUPIED';
            const isAvailable = bay.status === 'AVAILABLE';

            return (
              <div
                key={bay.id}
                className="glass-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>{bay.bayNumber}</span>
                    <span className={isOccupied ? 'badge badge-progress' : isAvailable ? 'badge badge-completed' : 'badge badge-pending'}>
                      {bay.status}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{bay.name}</h3>

                  {isOccupied ? (
                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '600' }}>Vehicle &amp; Owner</span>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>{bay.currentVehicle}</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>{bay.customerName}</p>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '600' }}>Assigned Mechanic</span>
                        <span style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                          <UserCheck size={13} color="var(--text-muted)" /> {bay.assignedMechanic}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: 'var(--accent)' }}>
                          <Clock size={12} color="var(--accent)" /> Elapsed: {formatElapsedTime(bay.assignedAt)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Hourglass size={12} /> {bay.estimatedCompletion}
                        </span>
                      </div>
                    </div>
                  ) : isAvailable ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.7 }}>
                      <Car size={32} color="var(--text-main)" style={{ margin: '0 auto 6px', display: 'block' }} />
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Bay empty &amp; ready</span>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.7 }}>
                      <Settings2 size={32} color="var(--warning)" style={{ margin: '0 auto 6px', display: 'block' }} />
                      <span style={{ fontSize: '12.5px', color: '#78350f' }}>Undergoing maintenance</span>
                    </div>
                  )}
                </div>

                <div>
                  {isAvailable && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenAssign(bay)}
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Plus size={15} /> Allocate
                      </button>
                      <button
                        onClick={() => handleToggleMaintenance(bay)}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                      >
                        <Settings2 size={15} /> Maint
                      </button>
                    </div>
                  )}
                  {isOccupied && (
                    <button
                      onClick={() => handleReleaseBay(bay.id)}
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <CheckCircle2 size={15} /> Complete &amp; Release
                    </button>
                  )}
                  {bay.status === 'MAINTENANCE' && (
                    <button
                      onClick={() => handleToggleMaintenance(bay)}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', background: 'var(--success)', borderColor: 'var(--success)' }}
                    >
                      <CheckCircle2 size={15} /> Mark Available
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Allocate Bay Modal */}
        {assignModalOpen && selectedBay && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="glass-card" style={{ width: '420px', maxWidth: '90vw', padding: '24px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>Allocate {selectedBay.bayNumber} ({selectedBay.name})</h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Search Pending Job Cards</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Filter by vehicle or customer..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  style={{ width: '100%', marginBottom: '8px', background: 'var(--bg-canvas)' }}
                />
                <select
                  className="input-glass"
                  value={selectedJobCardId}
                  onChange={(e) => setSelectedJobCardId(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-card)' }}
                >
                  <option value="">-- Select Job Card --</option>
                  {pendingJobCards
                    .filter(job => 
                      job.vehicle?.registrationNo?.toLowerCase().includes(assignSearch.toLowerCase()) || 
                      job.customer?.name?.toLowerCase().includes(assignSearch.toLowerCase())
                    )
                    .map(job => (
                    <option key={job.id} value={job.id}>
                      {job.vehicle?.registrationNo || 'Unknown'} - {job.customer?.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Assign Mechanic</label>
                <select
                  className="input-glass"
                  value={newMechanic}
                  onChange={(e) => setNewMechanic(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-card)' }}
                >
                  <option value="">-- Select Mechanic --</option>
                  {mechanicsList.map(mech => (
                    <option key={mech.id} value={mech.id}>
                      {mech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAllocation}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Bay Modal */}
        {addBayModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="glass-card" style={{ width: '420px', maxWidth: '90vw', padding: '24px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>Add New Workshop Bay</h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Bay Number (e.g. BAY-06)</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="BAY-06"
                  value={newBayNumber}
                  onChange={(e) => setNewBayNumber(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Bay Name / Type</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Electric Vehicle Bay"
                  value={newBayName}
                  onChange={(e) => setNewBayName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setAddBayModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBay}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={!newBayNumber}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
