'use client';

import { useState } from 'react';
import {
  Smartphone,
  Sparkles,
  Car,
  BatteryCharging,
  ShieldCheck,
  CheckCircle2,
  Building2,
  ChevronRight,
  Wifi,
  Battery as BatteryIcon,
} from 'lucide-react';

interface BannerPreviewProps {
  banner: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    actionUrl?: string;
    communityId?: string;
  };
  enableCleanStatusCard?: boolean;
}

export default function BannerMobilePreview({
  banner,
  enableCleanStatusCard = true,
}: BannerPreviewProps) {
  const [deviceType, setDeviceType] = useState<'ios' | 'android'>('ios');

  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      {/* Device Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setDeviceType('ios')}
          className={`px-3 py-1 rounded-lg transition-all ${
            deviceType === 'ios'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          📱 iOS Preview
        </button>
        <button
          onClick={() => setDeviceType('android')}
          className={`px-3 py-1 rounded-lg transition-all ${
            deviceType === 'android'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🤖 Android Preview
        </button>
      </div>

      {/* Phone Frame */}
      <div
        className={`w-full max-w-[320px] bg-slate-950 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800 relative select-none overflow-hidden ${
          deviceType === 'ios' ? 'ring-4 sm:ring-8 ring-slate-900/50' : 'rounded-[32px]'
        }`}
      >
        {/* Dynamic Island / Camera Notch */}
        {deviceType === 'ios' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-end px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          </div>
        )}

        {/* Mobile Screen Surface */}
        <div className="bg-slate-50 rounded-[32px] overflow-hidden text-slate-900 flex flex-col h-[560px] relative">
          {/* Status Bar */}
          <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-bold text-slate-800">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <BatteryIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* App Header */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-black leading-tight text-slate-900">Vervice</p>
                <p className="text-[9px] text-slate-500 flex items-center gap-0.5">
                  <Building2 className="w-2.5 h-2.5 text-emerald-600" /> Prestige City
                </p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
              R
            </div>
          </div>

          {/* App Body Scrollable Area */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto scrollbar-none">
            {/* ── LIVE PREVIEW BANNER CARD ── */}
            <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-emerald-600 to-teal-800 text-white min-h-[140px] flex flex-col justify-end p-3.5">
              {banner?.imageUrl && (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
              )}
              <div className="relative z-10 space-y-1">
                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm inline-block">
                  Special Announcement
                </span>
                <h4 className="text-xs font-black leading-snug drop-shadow-sm line-clamp-2">
                  {banner?.title || 'Your Banner Title Here'}
                </h4>
                {banner?.subtitle && (
                  <p className="text-[10px] text-emerald-100 font-medium line-clamp-2 leading-tight">
                    {banner.subtitle}
                  </p>
                )}
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.8 rounded-md bg-white text-emerald-900 shadow-xs">
                    Explore Now <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* ── TODAY'S CLEAN STATUS CARD BELOW BANNER ── */}
            {enableCleanStatusCard && (
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 leading-tight">Today's Clean Status</p>
                    <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Washed at 08:30 AM
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Cleaned ✨
                </span>
              </div>
            )}

            {/* Quick Services Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs">
                <Car className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-[8px] font-bold text-slate-800">Daily Shine</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs">
                <BatteryCharging className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[8px] font-bold text-slate-800">Jumpstart</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-[8px] font-bold text-slate-800">Driver Hire</p>
              </div>
            </div>
          </div>

          {/* Bottom App Nav Bar */}
          <div className="bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-between text-[8px] font-bold text-slate-400">
            <div className="text-emerald-600 text-center">
              <Car className="w-3.5 h-3.5 mx-auto" />
              <span>Home</span>
            </div>
            <div className="text-center">
              <Sparkles className="w-3.5 h-3.5 mx-auto" />
              <span>Services</span>
            </div>
            <div className="text-center">
              <Building2 className="w-3.5 h-3.5 mx-auto" />
              <span>Community</span>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-3.5 h-3.5 mx-auto" />
              <span>Profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
