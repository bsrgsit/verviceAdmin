'use client';

import { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  Save,
  Smartphone,
  CreditCard,
  Car,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Save Bar */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success">Remote Config Active</Badge>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              App Feature Flags & Remote Config
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time Firestore switches controlling Android, iOS, and Partner apps dynamically
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            variant={savedSuccess ? "emeraldSoft" : "default"}
            size="default"
            className="gap-2 shrink-0"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Saved & Published!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Publish Flags</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Core Services Toggles */}
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" /> Consumer Services & Features
            </CardTitle>
            <CardDescription>
              Toggle which car care services are visible on the mobile home screen
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4 divide-y divide-slate-100">
            {/* Battery Service */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Battery Jumpstart Service</p>
                <p className="text-[11px] text-slate-500">Emergency jumpstart booking button</p>
              </div>
              <Switch
                checked={config.enable_battery_service}
                onCheckedChange={() => handleToggle('enable_battery_service')}
              />
            </div>

            {/* Driver Hire */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Driver Hire Service</p>
                <p className="text-[11px] text-slate-500">On-demand verified driver requests</p>
              </div>
              <Switch
                checked={config.enable_driver_service}
                onCheckedChange={() => handleToggle('enable_driver_service')}
              />
            </div>

            {/* Insurance Support */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Insurance & Claims Support</p>
                <p className="text-[11px] text-slate-500">Show Insurance concierge button in app</p>
              </div>
              <Switch
                checked={config.enable_insurance_service}
                onCheckedChange={() => handleToggle('enable_insurance_service')}
              />
            </div>

            {/* Today's Clean Status Card */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Today's Clean Status Card</p>
                <p className="text-[11px] text-slate-500">Show/hide live cleaning status widget below home banner</p>
              </div>
              <Switch
                checked={config.enable_todays_clean_status_card}
                onCheckedChange={() => handleToggle('enable_todays_clean_status_card')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Payment & Checkout Settings */}
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Payments & UPI Flow
            </CardTitle>
            <CardDescription>
              Configure payment methods and checkout gateways
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4 divide-y divide-slate-100">
            {/* UPI Payments */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">UPI App Intent Payments</p>
                <p className="text-[11px] text-slate-500">Enable GPay, PhonePe, Paytm intent links</p>
              </div>
              <Switch
                checked={config.enable_upi_payments}
                onCheckedChange={() => handleToggle('enable_upi_payments')}
              />
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Manual QR Code Fallback</p>
                <p className="text-[11px] text-slate-500">Display dynamic QR code with UTR submission</p>
              </div>
              <Switch
                checked={config.enable_qr_code_display}
                onCheckedChange={() => handleToggle('enable_qr_code_display')}
              />
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Maintenance Mode
                </p>
                <p className="text-[11px] text-slate-500">Temporarily pause customer bookings during maintenance</p>
              </div>
              <Switch
                checked={config.maintenance_mode}
                onCheckedChange={() => handleToggle('maintenance_mode')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Minimum App Versions */}
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" /> Minimum Supported Versions
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Min Android Version (Force Update)</label>
              <Input
                type="text"
                value={config.min_android_version}
                onChange={(e) => handleChange('min_android_version', e.target.value)}
                placeholder="1.0.0"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Min iOS Version (Force Update)</label>
              <Input
                type="text"
                value={config.min_ios_version}
                onChange={(e) => handleChange('min_ios_version', e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Support Helpline Details */}
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" /> Support Contact Numbers
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Helpline Phone</label>
              <Input
                type="text"
                value={config.support_phone}
                onChange={(e) => handleChange('support_phone', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Support</label>
              <Input
                type="text"
                value={config.support_whatsapp}
                onChange={(e) => handleChange('support_whatsapp', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Support Email</label>
              <Input
                type="text"
                value={config.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
