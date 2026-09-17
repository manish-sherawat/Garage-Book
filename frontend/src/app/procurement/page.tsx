'use client';
import { useToast } from '@/components/ToastProvider';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/utils/format';
import {
  ShoppingCart,
  Plus,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  AlertTriangle,
  X,
  Building2,
  Calendar,
  Check,
} from 'lucide-react';
import { getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, getSuppliers, getInventoryItems } from '@/utils/api';

interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  vendorName: string;
  itemsCount: number;
  itemsSummary: string;
  totalAmount: number;
  status: 'PENDING_DELIVERY' | 'RECEIVED' | 'DRAFT';
  orderDate: string;
  expectedDelivery: string;
}

export default function ProcurementPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<PurchaseOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  // Dependencies
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // New PO Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<Array<{ inventoryItemId: string; name: string; quantity: number; unitCost: number }>>([]);
  const [expectedDelivery, setExpectedDelivery] = useState('');

  const fetchLivePOList = async () => {
    const res = await getPurchaseOrders();
    if (res && Array.isArray(res) && res.length > 0) {
      setOrders(
        res.map((po: any) => ({
          id: po.id,
          poNumber: po.poNumber || `PO-${po.id.slice(0, 6)}`,
          vendorName: po.supplier?.name || po.vendorName || 'Auto Parts Supplier',
          itemsCount: po.items?.length || 1,
          itemsSummary: po.itemsSummary || (po.items ? po.items.map((i: any) => i.inventoryItem?.name).join(', ') : 'Spare Parts Order'),
          totalAmount: po.totalAmount || 0,
          status: po.status || 'PENDING_DELIVERY',
          orderDate: po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
          expectedDelivery: po.expectedDelivery || 'Expected in 2 days',
        }))
      );
    }
  };

  const fetchDependencies = async () => {
    const supps = await getSuppliers();
    const inv = await getInventoryItems();
    if (supps && Array.isArray(supps)) setSuppliers(supps);
    if (inv && Array.isArray(inv)) setInventoryItems(inv);
  };

  useEffect(() => {
    fetchLivePOList();
    fetchDependencies();
  }, []);

  const filteredOrders = orders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) {
      toast.error('Please select a supplier and add at least one item.');
      return;
    }

    try {
      await createPurchaseOrder({
        supplierId: selectedSupplierId,
        status: 'SENT',
        items: poItems.map(item => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      });
      await fetchLivePOList();
    } catch (err) {
      console.warn('Create PO API call notice:', err);
    }

    setModalOpen(false);
    setSelectedSupplierId('');
    setPoItems([]);
    setExpectedDelivery('');
  };

  const handleMarkReceived = async (id: string) => {
    // Optimistic update
    setOrders(
      orders.map((po) =>
        po.id === id ? { ...po, status: 'RECEIVED' as const } : po
      )
    );
    try {
      await receivePurchaseOrder(id);
      await fetchLivePOList();
    } catch (err) {
      console.error('Failed to mark PO as received:', err);
      await fetchLivePOList();
    }
  };

  const handleCancelPO = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this purchase order?')) return;
    try {
      await cancelPurchaseOrder(id);
      await fetchLivePOList();
      toast.success('Purchase order cancelled successfully.');
    } catch (err) {
      console.error('Failed to cancel PO:', err);
      toast.error('Failed to cancel purchase order.');
    }
  };

  const totalValue = orders.reduce((sum, po) => sum + po.totalAmount, 0);
  const pendingOrders = orders.filter((po) => po.status === 'PENDING_DELIVERY');
  const receivedOrders = orders.filter((po) => po.status === 'RECEIVED');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-main)' }}>
      <Sidebar />

      <main className="main-content">
        {/* Header */}
        <header className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', margin: 0, fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingCart size={22} color="var(--accent)" /> Procurement &amp; Purchase Orders
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Manage vendor orders, track parts stock replenishment, and record incoming supply invoices.
            </p>
          </div>

          <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ borderRadius: '10px' }}>
            <Plus size={15} color="var(--bg-card)" /> Create Purchase Order
          </button>
        </header>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Orders</span>
              <div style={{ padding: '7px', borderRadius: '9px', background: '#e8f8f2' }}><ShoppingCart size={16} color="var(--accent)" /></div>
            </div>
            <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>{orders.length} Orders</h2>
            <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: '600', display: 'block', marginTop: '4px' }}>₹{formatCurrency(totalValue)} total value</span>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Pending Deliveries</span>
              <div style={{ padding: '7px', borderRadius: '9px', background: '#fffbeb' }}><Truck size={16} color="var(--warning)" /></div>
            </div>
            <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '800', color: 'var(--warning)' }}>{pendingOrders.length} Shipments</h2>
            <span style={{ fontSize: '11.5px', color: 'var(--warning)', fontWeight: '600', display: 'block', marginTop: '4px' }}>In Transit from vendors</span>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Fulfilled Orders</span>
              <div style={{ padding: '7px', borderRadius: '9px', background: '#f0fdf4' }}><CheckCircle2 size={16} color="var(--success)" /></div>
            </div>
            <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '800', color: 'var(--success)' }}>{receivedOrders.length} Completed</h2>
            <span style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: '600', display: 'block', marginTop: '4px' }}>Added to Live Stock</span>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Reorder Suggestions</span>
              <div style={{ padding: '7px', borderRadius: '9px', background: '#fef2f2' }}><AlertTriangle size={16} color="var(--danger)" /></div>
            </div>
            <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '800', color: 'var(--danger)' }}>{inventoryItems.filter((i) => i.quantity <= i.minQuantity).length} Parts</h2>
            <span style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: '600', display: 'block', marginTop: '4px' }}>Below Safety Stock</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '14px', display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search size={17} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search PO Number, Vendor Name, or Parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {['ALL', 'PENDING_DELIVERY', 'RECEIVED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: statusFilter === status ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: statusFilter === status ? '#e8f8f2' : 'var(--bg-card)',
                  color: statusFilter === status ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {status === 'ALL' ? 'All Orders' : status === 'PENDING_DELIVERY' ? 'Pending Delivery' : 'Received'}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-color)', fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 18px' }}>PO Number</th>
                <th style={{ padding: '14px 18px' }}>Vendor Supplier</th>
                <th style={{ padding: '14px 18px' }}>Parts Summary</th>
                <th style={{ padding: '14px 18px' }}>Total Amount</th>
                <th style={{ padding: '14px 18px' }}>Order Date</th>
                <th style={{ padding: '14px 18px' }}>Expected Delivery</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '24px' }}>
                    <EmptyState
                      icon={ShoppingCart}
                      title="No Purchase Orders Found"
                      description="No purchase orders match your selected status filter or search query. Click below to issue a new order."
                      actionLabel="+ Issue Purchase Order"
                      onAction={() => setModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                    <td style={{ padding: '16px 18px', fontWeight: '800', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} color="var(--accent)" />
                        {po.poNumber}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {po.vendorName}
                    </td>
                    <td style={{ padding: '16px 18px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                      <span style={{ fontSize: '12px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {po.itemsSummary}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{po.itemsCount} total units</span>
                    </td>
                    <td style={{ padding: '16px 18px', fontWeight: '800', color: 'var(--text-main)' }}>
                      ₹{formatCurrency(po.totalAmount)}
                    </td>
                    <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {po.orderDate}
                    </td>
                    <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {po.expectedDelivery}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      {po.status === 'RECEIVED' ? (
                        <span className="badge badge-completed" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          <CheckCircle2 size={12} /> Received
                        </span>
                      ) : (
                        <span className="badge badge-pending" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      {po.status === 'PENDING_DELIVERY' && (
                        <button
                          onClick={() => handleMarkReceived(po.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: '#f0fdf4',
                            color: 'var(--success)',
                            border: '1px solid #bbf7d0',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={13} /> Mark Received
                        </button>
                      )}
                      {po.status === 'PENDING_DELIVERY' && (
                        <button
                          onClick={() => handleCancelPO(po.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: '#fef2f2',
                            color: 'var(--danger)',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: '8px',
                          }}
                        >
                          <X size={13} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Create Purchase Order */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.5)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card" style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '520px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={20} color="var(--accent)" /> New Purchase Order
                </h3>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Vendor / Supplier</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="input-glass"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Add Parts to Order</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                    <select
                      className="input-glass"
                      id="partSelect"
                    >
                      <option value="">Select Part from Inventory...</option>
                      {inventoryItems.map(p => (
                        <option key={p.id} value={p.id} data-price={p.price} data-name={p.name}>{p.name} (Stock: {p.quantity})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById('partSelect') as HTMLSelectElement;
                        const opt = sel.options[sel.selectedIndex];
                        if (opt.value) {
                          setPoItems([...poItems, { inventoryItemId: opt.value, name: opt.getAttribute('data-name')!, quantity: 1, unitCost: parseFloat(opt.getAttribute('data-price')!) }]);
                          sel.value = '';
                        }
                      }}
                      className="btn-secondary"
                      style={{ padding: '0 16px' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {poItems.length > 0 && (
                  <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {poItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.name}</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...poItems];
                            newItems[idx].quantity = parseInt(e.target.value) || 1;
                            setPoItems(newItems);
                          }}
                          className="input-glass"
                          style={{ padding: '6px 10px' }}
                          placeholder="Qty"
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => {
                            const newItems = [...poItems];
                            newItems[idx].unitCost = parseFloat(e.target.value) || 0;
                            setPoItems(newItems);
                          }}
                          className="input-glass"
                          style={{ padding: '6px 10px' }}
                          placeholder="Cost"
                        />
                        <button type="button" onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px', fontWeight: '800' }}>
                      <span>Total Amount:</span>
                      <span>₹{formatCurrency(poItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0))}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Expected Delivery Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 05 Aug 2026"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="input-glass"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Issue Purchase Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
