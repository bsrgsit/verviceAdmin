'use client';

import { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  Save,
  ShieldAlert,
  Smartphone,
  CreditCard,
  Car,
  BatteryCharging,
  Sparkles,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AppConfigPage() {
  const [config, setConfig] = useState<any>({
    enable_battery_service: true,
    enable_driver_service: true,
    enable_insurance_service: false,
    enable_todays_clean_status_card: true,
    enable_upi_payments: true,
    enable_qr_code_display: true,
    maintenance_mode: false,
    min_android_version: '1.0.0',
    min_ios_version: '1.0.0',
    support_phone: '+91 98765 43210',
    support_whatsapp: '+91 98765 43210',
    support_email: 'support@vervice.com',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/app-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setConfig(data.config);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: string) => {
    setConfig((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            App Feature Flags & Remote Config
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time toggles syncing instantly to Android, iOS, and Partner apps via Firestore
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Saved to Firestore!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish Flags</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Core Services Toggles */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-600" /> Consumer Services & Features
          </h3>

          <div className="space-y-3 divide-y divide-slate-100">
            {/* Battery Service */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Battery Jumpstart Service</p>
                <p className="text-[11px] text-slate-400">Allows residents to request emergency jumpstarts</p>
              </div>
              <button
                onClick={() => handleToggle('enable_battery_service')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.enable_battery_service ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Driver Hire */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Driver Hire Service</p>
                <p className="text-[11px] text-slate-400">Enables on-demand driver booking requests</p>
              </div>
              <button
                onClick={() => handleToggle('enable_driver_service')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.enable_driver_service ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Insurance Support */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Insurance & Claims Support</p>
                <p className="text-[11px] text-slate-400">Show Insurance concierge button in app</p>
              </div>
              <button
                onClick={() => handleToggle('enable_insurance_service')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.enable_insurance_service ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Today's Clean Status Card */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Today's Clean Status Card</p>
                <p className="text-[11px] text-slate-400">Show/hide live cleaning status widget below home banner</p>
              </div>
              <button
                onClick={() => handleToggle('enable_todays_clean_status_card')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.enable_todays_clean_status_card ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Payment & Checkout Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" /> Payments & UPI Flow
          </h3>

          <div className="space-y-3 divide-y divide-slate-100">
            {/* UPI Payments */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">UPI App Intent Payments</p>
                <p className="text-[11px] text-slate-400">Enable GPay, PhonePe, Paytm intent links</p>
              </div>
              <button
                onClick={() => handleToggle('enable_upi_payments')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.enable_upi_payments ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Manual QR Code Fallback</p>
                <p className="text-[11px] text-slate-400">Display dynamic QR code with UTR submission</p>
              </div>
              <button
                onClick={() => handleToggle('enable_qr_code_display')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.enable_qr_code_display ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Maintenance Mode
                </p>
                <p className="text-[11px] text-slate-400">Temporarily pause customer bookings during maintenance</p>
              </div>
              <button
                onClick={() => handleToggle('maintenance_mode')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.maintenance_mode ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Minimum App Versions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" /> Minimum Supported Versions
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Min Android Version (Force Update)</label>
              <input
                type="text"
                value={config.min_android_version}
                onChange={(e) => handleChange('min_android_version', e.target.value)}
                placeholder="1.0.0"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Min iOS Version (Force Update)</label>
              <input
                type="text"
                value={config.min_ios_version}
                onChange={(e) => handleChange('min_ios_version', e.target.value)}
                placeholder="1.0.0"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 4. Support Helpline Details */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" /> Support Contact Numbers
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Helpline Phone</label>
              <input
                type="text"
                value={config.support_phone}
                onChange={(e) => handleChange('support_phone', e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Support</label>
              <input
                type="text"
                value={config.support_whatsapp}
                onChange={(e) => handleChange('support_whatsapp', e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Support Email</label>
              <input
                type="text"
                value={config.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
