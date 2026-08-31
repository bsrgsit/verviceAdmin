'use client';

import { useState, useEffect } from 'react';
import {
  Layout,
  Save,
  CheckCircle2,
  Building2,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';

export default function ScreenConfigPage() {
  const { selectedCommunity, selectedCommunityObj, communities } = useCommunity();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-600" />
            Dynamic Screen & Content Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic text, banners, and locked community barriers displayed on mobile screens
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
        >
          {saving ? (
            <span>Saving...</span>
          ) : savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Published!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Locked Community Barrier Message */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" /> Locked Community Notice
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Displayed on Profile and Add Vehicle screens when a resident belongs to an unlaunched community.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Notice Heading</label>
              <input
                type="text"
                value={config.lockedCommunityTitle}
                onChange={(e) => setConfig({ ...config, lockedCommunityTitle: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Notice Message Text</label>
              <textarea
                rows={3}
                value={config.lockedCommunitySubtitle}
                onChange={(e) => setConfig({ ...config, lockedCommunitySubtitle: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 2. Guest User Notice */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-500" /> Guest User Guidance
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Displayed when an unauthenticated guest user accesses account or bookings pages.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Guest Signup CTA Message</label>
              <textarea
                rows={3}
                value={config.guestNoticeText}
                onChange={(e) => setConfig({ ...config, guestNoticeText: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showAddVehicleGate}
                  onChange={(e) => setConfig({ ...config, showAddVehicleGate: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Block Add Vehicle for Unlaunched Communities</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
