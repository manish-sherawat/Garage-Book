'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/format';
import { Zap, CreditCard, Banknote, Split, Check, X, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getSettings } from '@/utils/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCardId: string;
  totalAmount: number;
  customerName?: string;
  vehicleNo?: string;
  onPaymentSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  jobCardId,
  totalAmount,
  customerName = 'Customer',
  vehicleNo = 'Vehicle',
  onPaymentSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'CASH' | 'SPLIT'>('UPI');
  const [cashAmount, setCashAmount] = useState<number>(totalAmount / 2);
  const [onlineAmount, setOnlineAmount] = useState<number>(totalAmount / 2);
  const [transactionId, setTransactionId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [upiId, setUpiId] = useState('garagebook@upi');
  const [accountName, setAccountName] = useState('GarageBook Auto Care');

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      getSettings().then(settings => {
        if (isMounted && settings) {
          if (settings.upiId) setUpiId(settings.upiId);
          if (settings.accountHolderName) setAccountName(settings.accountHolderName);
        }
      }).catch(console.error);
    }
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountName)}&am=${
    method === 'SPLIT' ? onlineAmount.toFixed(2) : totalAmount.toFixed(2)
  }&cu=INR&tn=Invoice%20${jobCardId.slice(0, 8)}`;

  const handleProcessPayment = async () => {
    setErrorMessage(null);

    // E13 Validation
    if (method === 'CARD') {
      if (!transactionId.trim()) {
        setErrorMessage('Transaction reference / Receipt note is required for card payment.');
        return;
      }
    }

    if (method === 'SPLIT') {
      const sum = Number(cashAmount || 0) + Number(onlineAmount || 0);
      if (Math.abs(sum - totalAmount) > 0.01) {
        setErrorMessage(`Split payments must equal total amount (₹${formatCurrency(totalAmount)}). Current sum is ₹${formatCurrency(sum)}.`);
        return;
      }
      if (!transactionId.trim()) {
        setErrorMessage('Transaction reference / Receipt note is required for split payment records.');
        return;
      }
    }

    // Call API to persist payment
    try {
      const { createPayment } = await import('@/utils/api');
      await createPayment({
        jobCardId: jobCardId || 'JOB-GENERAL',
        amount: totalAmount,
        paymentMethod: method,
        transactionId: transactionId.trim() || undefined,
        notes: `Customer: ${customerName}, Vehicle: ${vehicleNo}`,
      });
      
      setIsSuccess(true);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (e) {
      console.error('Payment API call failed:', e);
      setErrorMessage('Payment failed to process. Please try again or check the connection.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-card" style={{ width: '460px', maxWidth: '90vw', padding: '24px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Process Payment</h3>
            <p style={{ margin: '3px 0 0', opacity: 0.7, fontSize: '12.5px', color: 'var(--text-muted)' }}>{customerName} • {vehicleNo}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)',
            padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '600',
            marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Check size={32} />
            </div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Payment Completed</h4>
            <p style={{ opacity: 0.7, fontSize: '13px', marginTop: '6px', color: 'var(--text-muted)' }}>Transaction logged successfully.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '10px', marginBottom: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Total Payable Amount</span>
              <h2 style={{ margin: '3px 0 0', fontSize: '28px', color: 'var(--text-main)', fontWeight: '800' }}>₹{formatCurrency(totalAmount)}</h2>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <button
                onClick={() => { setMethod('UPI'); setErrorMessage(null); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: method === 'UPI' ? '#18181b' : 'var(--bg-card)',
                  color: method === 'UPI' ? 'var(--bg-card)' : 'var(--text-main)', fontWeight: '600', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}
              >
                <Zap size={14} /> UPI QR
              </button>

              <button
                onClick={() => { setMethod('CARD'); setErrorMessage(null); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: method === 'CARD' ? '#18181b' : 'var(--bg-card)',
                  color: method === 'CARD' ? 'var(--bg-card)' : 'var(--text-main)', fontWeight: '600', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}
              >
                <CreditCard size={14} /> Card
              </button>

              <button
                onClick={() => { setMethod('CASH'); setErrorMessage(null); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: method === 'CASH' ? '#18181b' : 'var(--bg-card)',
                  color: method === 'CASH' ? 'var(--bg-card)' : 'var(--text-main)', fontWeight: '600', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}
              >
                <Banknote size={14} /> Cash
              </button>

              <button
                onClick={() => { setMethod('SPLIT'); setErrorMessage(null); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: '6px', border: '1px solid var(--border-color)',
                  background: method === 'SPLIT' ? '#18181b' : 'var(--bg-card)',
                  color: method === 'SPLIT' ? 'var(--bg-card)' : 'var(--text-main)', fontWeight: '600', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}
              >
                <Split size={14} /> Split
              </button>
            </div>

            {/* Method Details */}
            {method === 'UPI' && (
              <div style={{ textAlign: 'center', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#fff', padding: '12px', display: 'inline-block', borderRadius: '8px', border: '1px solid var(--border-color)', margin: '0 auto 10px' }}>
                  <QRCodeSVG value={upiUri} size={160} level="M" />
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
                <p style={{ fontSize: '13px', fontWeight: '800', margin: '4px 0 2px', color: 'var(--text-main)' }}>UPI ID: {upiId}</p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>Payee: {accountName}</p>
              </div>
            )}

            {method === 'SPLIT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Cash Amount (₹)</label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCashAmount(val);
                        setOnlineAmount(totalAmount - val);
                      }}
                      className="input-glass"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Online Amount (₹)</label>
                    <input
                      type="number"
                      value={onlineAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setOnlineAmount(val);
                        setCashAmount(totalAmount - val);
                      }}
                      className="input-glass"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Transaction Ref / Split Notes *</label>
                  <input
                    type="text"
                    placeholder="e.g. CASH_2000_UPI_25200"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="input-glass"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            {method === 'CARD' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Transaction Ref / Receipt Note *</label>
                <input
                  type="text"
                  placeholder="e.g. CARD_982314"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="input-glass"
                  style={{ width: '100%' }}
                />
              </div>
            )}
            
            {method === 'CASH' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Receipt Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CASH_REC_01"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="input-glass"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <button
              onClick={handleProcessPayment}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}
             
            >
              Confirm &amp; Collect ₹{formatCurrency(totalAmount)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
