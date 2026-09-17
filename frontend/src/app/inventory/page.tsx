'use client';
import { useToast } from '@/components/ToastProvider';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import { formatCurrency } from '@/utils/format';
import { Package, Camera, Search, Tag, Plus, Download, Upload, ChevronLeft, ChevronRight, Pencil, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import Snackbar from '@/components/Snackbar';
import * as XLSX from 'xlsx';
import { getInventoryItems, updateInventoryItem, createInventoryItem, deleteInventoryItem, bulkCreateInventoryItems } from '@/utils/api';
import { Suspense } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  minQuantity: number;
  price: number;
}

function InventoryContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchLiveInventory = async () => {
    try {
      const data = await getInventoryItems();
      if (data && Array.isArray(data) && data.length > 0) {
        setInventory(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            partNumber: item.partNumber,
            quantity: item.quantity,
            minQuantity: item.minQuantity,
            price: item.price,
          }))
        );
      }
    } catch (e) {
      console.warn('Live inventory API fetch notice:', e);
    }
  };

  useEffect(() => {
    fetchLiveInventory();
  }, []);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPartNo, setFormPartNo] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formMinQty, setFormMinQty] = useState('');
  const [formPrice, setFormPrice] = useState('');

  const generateSKUFromName = (name: string) => {
    if (!name || !name.trim()) return `PART-SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanName = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .map((w) => w.slice(0, 4))
      .join('-');
    const suffix = Math.floor(100 + Math.random() * 900);
    return `PART-${cleanName}-${suffix}`;
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormPartNo(generateSKUFromName(''));
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPartNo(item.partNumber);
    setFormQty(item.quantity.toString());
    setFormMinQty(item.minQuantity.toString());
    setFormPrice(item.price.toString());
    setEditModalOpen(true);
  };

  const handleSaveEditPart = async () => {
    if (!editingItem) return;
    if (!formName.trim()) {
      toast.error('Please enter a part name.');
      return;
    }
    
    const updatedData = {
      name: formName.trim(),
      partNumber: formPartNo.trim() || editingItem.partNumber,
      quantity: parseInt(formQty) || 0,
      minQuantity: parseInt(formMinQty) || 0,
      price: parseFloat(formPrice) || 0,
    };

    setInventory((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? { ...item, ...updatedData }
          : item,
      ),
    );
    
    try {
      await updateInventoryItem(editingItem.id, updatedData);
      await fetchLiveInventory();
    } catch (e) {
      console.warn('Failed to update inventory part:', e);
    }
    
    setEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeletePart = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    // Optimistic UI update
    setInventory((prev) => prev.filter((item) => item.id !== id));
    
    try {
      await deleteInventoryItem(id);
      await fetchLiveInventory();
    } catch (e) {
      console.warn('Failed to delete inventory part:', e);
    }
  };

  const handleDownloadReorderReport = () => {
    const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity);
    if (lowStockItems.length === 0) {
      toast.error('No low stock items currently.');
      return;
    }

    const reportData = lowStockItems.map(item => ({
      'Part Name': item.name,
      'Part SKU Barcode': item.partNumber,
      'Current Quantity': item.quantity,
      'Min Threshold': item.minQuantity,
      'Unit Price (INR)': item.price,
      'Deficit': item.minQuantity - item.quantity,
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Stock Reorder');

    worksheet['!cols'] = [
      { wch: 36 },
      { wch: 22 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
    ];

    XLSX.writeFile(workbook, `GarageBook_Reorder_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadSampleXLSX = () => {
    const sampleData = [
      {
        'Part Name': 'Synthetic Engine Oil 5W-30 (4L)',
        'Part SKU Barcode': 'PART-ENG-5W30',
        'Quantity': 20,
        'Min Threshold': 5,
        'Price (INR)': 3250,
      },
      {
        'Part Name': 'Front Ceramic Brake Pads Set',
        'Part SKU Barcode': 'PART-BRK-PADS',
        'Quantity': 15,
        'Min Threshold': 6,
        'Price (INR)': 2450,
      },
      {
        'Part Name': 'High Performance Oil Filter',
        'Part SKU Barcode': 'PART-OIL-FLTR',
        'Quantity': 50,
        'Min Threshold': 10,
        'Price (INR)': 450,
      },
      {
        'Part Name': 'Iridium Spark Plug (Set of 4)',
        'Part SKU Barcode': 'PART-SPK-PLUG',
        'Quantity': 12,
        'Min Threshold': 4,
        'Price (INR)': 1800,
      },
      {
        'Part Name': 'Heavy Duty 12V 45Ah Car Battery',
        'Part SKU Barcode': 'PART-BAT-45AH',
        'Quantity': 8,
        'Min Threshold': 3,
        'Price (INR)': 5600,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Spare Parts');

    worksheet['!cols'] = [
      { wch: 36 },
      { wch: 22 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.writeFile(workbook, 'GarageBook_Inventory_Sample_Template.xlsx');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const newItems: InventoryItem[] = [];

        jsonData.forEach((row, idx) => {
          const name = String(row['Part Name'] || row['name'] || row['Part'] || row['Item Name'] || '').trim();
          if (!name) return;

          const rawSKU = String(row['Part SKU Barcode'] || row['SKU Barcode'] || row['partNumber'] || row['SKU'] || '').trim();
          const partNumber = rawSKU !== '' ? rawSKU : generateSKUFromName(name);

          const quantity = Number(row['Quantity'] || row['quantity'] || row['Qty']) || 10;
          const minQuantity = Number(row['Min Threshold'] || row['minQuantity'] || row['Min Qty']) || 5;
          const price = Number(row['Price (INR)'] || row['Price'] || row['price']) || 1000;

          newItems.push({
            id: `INV-XLSX-${Date.now().toString().slice(-4)}-${idx}`,
            name,
            partNumber,
            quantity,
            minQuantity,
            price,
          });
        });

        if (newItems.length > 0) {
          // Optimistic local state update
          setInventory((prev) => [...newItems, ...prev]);
          setCurrentPage(1);
          
          // Persist each imported item to backend
          bulkCreateInventoryItems({ items: newItems }).then(() => {
            fetchLiveInventory();
            setImportNotice(`Successfully imported ${newItems.length} parts from Excel (.xlsx) file into inventory!`);
            setTimeout(() => setImportNotice(null), 5000);
          }).catch((err) => {
            console.error('Error saving imported inventory items to backend:', err);
            setImportNotice(`Partially imported ${newItems.length} parts, but some failed to save to the database. They might be duplicates.`);
            setTimeout(() => setImportNotice(null), 5000);
          });
        } else {
          toast.error('No valid part records found in the uploaded file.');
        }
      } catch (err) {
        console.error('Failed to parse file:', err);
        toast.error('Error parsing Excel file. Please upload a valid .xlsx, .xls, or .csv document.');
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const filteredInventory = inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.partNumber.toLowerCase().includes(search.toLowerCase()),
  );

  // Pagination Calculations
  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

  const totalValuation = inventory.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const lowStockCount = inventory.filter((item) => item.quantity <= item.minQuantity).length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const handleScanResult = (code: string) => {
    const matched = inventory.find((i) => i.partNumber.toLowerCase() === code.toLowerCase());
    if (matched) {
      toast.success(`MATCHED INVENTORY ITEM:\nPart: ${matched.name}\nSKU: ${matched.partNumber}\nIn Stock: ${matched.quantity} units\nPrice: ₹${formatCurrency(matched.price)}`);
    } else {
      toast.success(`Scanned Code: ${code}\nNo exact match found in current inventory catalogue.`);
    }
  };

  const handleAddPart = async () => {
    if (!formName) {
      toast.error('Please fill in Part Name.');
      return;
    }
    setIsSubmitting(true);

    const skuToUse = (formPartNo && formPartNo.trim() !== '') ? formPartNo.trim() : generateSKUFromName(formName);

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: formName,
      partNumber: skuToUse,
      quantity: Number(formQty) || 10,
      minQuantity: Number(formMinQty) || 5,
      price: Number(formPrice) || 1500,
    };

    setInventory([newItem, ...inventory]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://garagebook-new.vercel.app/api/v1';
      await fetch(`${apiUrl}/procurement/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          partNumber: skuToUse,
          quantity: Number(formQty) || 10,
          minQuantity: Number(formMinQty) || 5,
          price: Number(formPrice) || 1500,
        }),
      });
    } catch (e) {
      console.warn('Save part API notice:', e);
      setToastMessage({ type: 'error', text: 'Failed to add part.' });
    }
    setToastMessage({ type: 'success', text: `Part ${formName} added successfully!` });

    setCurrentPage(1);
    setAddModalOpen(false);
    setFormName('');
    setFormPartNo('');
    setFormQty('');
    setFormMinQty('');
    setFormPrice('');
    setIsSubmitting(false);
  };

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
              <Package size={22} color="var(--text-main)" /> Parts &amp; Inventory Stock
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Real-time stock level tracking, Excel (.xlsx) bulk import/export &amp; barcode lookup.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleDownloadReorderReport}
              className="btn-secondary"
              style={{
                background: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}
            >
              <AlertTriangle size={15} /> Reorder Report
            </button>

            <button onClick={handleDownloadSampleXLSX} className="btn-secondary" title="Download sample Excel (.xlsx) template for editing">
              <Download size={15} color="var(--text-main)" /> Sample Excel (.xlsx)
            </button>

            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Import parts list from Excel or CSV file">
              <Upload size={15} color="var(--text-main)" /> Import Excel
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>

            <button onClick={() => setScannerOpen(true)} className="btn-secondary">
              <Camera size={15} color="var(--text-main)" /> Scan Barcode
            </button>

            <button onClick={handleOpenAddModal} className="btn-primary">
              <Plus size={15} color="var(--bg-card)" /> Add Spare Part
            </button>
          </div>
        </div>

        {/* CSV Import Success Banner */}
        {importNotice && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: '700', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚡ {importNotice}</span>
            <button onClick={() => setImportNotice(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: '800' }}>✕</button>
          </div>
        )}

        {/* Inventory KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Part SKUs</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '800' }}>{inventory.length} Items</h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Valuation</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '800' }}>
              ₹{formatCurrency(totalValuation)}
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Low Stock Items</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--danger)', fontWeight: '800' }}>
              {lowStockCount} Reorders Due
            </h2>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Stock Units</span>
            <h2 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '800' }}>{totalUnits} Units</h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-card" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '380px' }}>
            <input
              type="text"
              className="input-glass"
              placeholder="Search part name or SKU barcode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing <strong>{totalItems > 0 ? startIndex + 1 : 0} - {endIndex}</strong> of <strong>{totalItems}</strong> catalog items
          </span>
        </div>

        {/* Inventory Items Table */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Part Details &amp; SKU</th>
                <th style={{ padding: '10px 8px' }}>Stock Quantity</th>
                <th style={{ padding: '10px 8px' }}>Unit Price</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px' }}>
                    <EmptyState
                      icon={Package}
                      title="No Inventory Parts Found"
                      description="No spare parts match your search query. Add a new spare part or import from Excel spreadsheet."
                      actionLabel="+ Add Spare Part"
                      onAction={handleOpenAddModal}
                    />
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => {
                  const isLow = item.quantity <= item.minQuantity;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--bg-canvas)', fontSize: '13px' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <strong style={{ color: 'var(--text-main)', display: 'block' }}>{item.name}</strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Tag size={11} color="var(--text-muted)" /> {item.partNumber}
                        </span>
                      </td>

                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '14px', color: isLow ? 'var(--danger)' : 'var(--text-main)' }}>{item.quantity} units</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Min: {item.minQuantity})</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                        ₹{formatCurrency(item.price)}
                      </td>

                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {isLow ? (
                          <span className="badge badge-pending"><AlertTriangle size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> Low Stock</span>
                        ) : (
                          <span className="badge badge-completed">In Stock</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePart(item.id, item.name)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', marginLeft: '6px', background: '#fef2f2', color: 'var(--danger)', border: '1px solid #fecaca' }}
                          title="Delete Part"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--bg-canvas)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalItems}</strong> items
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  <span>Show per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={10}>10 items</option>
                    <option value={20}>20 items</option>
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={validCurrentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: validCurrentPage === 1 ? 'var(--bg-canvas)' : 'var(--bg-card)',
                      color: validCurrentPage === 1 ? '#94a3b8' : 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - validCurrentPage) <= 1)
                    .map((pg, idx, arr) => {
                      const prevPg = arr[idx - 1];
                      const showEllipsis = prevPg && pg - prevPg > 1;

                      return (
                        <span key={pg} style={{ display: 'flex', alignItems: 'center' }}>
                          {showEllipsis && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: pg === validCurrentPage ? '1px solid #18181b' : '1px solid #cbd5e1',
                              background: pg === validCurrentPage ? '#18181b' : 'var(--bg-card)',
                              color: pg === validCurrentPage ? 'var(--bg-card)' : 'var(--text-main)',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              margin: '0 2px',
                            }}
                          >
                            {pg}
                          </button>
                        </span>
                      );
                    })}

                  <button
                    type="button"
                    disabled={validCurrentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: validCurrentPage === totalPages ? 'var(--bg-canvas)' : 'var(--bg-card)',
                      color: validCurrentPage === totalPages ? '#94a3b8' : 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barcode Scanner Modal */}
        <BarcodeScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanResult={handleScanResult}
        />

        {/* Add Part Modal */}
        {addModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="glass-card" style={{ width: '480px', maxWidth: '92vw', padding: '24px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Add Spare Part to Stock</h3>
                <button onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Part Name *</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Engine Oil 5W-30"
                  value={formName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormName(val);
                    setFormPartNo(generateSKUFromName(val));
                  }}
                  style={{ width: '100%' }}
                />
              </div>

              <div
                style={{
                  fontSize: '12.5px',
                  color: '#15803d',
                  fontWeight: '700',
                  background: '#f0fdf4',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span>⚡ Auto-Generated SKU Barcode: <strong>{formPartNo || 'PART-SKU-0000'}</strong></span>
                <button
                  type="button"
                  onClick={() => setFormPartNo(generateSKUFromName(formName))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#15803d',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    textDecoration: 'underline',
                  }}
                >
                  Regenerate 🔄
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quantity</label>
                  <input
                    type="number"
                    className="input-glass"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Min Threshold</label>
                  <input
                    type="number"
                    className="input-glass"
                    value={formMinQty}
                    onChange={(e) => setFormMinQty(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Price (₹)</label>
                  <input
                    type="number"
                    className="input-glass"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setAddModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button onClick={handleAddPart} disabled={isSubmitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? (
                    <><Loader2 size={16} className="spin-animation" style={{ marginRight: '6px' }}/> Saving...</>
                  ) : (
                    'Save Part'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Part Modal */}
        {editModalOpen && editingItem && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="glass-card" style={{ width: '480px', maxWidth: '92vw', padding: '24px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pencil size={18} /> Edit Inventory Part
                </h3>
                <button onClick={() => setEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Part Name *</label>
                <input
                  type="text"
                  className="input-glass"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>SKU / Barcode *</label>
                <input
                  type="text"
                  className="input-glass"
                  value={formPartNo}
                  onChange={(e) => setFormPartNo(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quantity</label>
                  <input
                    type="number"
                    className="input-glass"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Min Threshold</label>
                  <input
                    type="number"
                    className="input-glass"
                    value={formMinQty}
                    onChange={(e) => setFormMinQty(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Price (₹)</label>
                  <input
                    type="number"
                    className="input-glass"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button onClick={handleSaveEditPart} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Update Part Details
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InventoryPage() {
  const toast = useToast();
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}><Loader2 className="animate-spin" /> Loading Inventory...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
