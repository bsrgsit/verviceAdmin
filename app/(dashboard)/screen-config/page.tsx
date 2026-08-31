'use client';

import { useState } from 'react';
import {
  Layout,
  Save,
  CheckCircle2,
  Lock,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function ScreenConfigPage() {
  const [config, setConfig] = useState<any>({
    lockedCommunityTitle: 'Services Launching Soon!',
    lockedCommunitySubtitle: 'Doorstep scratch-free cleaning is getting ready for your community. We will notify you once we launch!',
    cleanStatusCardTitle: "Today's Clean Status",
    guestNoticeText: 'Sign up with your flat number to book daily cleaning and emergency car services.',
    showAddVehicleGate: true,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screen_config: config }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success">Dynamic Screen Content</Badge>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-600" />
              Dynamic Screen & Barrier Messaging
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure dynamic text, banners, and locked community barriers displayed on mobile screens
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
                <span>Published!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configurations</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Locked Community Barrier Message */}
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" /> Locked Community Notice
            </CardTitle>
            <CardDescription>
              Displayed on Profile and Add Vehicle screens when a resident belongs to an unlaunched community.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Notice Heading</label>
              <Input
                type="text"
                value={config.lockedCommunityTitle}
                onChange={(e) => setConfig({ ...config, lockedCommunityTitle: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Notice Message Text</label>
              <Textarea
                rows={3}
                value={config.lockedCommunitySubtitle}
                onChange={(e) => setConfig({ ...config, lockedCommunitySubtitle: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Guest User Notice */}
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" /> Guest User Guidance
            </CardTitle>
            <CardDescription>
              Displayed when an unauthenticated guest user accesses account or bookings pages.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Guest Signup CTA Message</label>
              <Textarea
                rows={3}
                value={config.guestNoticeText}
                onChange={(e) => setConfig({ ...config, guestNoticeText: e.target.value })}
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Block Add Vehicle</p>
                <p className="text-[11px] text-slate-500">Block unlaunched community users from adding vehicles</p>
              </div>
              <Switch
                checked={config.showAddVehicleGate}
                onCheckedChange={(checked) => setConfig({ ...config, showAddVehicleGate: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
