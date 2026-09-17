'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { BrowserBarcodeReader } from '@zxing/library';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onScanResult }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserBarcodeReader | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const codeReader = new BrowserBarcodeReader();
    readerRef.current = codeReader;
    const start = async () => {
      try {
        const constraints = { video: { facingMode: 'environment' } } as MediaStreamConstraints;
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        // Continuously decode frames
        const decodeLoop = async () => {
          try {
            const result = await codeReader.decodeFromVideoElement(videoRef.current!);
            if (result) {
              onScanResult(result.getText());
              onClose();
            }
          } catch (e) {
            // ignore decode errors, they are frequent when no barcode present
          }
          if (isOpen) requestAnimationFrame(decodeLoop);
        };
        decodeLoop();
      } catch (e) {
        setError('Camera access denied or unavailable.');
      }
    };
    start();
    return () => {
      // cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      codeReader.reset();
    };
  }, [isOpen, onClose, onScanResult]);

  if (!isOpen) return null;

  const handleManualSubmit = () => {
    if (manualCode) {
      onScanResult(manualCode);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-card" style={{ width: '480px', maxWidth: '90vw', padding: '24px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="var(--text-main)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Barcode & QR Scanner</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {error && (<p style={{ color: '#b91c1c', marginBottom: '12px' }}>{error}</p>)}
        <div style={{ width: '100%', height: '260px', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
        </div>
        <div style={{ marginTop: '18px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Manual Entry / USB Scanner</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter barcode manually"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
              className="input-glass"
              style={{ flex: 1 }}
            />
            <button onClick={handleManualSubmit} className="btn-primary">Use</button>
          </div>
        </div>
      </div>
    </div>
  );
}
