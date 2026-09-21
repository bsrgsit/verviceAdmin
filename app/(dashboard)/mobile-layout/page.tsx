'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  Palette,
  Eye,
  RefreshCw,
  Gift,
  Car,
  Shield,
  Battery,
  Gamepad2,
  HelpCircle,
  Grid,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  deepLink: string;
  redirectUrl?: string;
  iconUrl?: string;
  gradientStart: string;
  gradientEnd: string;
  sortOrder: number;
  isActive: boolean;
}

interface HomeTileItem {
  id: string;
  sectionId?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  deepLink: string;
  redirectUrl?: string;
  iconUrl?: string;
  gradientStart: string;
  gradientEnd: string;
  order: number;
  enabled: boolean;
  communities?: string[];
}

// Icon mapper for quick actions
const getQuickActionIcon = (deepLink: string) => {
  switch (deepLink) {
    case 'rewards':
      return Gift;
    case 'hire_driver':
      return Car;
    case 'insurance':
      return Shield;
    case 'batteries':
      return Battery;
    case 'gaming':
      return Gamepad2;
    case 'support':
      return HelpCircle;
    case 'detailing':
      return Sparkles;
    default:
      return Grid;
  }
};

export default function MobileLayoutPage() {
  const [activeTab, setActiveTab] = useState<'quick_actions' | 'home_tiles'>('quick_actions');
  const [quickActions, setQuickActions] = useState<QuickActionItem[]>([]);
  const [homeTiles, setHomeTiles] = useState<HomeTileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State for Quick Action
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [editingQa, setEditingQa] = useState<Partial<QuickActionItem> | null>(null);

  // Modal State for Home Tile
  const [isTileModalOpen, setIsTileModalOpen] = useState(false);
  const [editingTile, setEditingTile] = useState<Partial<HomeTileItem> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qaRes, tilesRes] = await Promise.all([
        fetch('/api/mobile-layout/quick-actions'),
        fetch('/api/mobile-layout/home-tiles'),
      ]);

      if (qaRes.ok) {
        const qaData = await qaRes.json();
        setQuickActions(qaData.actions || []);
      }
      if (tilesRes.ok) {
        const tilesData = await tilesRes.json();
        setHomeTiles(Array.isArray(tilesData) ? tilesData : []);
      }
    } catch (err) {
      console.error('Failed to load mobile layout data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1-Click Restore Defaults
  const handleRestoreDefaults = async () => {
    if (!confirm('Reset quick actions to the standard 8 mobile home items? Current items will be replaced.')) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/mobile-layout/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore_defaults' }),
      });
      if (res.ok) {
        alert('Standard quick actions restored!');
        fetchData();
      } else {
        alert('Failed to restore defaults');
      }
    } catch (e: any) {
      alert(e.message || 'Error restoring defaults');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Active on Quick Action
  const handleToggleQaActive = async (qa: QuickActionItem) => {
    const nextActive = !qa.isActive;
    try {
      const res = await fetch('/api/mobile-layout/quick-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qa.id, isActive: nextActive }),
      });
      if (res.ok) {
        setQuickActions((prev) =>
          prev.map((item) => (item.id === qa.id ? { ...item, isActive: nextActive } : item))
        );
      }
    } catch (e: any) {
      alert('Failed to update active state');
    }
  };

  // Move Quick Action Up or Down
  const handleMoveQa = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= quickActions.length) return;

    const newItems = [...quickActions];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Recalculate sortOrder
    const reordered = newItems.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setQuickActions(reordered);

    try {
      await fetch('/api/mobile-layout/quick-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: reordered.map((i) => ({ id: i.id, sortOrder: i.sortOrder })),
        }),
      });
    } catch (e) {
      console.error('Failed to save reordered quick actions', e);
    }
  };

  // Save Quick Action
  const handleSaveQa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQa || !editingQa.label?.trim()) return;

    setSaving(true);
    try {
      const isExisting = Boolean(editingQa.id && quickActions.some((q) => q.id === editingQa.id));
      const res = await fetch('/api/mobile-layout/quick-actions', {
        method: isExisting ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQa),
      });

      if (res.ok) {
        setIsQaModalOpen(false);
        setEditingQa(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Quick Action
  const handleDeleteQa = async (id: string) => {
    if (!confirm('Are you sure you want to remove this quick action?')) return;
    try {
      const res = await fetch(`/api/mobile-layout/quick-actions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuickActions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (e: any) {
      alert('Error deleting');
    }
  };

  // Toggle Home Tile
  const handleToggleTile = async (tile: HomeTileItem) => {
    const nextState = !tile.enabled;
    try {
      const res = await fetch('/api/mobile-layout/home-tiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tile.id, enabled: nextState }),
      });
      if (res.ok) {
        setHomeTiles((prev) =>
          prev.map((t) => (t.id === tile.id ? { ...t, enabled: nextState } : t))
        );
      }
    } catch (e) {
      alert('Failed to update tile status');
    }
  };

  // Delete Home Tile
  const handleDeleteTile = async (id: string) => {
    if (!confirm('Delete this promo tile?')) return;
    try {
      const res = await fetch(`/api/mobile-layout/home-tiles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHomeTiles((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      alert('Error deleting tile');
    }
  };

  // Save Home Tile
  const handleSaveTile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTile || !editingTile.title?.trim()) return;

    setSaving(true);
    try {
      const isExisting = Boolean(editingTile.id && homeTiles.some((t) => t.id === editingTile.id));
      const res = await fetch('/api/mobile-layout/home-tiles', {
        method: isExisting ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTile),
      });

      if (res.ok) {
        setIsTileModalOpen(false);
        setEditingTile(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save tile');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving tile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
              Mobile Home Screen
            </Badge>
            <Badge variant="outline" className="text-slate-500 font-mono text-[10px]">
              Android & iOS Real-time
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-emerald-600" />
            Mobile Layout & Quick Actions Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control the 8 circular quick actions, deep link targets, linear gradient styling, and promotional cards on the mobile home screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreDefaults}
            disabled={saving}
            className="h-9 gap-1.5 text-xs text-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Restore 8 Standard Defaults
          </Button>

          {activeTab === 'quick_actions' ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingQa({
                  id: '',
                  label: '',
                  description: '',
                  deepLink: 'services',
                  gradientStart: '#10B981',
                  gradientEnd: '#059669',
                  sortOrder: quickActions.length + 1,
                  isActive: true,
                });
                setIsQaModalOpen(true);
              }}
              className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Add Quick Action
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingTile({
                  id: '',
                  title: '',
                  subtitle: '',
                  ctaText: 'Explore →',
                  deepLink: 'services',
                  gradientStart: '#1E293B',
                  gradientEnd: '#334155',
                  order: homeTiles.length + 1,
                  enabled: true,
                  communities: [],
                });
                setIsTileModalOpen(true);
              }}
              className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Add Promo Tile
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. SECTION TABS ── */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="bg-slate-100 p-1 mb-4">
          <TabsTrigger value="quick_actions" className="text-xs font-bold gap-2">
            <Grid className="w-3.5 h-3.5" />
            Quick Actions ({quickActions.length})
          </TabsTrigger>
          <TabsTrigger value="home_tiles" className="text-xs font-bold gap-2">
            <Layers className="w-3.5 h-3.5" />
            Promotional Cards & Tiles ({homeTiles.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: QUICK ACTIONS GRID & TABLE ── */}
        <TabsContent value="quick_actions" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Quick Actions List */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Display Order & Controls</span>
                <span className="text-slate-400">Drag or use arrows to reorder items</span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400 font-semibold">
                  Loading quick actions...
                </div>
              ) : quickActions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No quick actions found. Click 'Restore 8 Standard Defaults' above.
                </div>
              ) : (
                <div className="space-y-2">
                  {quickActions.map((qa, idx) => {
                    const IconComp = getQuickActionIcon(qa.deepLink);
                    return (
                      <div
                        key={qa.id}
                        className={`p-3.5 bg-white border rounded-xl flex items-center justify-between gap-3 transition-all ${
                          qa.isActive ? 'border-slate-200 shadow-xs' : 'border-slate-200 bg-slate-50/70 opacity-60'
                        }`}
                      >
                        {/* Drag / Reorder Buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveQa(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === quickActions.length - 1}
                            onClick={() => handleMoveQa(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Visual Pill Preview */}
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${qa.gradientStart}, ${qa.gradientEnd})`,
                          }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{qa.label}</span>
                            <Badge variant="outline" className="text-[10px] font-mono py-0">
                              #{qa.sortOrder}
                            </Badge>
                            <span className="text-[11px] text-slate-400">({qa.description || 'Action'})</span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <span>DeepLink:</span>
                            <span className="font-bold text-emerald-700">{qa.deepLink}</span>
                            {qa.redirectUrl && <span className="text-slate-400">(Web redirect)</span>}
                          </p>
                        </div>

                        {/* Active Switch & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <Switch
                            checked={qa.isActive}
                            onCheckedChange={() => handleToggleQaActive(qa)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingQa({ ...qa });
                              setIsQaModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQa(qa.id)}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Live Phone Mockup Preview */}
            <div className="lg:col-span-5">
              <Card className="sticky top-6 border-slate-200 shadow-sm bg-slate-900 text-white p-5 rounded-3xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> Live Mobile Home Preview
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    4x2 Quick Action Grid
                  </span>
                </div>

                {/* Simulated Phone Frame */}
                <div className="mt-4 bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-4">
                  {/* Phone Header Mock */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                        Good Morning, Resident
                      </span>
                      <span className="font-extrabold text-white text-sm">Aparna Lake Breeze</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      V
                    </div>
                  </div>

                  {/* 4x2 Circular Quick Action Icons Grid */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-3">
                      Quick Services
                    </span>

                    <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                      {quickActions
                        .filter((qa) => qa.isActive)
                        .slice(0, 8)
                        .map((qa) => {
                          const IconComp = getQuickActionIcon(qa.deepLink);
                          return (
                            <div
                              key={qa.id}
                              onClick={() => {
                                setEditingQa({ ...qa });
                                setIsQaModalOpen(true);
                              }}
                              className="flex flex-col items-center text-center cursor-pointer group"
                            >
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
                                style={{
                                  background: `linear-gradient(135deg, ${qa.gradientStart}, ${qa.gradientEnd})`,
                                }}
                              >
                                <IconComp className="w-5 h-5" />
                              </div>
                              <span className="text-[11px] font-bold text-slate-200 mt-1.5 leading-tight group-hover:text-emerald-400 line-clamp-1">
                                {qa.label}
                              </span>
                              <span className="text-[9px] text-slate-500 leading-none mt-0.5 line-clamp-1">
                                {qa.description}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Phone Footer hint */}
                  <div className="pt-3 border-t border-slate-800/80 text-center">
                    <p className="text-[10px] text-slate-500">
                      Click any circular button to edit its target route or linear gradient.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: PROMOTIONAL CARDS & TILES ── */}
        <TabsContent value="home_tiles" className="space-y-4 mt-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Dynamic Promotional Cards</span>
            <span className="text-slate-400">Featured banners displayed beneath vehicle cards on mobile</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-semibold">
              Loading promo tiles...
            </div>
          ) : homeTiles.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 p-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No promo cards created yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create promotional cards with deep links to drive engagement for detailing, insurance renewals, or concierge services.
              </p>
              <div className="mt-4 flex justify-center">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTile({
                      id: '',
                      title: '',
                      subtitle: '',
                      ctaText: 'Explore →',
                      deepLink: 'services',
                      gradientStart: '#1E293B',
                      gradientEnd: '#334155',
                      order: 1,
                      enabled: true,
                      communities: [],
                    });
                    setIsTileModalOpen(true);
                  }}
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Tile
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeTiles.map((tile) => (
                <Card
                  key={tile.id}
                  className="overflow-hidden border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Gradient Card Header */}
                  <div
                    className="p-4 text-white flex flex-col justify-between min-h-[110px]"
                    style={{
                      background: `linear-gradient(135deg, ${tile.gradientStart || '#1E293B'}, ${tile.gradientEnd || '#334155'})`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] bg-black/30 px-2 py-0.5 rounded text-white/80">
                        Order #{tile.order}
                      </span>
                      <Badge className={tile.enabled ? 'bg-emerald-500 text-white text-[10px]' : 'bg-slate-700 text-slate-300 text-[10px]'}>
                        {tile.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-black text-base leading-tight drop-shadow-xs">{tile.title}</h4>
                      {tile.subtitle && (
                        <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{tile.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Target:</span>
                        <span className="font-mono font-bold text-slate-900">{tile.deepLink}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>CTA Label:</span>
                        <span className="font-bold text-emerald-700">{tile.ctaText}</span>
                      </div>
                      {tile.communities && tile.communities.length > 0 && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Target Societies:</span>
                          <span className="font-medium text-slate-800">{tile.communities.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tile.enabled}
                          onCheckedChange={() => handleToggleTile(tile)}
                        />
                        <span className="text-[11px] font-bold text-slate-600">
                          {tile.enabled ? 'Shown' : 'Hidden'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTile({ ...tile });
                            setIsTileModalOpen(true);
                          }}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTile(tile.id)}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── 3. MODAL FOR QUICK ACTION ── */}
      {isQaModalOpen && editingQa && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsQaModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                {editingQa.id ? 'Edit Quick Action' : 'Create Quick Action'}
              </h3>
              <button
                onClick={() => setIsQaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQa} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Button Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Detailing, Driver"
                    value={editingQa.label || ''}
                    onChange={(e) => setEditingQa({ ...editingQa, label: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subtext / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium, On Demand"
                    value={editingQa.description || ''}
                    onChange={(e) => setEditingQa({ ...editingQa, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">App Deep Link *</label>
                <select
                  value={editingQa.deepLink || 'services'}
                  onChange={(e) => setEditingQa({ ...editingQa, deepLink: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                >
                  <option value="rewards">Rewards Screen</option>
                  <option value="hire_driver">Hire Driver Screen</option>
                  <option value="insurance">Insurance Screen</option>
                  <option value="batteries">Battery Jumpstart / Replace</option>
                  <option value="detailing">Detailing Screen</option>
                  <option value="gaming">Gaming Screen</option>
                  <option value="support">Helpdesk / Support Tickets</option>
                  <option value="community_hub">Community Hub / More Services</option>
                  <option value="services">Services Catalog Tab</option>
                  <option value="extras">Extras Tab</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Optional Web Redirect URL (Overrides Deep Link)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/promo"
                  value={editingQa.redirectUrl || ''}
                  onChange={(e) => setEditingQa({ ...editingQa, redirectUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              {/* Gradient Colors */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gradient Start Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingQa.gradientStart || '#10B981'}
                      onChange={(e) => setEditingQa({ ...editingQa, gradientStart: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={editingQa.gradientStart || '#10B981'}
                      onChange={(e) => setEditingQa({ ...editingQa, gradientStart: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gradient End Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingQa.gradientEnd || '#059669'}
                      onChange={(e) => setEditingQa({ ...editingQa, gradientEnd: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={editingQa.gradientEnd || '#059669'}
                      onChange={(e) => setEditingQa({ ...editingQa, gradientEnd: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block">Active Status</span>
                  <span className="text-[10px] text-slate-400">Controls visibility on Android & iOS</span>
                </div>
                <Switch
                  checked={editingQa.isActive ?? true}
                  onCheckedChange={(val) => setEditingQa({ ...editingQa, isActive: val })}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsQaModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? 'Saving...' : 'Save Quick Action'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. MODAL FOR HOME PROMO TILE ── */}
      {isTileModalOpen && editingTile && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsTileModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                {editingTile.id ? 'Edit Promotional Tile' : 'Create Promotional Tile'}
              </h3>
              <button
                onClick={() => setIsTileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceramic Coating Deal"
                  value={editingTile.title || ''}
                  onChange={(e) => setEditingTile({ ...editingTile, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Get 20% off showroom finish this weekend"
                  value={editingTile.subtitle || ''}
                  onChange={(e) => setEditingTile({ ...editingTile, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Explore →, Book Now"
                    value={editingTile.ctaText || 'Explore →'}
                    onChange={(e) => setEditingTile({ ...editingTile, ctaText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target DeepLink</label>
                  <input
                    type="text"
                    placeholder="e.g. detailing, services"
                    value={editingTile.deepLink || 'services'}
                    onChange={(e) => setEditingTile({ ...editingTile, deepLink: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Gradient Colors */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gradient Start Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTile.gradientStart || '#1E293B'}
                      onChange={(e) => setEditingTile({ ...editingTile, gradientStart: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={editingTile.gradientStart || '#1E293B'}
                      onChange={(e) => setEditingTile({ ...editingTile, gradientStart: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gradient End Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTile.gradientEnd || '#334155'}
                      onChange={(e) => setEditingTile({ ...editingTile, gradientEnd: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={editingTile.gradientEnd || '#334155'}
                      onChange={(e) => setEditingTile({ ...editingTile, gradientEnd: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block">Enable Promo Tile</span>
                  <span className="text-[10px] text-slate-400">Visible on the home feed</span>
                </div>
                <Switch
                  checked={editingTile.enabled ?? true}
                  onCheckedChange={(val) => setEditingTile({ ...editingTile, enabled: val })}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsTileModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? 'Saving...' : 'Save Tile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
