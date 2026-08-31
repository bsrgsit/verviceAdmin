'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Building2,
  Globe,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import BannerMobilePreview from '@/components/ui/banner-mobile-preview';

export default function BannersPage() {
  const { communities } = useCommunity();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPreviewBanner, setSelectedPreviewBanner] = useState<any>({
    title: '50% Off Doorstep Shine',
    subtitle: 'Daily waterless microfiber cleaning with streak-free glass gloss',
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
    actionUrl: '/services',
    communityId: 'ALL',
  });

  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    actionUrl: '/services',
    communityId: 'ALL',
    priority: 1,
  });

  const loadBanners = () => {
    setLoading(true);
    fetch('/api/banners')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBanners(data);
          if (data.length > 0) {
            setSelectedPreviewBanner(data[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleCreateBanner = async () => {
    if (!newBanner.title || !newBanner.imageUrl) return;
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewBanner({
          title: '',
          subtitle: '',
          imageUrl: '',
          actionUrl: '/services',
          communityId: 'ALL',
          priority: 1,
        });
        loadBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (banner: any) => {
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.ok) {
        loadBanners();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            Home Banners & Mobile App Announcements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, manage, and preview promotional carousels for Android & iOS consumer apps
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Main Grid: Banners List (Left) + Interactive Live Phone Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Banners Cards */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Banners Published</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create announcements and promotional offers to engage society residents.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Create First Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banners.map((banner) => {
                const isSelected = selectedPreviewBanner?.id === banner.id;
                return (
                  <div
                    key={banner.id}
                    onClick={() => setSelectedPreviewBanner(banner)}
                    className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200'
                    }`}
                  >
                    {/* Image Preview */}
                    <div className="relative h-32 bg-slate-100 overflow-hidden">
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                            banner.isActive
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-900/80 text-slate-200'
                          }`}
                        >
                          {banner.isActive ? 'Active 🟢' : 'Hidden 🔒'}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-3.5 space-y-1.5 flex-1">
                      <h3 className="text-xs font-extrabold text-slate-900 line-clamp-1">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {banner.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400 font-medium">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{banner.communityId === 'ALL' ? 'All Communities' : banner.communityId}</span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(banner);
                        }}
                        className="text-[11px] font-bold text-slate-700 hover:text-emerald-700"
                      >
                        {banner.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBanner(banner.id);
                        }}
                        className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Live Interactive Mobile Phone Preview */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm sticky top-20 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" /> Live Mobile App Preview
              </h3>
              <p className="text-[10px] text-slate-400">See how residents view this banner</p>
            </div>
          </div>

          <BannerMobilePreview banner={selectedPreviewBanner} />
        </div>
      </div>

      {/* Add Banner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Create Home Banner</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Banner Title</label>
                <input
                  type="text"
                  value={newBanner.title}
                  onChange={(e) => {
                    setNewBanner({ ...newBanner, title: e.target.value });
                    setSelectedPreviewBanner({ ...selectedPreviewBanner, title: e.target.value });
                  }}
                  placeholder="e.g. 50% Off First Month Shine"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subtitle / Message</label>
                <input
                  type="text"
                  value={newBanner.subtitle}
                  onChange={(e) => {
                    setNewBanner({ ...newBanner, subtitle: e.target.value });
                    setSelectedPreviewBanner({ ...selectedPreviewBanner, subtitle: e.target.value });
                  }}
                  placeholder="e.g. Daily doorstep scratch-free microfiber cleaning"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={newBanner.imageUrl}
                  onChange={(e) => {
                    setNewBanner({ ...newBanner, imageUrl: e.target.value });
                    setSelectedPreviewBanner({ ...selectedPreviewBanner, imageUrl: e.target.value });
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Community</label>
                <select
                  value={newBanner.communityId}
                  onChange={(e) => setNewBanner({ ...newBanner, communityId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ALL">🌐 All Communities Combined</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.name}>
                      🏢 {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBanner}
                disabled={!newBanner.title || !newBanner.imageUrl}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs disabled:opacity-50"
              >
                Save & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
