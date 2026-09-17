'use client';
import { useToast } from '@/components/ToastProvider';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import EmptyState from '@/components/EmptyState';
import { Settings, Store, Receipt, Bell, ShieldCheck, Save, CheckCircle2, Database, Smartphone, Mail, User, MapPin, Percent, Download, Globe, Building, ImagePlus, UploadCloud, Trash2, Clock, Languages, Calendar, Coins, Sliders, CalendarDays, Plus, X, FileText, Eye, Tag, Send, Sun, Moon, Monitor } from 'lucide-react';
import { getSettings, updateSettings } from '@/utils/api';

const STATES_BY_COUNTRY: Record<string, string[]> = {
  India: [
    'Delhi',
    'Maharashtra',
    'Karnataka',
    'Tamil Nadu',
    'Haryana',
    'Uttar Pradesh',
    'Gujarat',
    'Punjab',
    'Telangana',
    'West Bengal',
    'Rajasthan',
    'Kerala',
    'Madhya Pradesh',
    'Andhra Pradesh',
  ],
  'United States': [
    'California',
    'Texas',
    'New York',
    'Florida',
    'Illinois',
    'Washington',
    'Georgia',
    'Ohio',
    'Pennsylvania',
    'North Carolina',
  ],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
  Canada: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
  Australia: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
  Germany: ['Bavaria', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Berlin'],
  Singapore: ['Central Region', 'East Region', 'North Region', 'West Region'],
};

interface BusinessDaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHoliday {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  isDefault?: boolean;
}

const TIME_OPTIONS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM',
];

const MERGE_TAGS = [
  { tag: '{CUSTOMER_NAME}', label: 'Customer Name', sample: 'Rajesh Kumar' },
  { tag: '{VEHICLE_MODEL}', label: 'Vehicle Model', sample: 'Hyundai Creta 1.5' },
  { tag: '{REGISTRATION_NO}', label: 'Reg No.', sample: 'DL 01 AB 1234' },
  { tag: '{JOB_ID}', label: 'Job ID / Invoice #', sample: 'GB-JOB-402' },
  { tag: '{TOTAL_AMOUNT}', label: 'Total Amount', sample: '₹4,850' },
  { tag: '{WORKSHOP_NAME}', label: 'Workshop Name', sample: 'GarageBook Auto Services' },
  { tag: '{MECHANIC_NAME}', label: 'Mechanic Name', sample: 'Vikram Singh' },
];

const applyTheme = (mode: 'light' | 'dark' | 'system') => {
  if (typeof window === 'undefined') return;
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.body && document.body.classList.add('dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.body && document.body.classList.remove('dark');
  }
};

export default function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'billing' | 'templates' | 'notifications' | 'theme' | 'other' | 'team'>('profile');
  const [savedTab, setSavedTab] = useState<string | null>(null);

  // Form State - Workshop Profile
  const [workshopName, setWorkshopName] = useState('GarageBook Auto Services');
  const [ownerName, setOwnerName] = useState('Admin Owner');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('admin@garagebook.io');
  const [gstin, setGstin] = useState('27AAACG1234F1Z5');
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Delhi');
  const [address, setAddress] = useState('Plot 42, Industrial Area Phase 2, New Delhi, India');

  // Workshop Logo State
  const [logoImage, setLogoImage] = useState<string | null>(null);

  // Business Hours State
  const [schedules, setSchedules] = useState<BusinessDaySchedule[]>([
    { day: 'Monday', isOpen: true, openTime: '09:00 AM', closeTime: '07:00 PM' },
    { day: 'Tuesday', isOpen: true, openTime: '09:00 AM', closeTime: '07:00 PM' },
    { day: 'Wednesday', isOpen: true, openTime: '09:00 AM', closeTime: '07:00 PM' },
    { day: 'Thursday', isOpen: true, openTime: '09:00 AM', closeTime: '07:00 PM' },
    { day: 'Friday', isOpen: true, openTime: '09:00 AM', closeTime: '07:00 PM' },
    { day: 'Saturday', isOpen: true, openTime: '09:30 AM', closeTime: '05:30 PM' },
    { day: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '04:00 PM' },
  ]);

  useEffect(() => {
    let isMounted = true;
    const fetchSavedSettings = async () => {
      try {
        const parsed = await getSettings();
        if (!parsed || !isMounted) return;
        
        if (parsed.workshopName) setWorkshopName(parsed.workshopName);
        if (parsed.ownerName) setOwnerName(parsed.ownerName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.gstin) setGstin(parsed.gstin);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.stateName) setStateName(parsed.stateName);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.logoImage) setLogoImage(parsed.logoImage);
        if (parsed.schedules) setSchedules(parsed.schedules);
        if (parsed.holidays) setHolidays(parsed.holidays);
        if (parsed.templates) setTemplates(parsed.templates);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.taxRate) setTaxRate(parsed.taxRate);
        if (parsed.laborRate) setLaborRate(parsed.laborRate);
        if (parsed.invoicePrefix) setInvoicePrefix(parsed.invoicePrefix);
        if (parsed.autoInvoice !== undefined) setAutoInvoice(parsed.autoInvoice);
        if (parsed.smsNotification !== undefined) setSmsNotification(parsed.smsNotification);
        if (parsed.emailNotification !== undefined) setEmailNotification(parsed.emailNotification);
        if (parsed.lowStockAlert !== undefined) setLowStockAlert(parsed.lowStockAlert);
        if (parsed.timeZone) setTimeZone(parsed.timeZone);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.dateFormat) setDateFormat(parsed.dateFormat);
        
        if (parsed.smtpHost) setSmtpHost(parsed.smtpHost);
        if (parsed.smtpPort) setSmtpPort(parsed.smtpPort);
        if (parsed.smtpUser) setSmtpUser(parsed.smtpUser);
        if (parsed.smtpPass) setSmtpPass(parsed.smtpPass);
      } catch (e) {
        console.error('Failed to fetch settings from API', e);
      }
    };
    
    fetchSavedSettings();

    if (typeof window !== 'undefined') {
      
      const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme) {
        setThemeMode(savedTheme);
        applyTheme(savedTheme);
      } else {
        applyTheme('light');
      }
    }
    
    return () => { isMounted = false; };
  }, []);

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('postmaster@garagebook.io');
  const [smtpPass, setSmtpPass] = useState('••••••••••••••••');

  // Business Holidays State
  const [holidays, setHolidays] = useState<BusinessHoliday[]>([
    { id: '1', title: 'Independence Day', date: '2026-08-15', type: 'National Holiday' },
    { id: '2', title: 'Diwali Festival Break', date: '2026-11-01', type: 'Festive Holiday' },
    { id: '3', title: 'New Year Day', date: '2027-01-01', type: 'Public Holiday' },
  ]);

  const [addHolidayModal, setAddHolidayModal] = useState(false);
  const [newHolidayTitle, setNewHolidayTitle] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayType, setNewHolidayType] = useState('National Holiday');

  // Email Templates State
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'job-created',
      name: 'Job Card Confirmation',
      category: 'Job Cards',
      subject: 'Job Card #{JOB_ID} Created - {WORKSHOP_NAME}',
      body: 'Dear {CUSTOMER_NAME},\n\nYour vehicle ({VEHICLE_MODEL} - {REGISTRATION_NO}) has been received at {WORKSHOP_NAME}. Job Card #{JOB_ID} has been successfully created.\n\nEstimated Cost: {TOTAL_AMOUNT}\nAssigned Mechanic: {MECHANIC_NAME}\n\nWe will keep you updated on the progress of your vehicle service.\n\nBest regards,\n{WORKSHOP_NAME}',
      isDefault: true,
    },
    {
      id: 'service-completed',
      name: 'Service Completed & Invoice Ready',
      category: 'Billing & Receipts',
      subject: 'Service Completed for {REGISTRATION_NO} - Invoice #{JOB_ID}',
      body: 'Dear {CUSTOMER_NAME},\n\nGreat news! The service for your {VEHICLE_MODEL} ({REGISTRATION_NO}) is now complete and ready for pickup at {WORKSHOP_NAME}.\n\nTotal Amount Payable: {TOTAL_AMOUNT}\nInvoice Reference: {JOB_ID}\n\nPlease visit our workshop to inspect and collect your vehicle.\n\nThank you for choosing {WORKSHOP_NAME}!',
      isDefault: true,
    },
    {
      id: 'payment-receipt',
      name: 'Payment Receipt Confirmation',
      category: 'Billing & Receipts',
      subject: 'Payment Receipt for Job Card #{JOB_ID} - {WORKSHOP_NAME}',
      body: 'Dear {CUSTOMER_NAME},\n\nThank you for your payment of {TOTAL_AMOUNT} for Job Card #{JOB_ID}.\n\nVehicle: {VEHICLE_MODEL} ({REGISTRATION_NO})\nPayment Status: PAID IN FULL\n\nA copy of your tax invoice and warranty sheet has been attached.\n\nWarm regards,\n{WORKSHOP_NAME}',
      isDefault: true,
    },
    {
      id: 'service-reminder',
      name: 'Service Due Reminder',
      category: 'Reminders',
      subject: 'Service Due Reminder for Your {VEHICLE_MODEL} ({REGISTRATION_NO})',
      body: 'Dear {CUSTOMER_NAME},\n\nThis is a friendly reminder from {WORKSHOP_NAME} that your {VEHICLE_MODEL} ({REGISTRATION_NO}) is due for periodic maintenance service.\n\nRegular servicing keeps your vehicle running smoothly and safely. Book an appointment today by replying to this email or calling us.\n\nBest regards,\n{WORKSHOP_NAME}',
      isDefault: true,
    },
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('job-created');
  const [addTemplateModal, setAddTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Custom');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');

  // Billing State
  const [currency, setCurrency] = useState('₹');
  const [taxRate, setTaxRate] = useState(18);
  const [laborRate, setLaborRate] = useState(750);
  const [invoicePrefix, setInvoicePrefix] = useState('GB-INV-');
  const [autoInvoice, setAutoInvoice] = useState(true);

  // Workshop Bank Account & UPI Details (for Payment QR)
  const [upiId, setUpiId] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('workshop_upi_id') || 'garagebook@upi' : 'garagebook@upi'));
  const [accountHolderName, setAccountHolderName] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('workshop_account_name') || 'GarageBook Auto Care' : 'GarageBook Auto Care'));
  const [bankName, setBankName] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('workshop_bank_name') || 'HDFC Bank' : 'HDFC Bank'));
  const [accountNumber, setAccountNumber] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('workshop_account_no') || '50200084928172' : '50200084928172'));
  const [ifscCode, setIfscCode] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('workshop_ifsc') || 'HDFC0001234' : 'HDFC0001234'));

  // Notifications State
  const [smsNotification, setSmsNotification] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);

  // Other Settings State
  const [timeZone, setTimeZone] = useState('(GMT+05:30) India Standard Time (IST)');
  const [language, setLanguage] = useState('English (US)');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY (e.g., 30/07/2026)');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app_theme') as any) || 'light';
    }
    return 'light';
  });

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme', mode);
      applyTheme(mode);
    }
  };

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleSaveTab = async (tabName: string) => {
    if (tabName === 'profile') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstin && !gstRegex.test(gstin)) {
        toast.error('Invalid GST Number format. Please enter a valid Indian GSTIN.');
        return;
      }
    }

    if (tabName === 'billing' && typeof window !== 'undefined') {
      localStorage.setItem('workshop_upi_id', upiId);
      localStorage.setItem('workshop_account_name', accountHolderName);
      localStorage.setItem('workshop_bank_name', bankName);
      localStorage.setItem('workshop_account_no', accountNumber);
      localStorage.setItem('workshop_ifsc', ifscCode);
    }
    
    const settingsToSave = {
      workshopName,
      ownerName,
      phone,
      email,
      gstin,
      country,
      stateName,
      address,
      logoImage,
      schedules,
      holidays,
      templates,
      currency,
      taxRate,
      laborRate,
      invoicePrefix,
      autoInvoice,
      smsNotification,
      emailNotification,
      lowStockAlert,
      timeZone,
      language,
      dateFormat,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass
    };

    try {
      await updateSettings(settingsToSave);
      setSavedTab(tabName);
      setTimeout(() => {
        setSavedTab(null);
      }, 3000);
    } catch (e) {
      toast.error('Failed to save settings.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image too large. Please upload an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDayOpen = (index: number) => {
    const updated = [...schedules];
    updated[index].isOpen = !updated[index].isOpen;
    setSchedules(updated);
  };

  const updateDayTime = (index: number, field: 'openTime' | 'closeTime', val: string) => {
    const updated = [...schedules];
    updated[index][field] = val;
    setSchedules(updated);
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayTitle || !newHolidayDate) return;
    const newHol: BusinessHoliday = {
      id: Date.now().toString(),
      title: newHolidayTitle,
      date: newHolidayDate,
      type: newHolidayType,
    };
    setHolidays([...holidays, newHol]);
    setNewHolidayTitle('');
    setNewHolidayDate('');
    setAddHolidayModal(false);
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(holidays.filter((h) => h.id !== id));
  };

  const updateActiveTemplate = (field: 'subject' | 'body', value: string) => {
    setTemplates(
      templates.map((t) => (t.id === selectedTemplateId ? { ...t, [field]: value } : t))
    );
  };

  const insertMergeTag = (tag: string, field: 'subject' | 'body') => {
    if (!activeTemplate) return;
    if (field === 'subject') {
      updateActiveTemplate('subject', activeTemplate.subject + ' ' + tag);
    } else {
      updateActiveTemplate('body', activeTemplate.body + ' ' + tag);
    }
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateSubject || !newTemplateBody) return;
    const newTmpl: EmailTemplate = {
      id: 'tmpl-' + Date.now(),
      name: newTemplateName,
      category: newTemplateCategory,
      subject: newTemplateSubject,
      body: newTemplateBody,
      isDefault: false,
    };
    setTemplates([...templates, newTmpl]);
    setSelectedTemplateId(newTmpl.id);
    setNewTemplateName('');
    setNewTemplateSubject('');
    setNewTemplateBody('');
    setAddTemplateModal(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const remaining = templates.filter((t) => t.id !== id);
    setTemplates(remaining);
    if (remaining.length > 0) {
      setSelectedTemplateId(remaining[0].id);
    }
  };

  // Helper to render live preview text with replaced merge tags
  const renderPreviewText = (text: string) => {
    let result = text || '';
    MERGE_TAGS.forEach((item) => {
      result = result.replaceAll(item.tag, item.sample);
    });
    return result;
  };

  return (
    <div style={{ display: 'flex', background: 'var(--bg-canvas)', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />

      <main className="main-content">
        {/* Top Header Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#18181b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bg-card)',
              }}
            >
              <Settings size={20} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Workshop Settings
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 46px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage workshop logo, operating hours, email message templates, tax rates, timezone, and system preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          {[
            { id: 'profile', label: 'Workshop Profile & Logo', icon: Store },
            { id: 'hours', label: 'Business Hours & Holidays', icon: CalendarDays },
            { id: 'templates', label: 'Email Templates', icon: Mail },
            { id: 'billing', label: 'Billing & Taxes', icon: Receipt },
            { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
            { id: 'theme', label: 'Theme & Appearance', icon: Sun },
            { id: 'other', label: 'Other Settings', icon: Sliders },
            { id: 'team', label: 'System & Security', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  border: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? 'var(--text-main)' : 'var(--text-muted)'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Workshop Profile */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              
              {/* Tab Success Banner */}
              {savedTab === 'profile' && (
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={18} color="var(--success)" />
                  Workshop profile information, logo, and address details saved successfully!
                </div>
              )}

              {/* Workshop Logo Upload Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '24px',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '14px',
                      background: '#18181b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '2px solid #cbd5e1',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    }}
                  >
                    {logoImage ? (
                      <img src={logoImage} alt="Workshop Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--bg-card)' }}>
                        <UploadCloud size={24} color="#94a3b8" />
                        <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', fontWeight: '600' }}>NO LOGO</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px', color: 'var(--text-main)' }}>
                    Workshop Logo & Brand Image
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                    Upload your official garage logo to display on job cards, invoices, and billing receipts.
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#18181b',
                        color: 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <ImagePlus size={14} /> {logoImage ? 'Change Logo' : 'Upload Logo Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {logoImage && (
                      <button
                        type="button"
                        onClick={() => setLogoImage(null)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '7px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: '#fef2f2',
                          color: 'var(--danger)',
                          border: '1px solid #fca5a5',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 18px', color: 'var(--text-main)' }}>
                General Information
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Workshop Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Store size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      value={workshopName}
                      onChange={(e) => setWorkshopName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Owner / Manager Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Contact Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Smartphone size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Official Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Country & State Selection Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Country / Region
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <select
                      value={country}
                      onChange={(e) => {
                        const selectedCty = e.target.value;
                        setCountry(selectedCty);
                        const availableStates = STATES_BY_COUNTRY[selectedCty] || [];
                        setStateName(availableStates[0] || '');
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        background: 'var(--bg-card)',
                        boxSizing: 'border-box',
                      }}
                    >
                      {Object.keys(STATES_BY_COUNTRY).map((cty) => (
                        <option key={cty} value={cty}>
                          {cty}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    State / Province
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        background: 'var(--bg-card)',
                        boxSizing: 'border-box',
                      }}
                    >
                      {(STATES_BY_COUNTRY[country] || []).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  GSTIN / Tax Identification No.
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Workshop Full Address (Appears on Invoices)
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Dedicated Particular Save Button for Workshop Profile */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--bg-canvas)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleSaveTab('profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {savedTab === 'profile' ? <CheckCircle2 size={16} color="#4ade80" /> : <Save size={16} />}
                  {savedTab === 'profile' ? 'Profile Saved!' : 'Save Workshop Profile'}
                </button>
              </div>
            </div>

            {/* Quick Status Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 12px', color: 'var(--text-main)' }}>
                  Account & Location Summary
                </h4>
                <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Country:</span>
                    <strong>{country}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>State / Province:</span>
                    <strong>{stateName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subscription Plan:</span>
                    <strong style={{ color: 'var(--success)' }}>Pro Workshop SaaS</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Bays:</span>
                    <strong>5 Service Bays</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Mechanics:</span>
                    <strong>4 Mechanics</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cloud Backup:</span>
                    <span style={{ color: '#2563eb', fontWeight: '600' }}>Enabled (Real-time)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Business Hours & Holidays */}
        {activeTab === 'hours' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              
              {/* Tab Success Banner */}
              {savedTab === 'hours' && (
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={18} color="var(--success)" />
                  Weekly business hours schedule and holiday calendar updated successfully!
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    Weekly Operating Hours Schedule
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Configure workshop opening and closing times for each day of the week
                  </p>
                </div>
              </div>

              {/* Weekly Schedule Table Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {schedules.map((sch, idx) => (
                  <div
                    key={sch.day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: sch.isOpen ? 'var(--bg-canvas)' : 'var(--bg-canvas)',
                      border: sch.isOpen ? '1px solid var(--border-color)' : '1px solid #cbd5e1',
                    }}
                  >
                    {/* Day Name & Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '180px' }}>
                      <button
                        type="button"
                        onClick={() => toggleDayOpen(idx)}
                        style={{
                          width: '40px',
                          height: '22px',
                          borderRadius: '11px',
                          background: sch.isOpen ? 'var(--success)' : '#cbd5e1',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          padding: 0,
                        }}
                      >
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--bg-card)',
                            position: 'absolute',
                            top: '2px',
                            left: sch.isOpen ? '20px' : '2px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        />
                      </button>

                      <strong style={{ fontSize: '13.5px', color: sch.isOpen ? 'var(--text-main)' : '#94a3b8' }}>
                        {sch.day}
                      </strong>
                    </div>

                    {/* Status Badge */}
                    <div style={{ width: '90px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: sch.isOpen ? '#dcfce7' : '#fee2e2',
                          color: sch.isOpen ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {sch.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>

                    {/* Time Selectors */}
                    {sch.isOpen ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Opens:</span>
                          <select
                            value={sch.openTime}
                            onChange={(e) => updateDayTime(idx, 'openTime', e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12.5px',
                              color: 'var(--text-main)',
                              background: 'var(--bg-card)',
                            }}
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>to</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Closes:</span>
                          <select
                            value={sch.closeTime}
                            onChange={(e) => updateDayTime(idx, 'closeTime', e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12.5px',
                              color: 'var(--text-main)',
                              background: 'var(--bg-card)',
                            }}
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                        Workshop closed all day
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Business Holidays Management Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                      Business Holidays & Closure Dates
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                      Add planned holidays and festival closures when the workshop is non-operational
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddHolidayModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      background: '#18181b',
                      color: 'var(--bg-card)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} /> Add Business Holiday
                  </button>
                </div>

                {/* Holiday Cards Grid */}
                {holidays.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: 'var(--bg-canvas)', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    No business holidays configured yet. Click "Add Business Holiday" above to add one.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    {holidays.map((hol) => (
                      <div
                        key={hol.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '700' }}>
                            {hol.title}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(hol.id)}
                            title="Remove Holiday"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          <span>{hol.date}</span>
                        </div>

                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '600',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--bg-canvas)',
                            color: '#475569',
                            alignSelf: 'flex-start',
                            marginTop: '2px',
                          }}
                        >
                          {hol.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dedicated Particular Save Button for Business Hours & Holidays */}
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--bg-canvas)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleSaveTab('hours')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {savedTab === 'hours' ? <CheckCircle2 size={16} color="#4ade80" /> : <Save size={16} />}
                  {savedTab === 'hours' ? 'Business Hours Saved!' : 'Save Business Hours & Holidays'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Email Templates */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Tab Success Banner */}
            {savedTab === 'templates' && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} color="var(--success)" />
                Email message templates and automated notification subjects saved successfully!
              </div>
            )}

            {/* SMTP Configuration */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="var(--primary)" /> SMTP & Email Delivery Settings
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 20px' }}>
                Configure your outgoing mail server to send automated emails to customers directly from your domain.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>SMTP Host</label>
                  <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="e.g. smtp.mailgun.org" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>SMTP Port</label>
                  <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="e.g. 587 or 465" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>SMTP Username / Email</label>
                  <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="e.g. postmaster@yourdomain.com" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>SMTP Password / App Password</label>
                  <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button type="button" onClick={() => handleSaveTab('templates')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                  {savedTab === 'templates' ? <CheckCircle2 size={16} /> : <Save size={16} />} Save SMTP Settings
                </button>
              </div>
            </div>

            {/* Template Selection & Action Bar */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Select Email Template:
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-main)',
                    background: 'var(--bg-canvas)',
                    minWidth: '260px',
                  }}
                >
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} ({tmpl.category})
                    </option>
                  ))}
                </select>

                {!activeTemplate?.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(activeTemplate.id)}
                    title="Delete Custom Template"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: '#fef2f2',
                      color: 'var(--danger)',
                      border: '1px solid #fca5a5',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} /> Delete Template
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAddTemplateModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  background: '#18181b',
                  color: 'var(--bg-card)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} /> Create New Email Template
              </button>
            </div>

            {/* Template Editor & Live Preview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Template Editor Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    Edit Template: {activeTemplate.name}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: 'var(--border-color)', color: '#475569' }}>
                    {activeTemplate.category}
                  </span>
                </div>

                {/* Email Subject Field */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={activeTemplate.subject}
                    onChange={(e) => updateActiveTemplate('subject', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-main)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Dynamic Merge Tags Chips Bar */}
                <div style={{ marginBottom: '16px', background: 'var(--bg-canvas)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Tag size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                      Click to insert dynamic placeholder variables:
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {MERGE_TAGS.map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => insertMergeTag(item.tag, 'body')}
                        title={`Insert ${item.label}`}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: 'var(--bg-card)',
                          color: '#18181b',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        + {item.tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Body Field */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Email Body Content Message
                  </label>
                  <textarea
                    rows={12}
                    value={activeTemplate.body}
                    onChange={(e) => updateActiveTemplate('body', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Save Email Templates Button */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--bg-canvas)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleSaveTab('templates')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      background: '#18181b',
                      color: 'var(--bg-card)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {savedTab === 'templates' ? <CheckCircle2 size={16} color="#4ade80" /> : <Save size={16} />}
                    {savedTab === 'templates' ? 'Template Saved!' : 'Save Email Template'}
                  </button>
                </div>
              </div>

              {/* Live Email Preview Box */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--bg-canvas)', paddingBottom: '12px' }}>
                  <Eye size={18} color="#2563eb" />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    Live Customer Email Preview
                  </h4>
                </div>

                {/* Email Client Mock Window */}
                <div
                  style={{
                    background: 'var(--bg-canvas)',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Email Header Bar */}
                  <div style={{ background: '#18181b', color: 'var(--bg-card)', padding: '12px 16px' }}>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                      From: {workshopName} &lt;{email}&gt;
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--bg-card)', fontWeight: '600', marginTop: '2px' }}>
                      To: Rajesh Kumar &lt;rajesh.kumar@example.com&gt;
                    </div>
                  </div>

                  {/* Email Subject Line */}
                  <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>SUBJECT:</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block', marginTop: '2px' }}>
                      {renderPreviewText(activeTemplate.subject)}
                    </strong>
                  </div>

                  {/* Email Body Content */}
                  <div style={{ padding: '20px 16px', background: 'var(--bg-card)', flex: 1, fontSize: '13px', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {renderPreviewText(activeTemplate.body)}
                  </div>

                  {/* Email Footer */}
                  <div style={{ padding: '12px 16px', background: 'var(--bg-canvas)', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Sent automatically via GarageBook Workshop SaaS Platform
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Billing & Taxes */}
        {activeTab === 'billing' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '720px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            
            {/* Tab Success Banner */}
            {savedTab === 'billing' && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} color="var(--success)" />
                Tax rates, currency settings, labor rates, and invoice prefixes saved successfully!
              </div>
            )}

            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 18px', color: 'var(--text-main)' }}>
              Tax & Invoicing Setup
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD - US Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="CAD">CAD (Canadian Dollar)</option>
                  <option value="AUD">AUD (Australian Dollar)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Default Tax / GST Rate (%)
                </label>
                <div style={{ position: 'relative' }}>
                  <Percent size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Default Hourly Labor Rate ({currency})
                </label>
                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>

            {/* Workshop Account & UPI Details for Payment QR */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    Workshop Bank Account &amp; UPI Details (Payment QR Setup)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    Configure your official UPI VPA handle and bank details so live payment QR codes scan &amp; work seamlessly.
                  </p>
                </div>
                <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                  ⚡ Live Working UPI QR
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Workshop UPI ID / VPA Handle *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9823011223@ybl or garagebook@icici"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      fontWeight: '700',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Account Holder / Payee Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GarageBook Auto Care Services"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      fontWeight: '700',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50200084928172"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--bg-canvas)', paddingTop: '16px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoInvoice}
                  onChange={(e) => setAutoInvoice(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#18181b' }}
                />
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>
                    Auto-Generate Invoice on Job Completion
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Automatically create pending invoice when job card is marked as COMPLETED
                  </span>
                </div>
              </label>
            </div>

            {/* Dedicated Particular Save Button for Billing & Taxes */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--bg-canvas)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleSaveTab('billing')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#18181b',
                  color: 'var(--bg-card)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {savedTab === 'billing' ? <CheckCircle2 size={16} color="#4ade80" /> : <Save size={16} />}
                {savedTab === 'billing' ? 'Billing Saved!' : 'Save Billing & Tax Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Notifications */}
        {activeTab === 'notifications' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '720px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            
            {/* Tab Success Banner */}
            {savedTab === 'notifications' && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} color="var(--success)" />
                Notification preferences and alert rules saved successfully!
              </div>
            )}

            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 18px', color: 'var(--text-main)' }}>
              Notification & Alert Channels
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={smsNotification}
                  onChange={(e) => setSmsNotification(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#18181b' }}
                />
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>Customer SMS Updates</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Send automated SMS alerts to vehicle owners when job card moves to IN_PROGRESS or COMPLETED
                  </span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailNotification}
                  onChange={(e) => setEmailNotification(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#18181b' }}
                />
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>Email Invoices & Receipts</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Instantly email PDF billing receipts to customers upon payment confirmation
                  </span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={lowStockAlert}
                  onChange={(e) => setLowStockAlert(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#18181b' }}
                />
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>Low Stock Inventory Alerts</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Notify workshop admin when part quantities drop below re-order thresholds
                  </span>
                </div>
              </label>
            </div>

            {/* Dedicated Particular Save Button for Notifications */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--bg-canvas)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleSaveTab('notifications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#18181b',
                  color: 'var(--bg-card)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {savedTab === 'notifications' ? <CheckCircle2 size={16} color="#4ade80" /> : <Save size={16} />}
                {savedTab === 'notifications' ? 'Preferences Saved!' : 'Save Notification Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: Other Settings (Localization & System Standards) */}
        {activeTab === 'other' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '720px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            
            {/* Tab Success Banner */}
            {savedTab === 'other' && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} color="var(--success)" />
                Timezone, language, date formatting, and operating currency saved successfully!
              </div>
            )}

            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px', color: 'var(--text-main)' }}>
              Other Settings & Regional Localization
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 20px' }}>
              Configure your system time zone, system language, date formatting, and primary operating currency.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
              {/* Select Time Zone Drop Down */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Select Time Zone
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      background: 'var(--bg-card)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="(GMT+05:30) India Standard Time (IST)">(GMT+05:30) India Standard Time (IST - Kolkata, New Delhi)</option>
                    <option value="(GMT+00:00) UTC / GMT">(GMT+00:00) UTC / GMT (London, Dublin, Lisbon)</option>
                    <option value="(GMT-05:00) Eastern Standard Time (EST)">(GMT-05:00) Eastern Standard Time (EST - New York, Miami)</option>
                    <option value="(GMT-08:00) Pacific Standard Time (PST)">(GMT-08:00) Pacific Standard Time (PST - Los Angeles, Seattle)</option>
                    <option value="(GMT+04:00) Gulf Standard Time (GST)">(GMT+04:00) Gulf Standard Time (GST - Dubai, Abu Dhabi)</option>
                    <option value="(GMT+01:00) Central European Time (CET)">(GMT+01:00) Central European Time (CET - Paris, Berlin, Rome)</option>
                    <option value="(GMT+08:00) Singapore Standard Time (SST)">(GMT+08:00) Singapore Standard Time (SST - Singapore)</option>
                    <option value="(GMT+10:00) Australian Eastern Time (AEST)">(GMT+10:00) Australian Eastern Standard Time (AEST - Sydney)</option>
                  </select>
                </div>
              </div>

              {/* Language Drop Down */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  System Language
                </label>
                <div style={{ position: 'relative' }}>
                  <Languages size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      background: 'var(--bg-card)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="English (US)">English (US) - Default</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                    <option value="Spanish (Español)">Spanish (Español)</option>
                    <option value="French (Français)">French (Français)</option>
                    <option value="German (Deutsch)">German (Deutsch)</option>
                    <option value="Arabic (العربية)">Arabic (العربية)</option>
                    <option value="Japanese (日本語)">Japanese (日本語)</option>
                  </select>
                </div>
              </div>

              {/* Date Format Drop Down */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Date Format
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      background: 'var(--bg-card)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="DD/MM/YYYY (e.g., 30/07/2026)">DD/MM/YYYY (e.g., 30/07/2026)</option>
                    <option value="MM/DD/YYYY (e.g., 07/30/2026)">MM/DD/YYYY (e.g., 07/30/2026)</option>
                    <option value="YYYY-MM-DD (e.g., 2026-07-30)">YYYY-MM-DD (e.g., 2026-07-30)</option>
                    <option value="DD MMM YYYY (e.g., 30 Jul 2026)">DD MMM YYYY (e.g., 30 Jul 2026)</option>
                    <option value="MMM DD, YYYY (e.g., Jul 30, 2026)">MMM DD, YYYY (e.g., Jul 30, 2026)</option>
                  </select>
                </div>
              </div>

              {/* Select Currency Drop Down */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Select Operating Currency
                </label>
                <div style={{ position: 'relative' }}>
                  <Coins size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      background: 'var(--bg-card)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="₹">₹ - INR (Indian Rupee)</option>
                    <option value="$">$ - USD (US Dollar)</option>
                    <option value="€">€ - EUR (Euro)</option>
                    <option value="£">£ - GBP (British Pound)</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                  </select>
                </div>
              </div>

              {/* Appearance & Dark Mode Settings */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  Appearance &amp; System Theme
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                  Choose your preferred visual theme for GarageBook Pro interface.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  {/* Light Mode Card */}
                  <div
                    onClick={() => handleThemeChange('light')}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: themeMode === 'light' ? '2px solid var(--accent)' : '1px solid #d4d4d0',
                      background: themeMode === 'light' ? '#e8f8f2' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--warning)', display: 'flex' }}>
                      <Sun size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Light Theme</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Default bright SaaS canvas</div>
                    </div>
                    {themeMode === 'light' && (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7e3cc', marginTop: '4px' }}>
                        ✓ Active Mode
                      </span>
                    )}
                  </div>

                  {/* Dark Mode Card */}
                  <div
                    onClick={() => handleThemeChange('dark')}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: themeMode === 'dark' ? '2px solid var(--bg-card)' : '1px solid #cbd5e1',
                      background: themeMode === 'dark' ? 'var(--text-main)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ padding: '10px', borderRadius: '10px', background: '#000000', border: '1px solid #27272a', color: 'var(--bg-card)', display: 'flex' }}>
                      <Moon size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: themeMode === 'dark' ? 'var(--bg-card)' : 'var(--text-main)' }}>Dark Theme</div>
                      <div style={{ fontSize: '11px', color: themeMode === 'dark' ? '#a1a1aa' : 'var(--text-muted)', marginTop: '2px' }}>Pure pitch black dark mode</div>
                    </div>
                    {themeMode === 'dark' && (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--bg-card)', background: '#18181b', padding: '2px 8px', borderRadius: '12px', border: '1px solid #3f3f46', marginTop: '4px' }}>
                        ✓ Active Mode
                      </span>
                    )}
                  </div>

                  {/* System Mode Card */}
                  <div
                    onClick={() => handleThemeChange('system')}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: themeMode === 'system' ? '2px solid var(--accent)' : '1px solid #d4d4d0',
                      background: themeMode === 'system' ? '#e8f8f2' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ padding: '10px', borderRadius: '10px', background: '#f0f0ef', border: '1px solid var(--border-color)', color: 'var(--accent)', display: 'flex' }}>
                      <Monitor size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>System Default</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Sync with OS preferences</div>
                    </div>
                    {themeMode === 'system' && (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7e3cc', marginTop: '4px' }}>
                        ✓ Active Mode
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 10px', color: 'var(--text-main)' }}>
                    Custom Saved Theme Presets
                  </h4>
                  <EmptyState
                    icon={Sun}
                    title="No Custom Color Presets Saved"
                    description="GarageBook Pro is currently operating on the default system color palette. Custom brand theme presets will appear here once configured."
                  />
                </div>
              </div>
            </div>

            {/* Dedicated Particular Save Button for Other Settings */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--bg-canvas)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleSaveTab('other')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#18181b',
                  color: 'var(--bg-card)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {savedTab === 'other' ? <CheckCircle2 size={16} color="#4ade80" /> : <Save size={16} />}
                {savedTab === 'other' ? 'Settings Saved!' : 'Save Localization Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Tab for Theme & Appearance */}
        {activeTab === 'theme' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '720px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 18px', color: 'var(--text-main)' }}>
              Appearance &amp; Visual Theme
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
              {/* Light Mode Card */}
              <div
                onClick={() => handleThemeChange('light')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: themeMode === 'light' ? '2px solid var(--accent)' : '1px solid #d4d4d0',
                  background: themeMode === 'light' ? '#e8f8f2' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--warning)', display: 'inline-flex', marginBottom: '8px' }}>
                  <Sun size={22} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Light Theme</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Default bright SaaS canvas</div>
                {themeMode === 'light' && (
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7e3cc', marginTop: '6px', display: 'inline-block' }}>
                    ✓ Active Mode
                  </span>
                )}
              </div>

              {/* Dark Mode Card */}
              <div
                onClick={() => handleThemeChange('dark')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: themeMode === 'dark' ? '2px solid var(--bg-card)' : '1px solid #cbd5e1',
                  background: themeMode === 'dark' ? 'var(--text-main)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: '10px', borderRadius: '10px', background: '#000000', border: '1px solid #27272a', color: 'var(--bg-card)', display: 'inline-flex', marginBottom: '8px' }}>
                  <Moon size={22} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: themeMode === 'dark' ? 'var(--bg-card)' : 'var(--text-main)' }}>Dark Theme</div>
                <div style={{ fontSize: '11px', color: themeMode === 'dark' ? '#a1a1aa' : 'var(--text-muted)', marginTop: '2px' }}>Pure pitch black dark mode</div>
                {themeMode === 'dark' && (
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--bg-card)', background: '#18181b', padding: '2px 8px', borderRadius: '12px', border: '1px solid #3f3f46', marginTop: '6px', display: 'inline-block' }}>
                    ✓ Active Mode
                  </span>
                )}
              </div>

              {/* System Mode Card */}
              <div
                onClick={() => handleThemeChange('system')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: themeMode === 'system' ? '2px solid var(--accent)' : '1px solid #d4d4d0',
                  background: themeMode === 'system' ? '#e8f8f2' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: '10px', borderRadius: '10px', background: '#f0f0ef', border: '1px solid var(--border-color)', color: 'var(--accent)', display: 'inline-flex', marginBottom: '8px' }}>
                  <Monitor size={22} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>System Default</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Sync with OS preferences</div>
                {themeMode === 'system' && (
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7e3cc', marginTop: '6px', display: 'inline-block' }}>
                    ✓ Active Mode
                  </span>
                )}
              </div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 10px', color: 'var(--text-main)' }}>
                Saved Theme Presets
              </h4>
              <EmptyState
                icon={Sun}
                title="No Custom Color Presets Saved"
                description="GarageBook Pro is currently operating on the default system color palette. Custom brand theme presets will appear here once configured."
              />
            </div>
          </div>
        )}

        {/* Tab 7: System & Security */}
        {activeTab === 'team' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '720px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            
            {/* Tab Success Banner */}
            {savedTab === 'team' && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} color="var(--success)" />
                Security preferences and database settings updated!
              </div>
            )}

            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 18px', color: 'var(--text-main)' }}>
              Data Management & Backup
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>Database Export</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Download complete backup of customers, jobs, and inventory records</span>
                </div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} /> Export Backup (JSON)
                </button>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>PostgreSQL Sync Status</strong>
                  <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>Connected to local database</span>
                </div>
                <Database size={20} color="var(--success)" />
              </div>
            </div>

            {/* Dedicated Particular Save Button for System & Security */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--bg-canvas)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleSaveTab('team')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: '#18181b',
                  color: 'var(--bg-card)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {savedTab === 'team' ? <CheckCircle2 size={16} color="#4ade80" /> : <Save size={16} />}
                {savedTab === 'team' ? 'Security Config Saved!' : 'Save Security Settings'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal for Adding New Business Holiday */}
      {addHolidayModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '24px',
              width: '420px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                Add Business Holiday
              </h3>
              <button
                type="button"
                onClick={() => setAddHolidayModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Holiday Name / Event Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day, Diwali Break"
                  value={newHolidayTitle}
                  onChange={(e) => setNewHolidayTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Holiday Date
                </label>
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Category / Holiday Type
                </label>
                <select
                  value={newHolidayType}
                  onChange={(e) => setNewHolidayType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                >
                  <option value="National Holiday">National Holiday</option>
                  <option value="Festive Holiday">Festive Holiday</option>
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Workshop Maintenance">Workshop Maintenance / Inventory Shutdown</option>
                  <option value="Custom Closure">Custom Workshop Closure</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAddHolidayModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
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
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Creating New Custom Email Template */}
      {addTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '24px',
              width: '520px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                Create New Email Template
              </h3>
              <button
                type="button"
                onClick={() => setAddTemplateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Template Name / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Appointment Follow-up, Special Promotion"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                >
                  <option value="Job Cards">Job Cards</option>
                  <option value="Billing & Receipts">Billing & Receipts</option>
                  <option value="Reminders">Reminders</option>
                  <option value="Marketing & Offers">Marketing & Offers</option>
                  <option value="Custom">Custom Notification</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Email Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. Update regarding your vehicle {REGISTRATION_NO}"
                  value={newTemplateSubject}
                  onChange={(e) => setNewTemplateSubject(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Email Message Body
                </label>
                <textarea
                  rows={6}
                  placeholder="Dear {CUSTOMER_NAME},&#10;&#10;Write your message content here..."
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAddTemplateModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
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
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    background: '#18181b',
                    color: 'var(--bg-card)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
