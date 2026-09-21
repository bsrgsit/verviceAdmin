'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Car,
  Layers,
  RefreshCw,
  Building2,
  Shield,
  Tag,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price4Wheeler: number;
  price2Wheeler: number;
  price?: number;
  period: string;
  type: string;
  description: string;
  features: string[];
  applicableVehicleTypes: string[];
  popular: boolean;
  isActive: boolean;
  sortOrder: number;
  iconName?: string;
  colorHex?: string;
  actionType?: string;
  tileSize?: string;
  tileSpanColumns?: number;
  bannerImageUrl?: string;
  isInherited?: boolean;
}

export default function ServicesCatalogPage() {
  const { selectedCommunity, setSelectedCommunity, communities } = useCommunity();
  const [activeCommunityName, setActiveCommunityName] = useState<string>('Default Community');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [tabUiConfig, setTabUiConfig] = useState<any>(null);
  const [isInherited, setIsInherited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [featureInput, setFeatureInput] = useState<string>('');

  // Sync active community name from selectedCommunity in context
  useEffect(() => {
    if (selectedCommunity && selectedCommunity !== 'ALL') {
      const found = communities.find((c) => c.id === selectedCommunity || c.name === selectedCommunity);
      setActiveCommunityName(found ? found.name : selectedCommunity);
    } else {
      setActiveCommunityName('Default Community');
    }
  }, [selectedCommunity, communities]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/services?community=${encodeURIComponent(activeCommunityName)}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
        setTabUiConfig(data.tabUiConfig || null);
        setIsInherited(Boolean(data.isInherited));
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [activeCommunityName]);

  // Clone default catalog
  const handleCloneDefault = async () => {
    if (!confirm(`Are you sure you want to copy all services from 'Default Community' into '${activeCommunityName}'?`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clone_default',
          community: activeCommunityName,
        }),
      });
      if (res.ok) {
        alert('Catalog cloned successfully!');
        fetchCatalog();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to clone catalog');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // Quick toggle active status
  const handleToggleActive = async (service: ServiceItem) => {
    const nextState = !service.isActive;
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community: activeCommunityName,
          isActive: nextState,
        }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, isActive: nextState } : s))
        );
      } else {
        alert('Failed to update service active status');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    }
  };

  // Quick toggle popular badge
  const handleTogglePopular = async (service: ServiceItem) => {
    const nextState = !service.popular;
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community: activeCommunityName,
          popular: nextState,
        }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, popular: nextState } : s))
        );
      } else {
        alert('Failed to update popular badge');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(
        `/api/services/${serviceId}?community=${encodeURIComponent(activeCommunityName)}`,
        {
          method: 'DELETE',
        }
      );
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
      } else {
        alert('Failed to delete service');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting service');
    }
  };

  // Open modal for Create or Edit
  const openEditModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService({ ...service });
      setFeatureInput('');
    } else {
      setEditingService({
        id: '',
        name: '',
        category: 'Monthly Plans',
        price4Wheeler: 600,
        price2Wheeler: 350,
        period: '/mo',
        type: 'monthly',
        description: '',
        features: ['Exterior Waterless Wash', 'Microfiber Towel Cleaning'],
        applicableVehicleTypes: ['4 Wheeler', '2 Wheeler'],
        popular: false,
        isActive: true,
        sortOrder: services.length + 1,
        colorHex: '#10B981',
        iconName: 'Sparkles',
        actionType: 'subscribe',
      });
      setFeatureInput('');
    }
    setIsModalOpen(true);
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editingService.name?.trim()) {
      alert('Please provide a service name');
      return;
    }

    setSaving(true);
    try {
      const isExisting = Boolean(editingService.id && services.some((s) => s.id === editingService.id));
      const url = isExisting ? `/api/services/${editingService.id}` : '/api/services';
      const method = isExisting ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community: activeCommunityName,
          ...editingService,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingService(null);
        fetchCatalog();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save service');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // Feature bullet management
  const addFeature = () => {
    if (!featureInput.trim() || !editingService) return;
    const cur = editingService.features || [];
    setEditingService({
      ...editingService,
      features: [...cur, featureInput.trim()],
    });
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    if (!editingService) return;
    const cur = editingService.features || [];
    setEditingService({
      ...editingService,
      features: cur.filter((_, i) => i !== idx),
    });
  };

  // Filtered services
  const filteredServices = services.filter((s) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'monthly') return s.category === 'Monthly Plans' || s.type === 'monthly';
    if (filterCategory === 'addons') return s.category === 'Add-ons' || s.category === 'Extras';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER & COMMUNITY SELECTOR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
              Live Mobile Catalog
            </Badge>
            {isInherited && (
              <Badge variant="warning" className="text-[10px]">
                Inherited from Default Community
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Services & Pricing Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage daily wash plans, 4-wheeler & 2-wheeler tariffs, features, and custom services for each society.
          </p>
        </div>

        {/* Community Scope Dropdown & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={activeCommunityName}
              onChange={(e) => {
                const val = e.target.value;
                setActiveCommunityName(val);
                // Also update global community if found
                const match = communities.find((c) => c.name === val);
                if (match) setSelectedCommunity(match.id);
                else if (val === 'Default Community') setSelectedCommunity('ALL');
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Default Community">Default Community (Global Fallback)</option>
              {communities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCatalog}
            disabled={loading}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => openEditModal()}
            className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </Button>
        </div>
      </div>

      {/* ── 2. INHERITANCE NOTICE BANNER (IF APPLICABLE) ── */}
      {isInherited && activeCommunityName !== 'Default Community' && (
        <Card className="border-amber-200 bg-amber-50/70 shadow-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-extrabold text-amber-900">
                  {activeCommunityName} is using global Default Community pricing.
                </span>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  To customize prices or packages specifically for this society, clone the default catalog with one click.
                </p>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleCloneDefault}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              {saving ? 'Cloning...' : 'Clone Default Catalog to Society'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── 3. FILTER TABS & SERVICE COUNTERS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
            className="h-8 text-xs"
          >
            All Items ({services.length})
          </Button>
          <Button
            variant={filterCategory === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('monthly')}
            className="h-8 text-xs"
          >
            Monthly Wash Plans ({services.filter((s) => s.category === 'Monthly Plans' || s.type === 'monthly').length})
          </Button>
          <Button
            variant={filterCategory === 'addons' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('addons')}
            className="h-8 text-xs"
          >
            Add-ons & Extras ({services.filter((s) => s.category === 'Add-ons' || s.category === 'Extras').length})
          </Button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredServices.length}</span> services for{' '}
          <span className="font-bold text-slate-800">{activeCommunityName}</span>
        </div>
      </div>

      {/* ── 4. SERVICES GRID ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
          <p className="text-xs font-semibold text-slate-500">Loading catalog items...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 p-12 text-center">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No services found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            This community doesn't have any services configured yet under this filter.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button size="sm" onClick={() => openEditModal()} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Service
            </Button>
            {activeCommunityName !== 'Default Community' && (
              <Button size="sm" variant="outline" onClick={handleCloneDefault} className="gap-1.5 text-xs">
                <Copy className="w-3.5 h-3.5" /> Clone Default
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((svc) => (
            <Card
              key={svc.id}
              className={`flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                svc.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Header: Badges & Actions */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {svc.category || 'Wash Plan'}
                      </Badge>
                      {svc.popular && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black">
                          ★ Most Popular
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] text-slate-400 font-mono">
                        #{svc.sortOrder}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(svc)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(svc.id)}
                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: svc.colorHex || '#10B981' }}
                    />
                    {svc.name}
                  </h3>
                  {svc.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                  )}
                </div>

                {/* Price Display: 4-Wheeler & 2-Wheeler Tariffs */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="grid grid-cols-2 gap-3 divide-x divide-slate-200">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">4 Wheeler</span>
                      <div className="text-base font-black text-slate-900">
                        {formatCurrency(svc.price4Wheeler || svc.price || 0)}
                        <span className="text-xs font-medium text-slate-400">{svc.period || '/mo'}</span>
                      </div>
                    </div>
                    <div className="pl-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">2 Wheeler</span>
                      <div className="text-base font-black text-slate-900">
                        {formatCurrency(svc.price2Wheeler || 0)}
                        <span className="text-xs font-medium text-slate-400">{svc.period || '/mo'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Bullet List */}
                {svc.features && svc.features.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Features</span>
                    <ul className="space-y-1">
                      {svc.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="line-clamp-1">{f}</span>
                        </li>
                      ))}
                      {svc.features.length > 4 && (
                        <li className="text-[10px] text-slate-400 font-semibold pl-5">
                          +{svc.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Card Footer: Active Status Toggle & Popular Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={svc.isActive}
                      onCheckedChange={() => handleToggleActive(svc)}
                    />
                    <span className={`text-[11px] font-bold ${svc.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {svc.isActive ? 'Active on App' : 'Disabled'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePopular(svc)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                      svc.popular
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {svc.popular ? '★ Featured' : '☆ Feature'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── 5. MODAL FOR CREATE / EDIT SERVICE ── */}
      {isModalOpen && editingService && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingService.id && services.some((s) => s.id === editingService.id)
                    ? 'Edit Service & Pricing'
                    : 'Create New Service'}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              {/* Service Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Shine, Interior Spa"
                    value={editingService.name || ''}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={editingService.category || 'Monthly Plans'}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  >
                    <option value="Monthly Plans">Monthly Plans</option>
                    <option value="Add-ons">Add-ons</option>
                    <option value="Extras">Extras</option>
                    <option value="Concierge">Concierge</option>
                    <option value="Detailing">Detailing</option>
                  </select>
                </div>
              </div>

              {/* Tariffs: 4 Wheeler vs 2 Wheeler */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">4-Wheeler Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingService.price4Wheeler ?? 600}
                    onChange={(e) =>
                      setEditingService({ ...editingService, price4Wheeler: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">2-Wheeler Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingService.price2Wheeler ?? 350}
                    onChange={(e) =>
                      setEditingService({ ...editingService, price2Wheeler: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing Period</label>
                  <input
                    type="text"
                    placeholder="e.g. /mo, one-time"
                    value={editingService.period || '/mo'}
                    onChange={(e) => setEditingService({ ...editingService, period: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Exterior cleaning 6 days a week + 1 interior clean per month..."
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Features Bullet Points */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Package Features / Deliverables</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. High pressure foam spray"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button type="button" size="sm" onClick={addFeature} className="h-9 px-3">
                    Add
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(editingService.features || []).map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="text-slate-700">{f}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display & Order Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={editingService.sortOrder || 1}
                    onChange={(e) =>
                      setEditingService({ ...editingService, sortOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingService.colorHex || '#10B981'}
                      onChange={(e) => setEditingService({ ...editingService, colorHex: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={editingService.colorHex || '#10B981'}
                      onChange={(e) => setEditingService({ ...editingService, colorHex: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Action Route</label>
                  <select
                    value={editingService.actionType || 'subscribe'}
                    onChange={(e) => setEditingService({ ...editingService, actionType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="subscribe">Subscribe / Book</option>
                    <option value="driver">Driver Screen</option>
                    <option value="jumpstart">Jumpstart Screen</option>
                    <option value="detailing">Detailing Screen</option>
                    <option value="external">External Link</option>
                  </select>
                </div>
              </div>

              {/* Toggles: Active & Popular */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={editingService.isActive ?? true}
                    onCheckedChange={(val) => setEditingService({ ...editingService, isActive: val })}
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Active on Mobile App</span>
                    <span className="text-[10px] text-slate-400">Residents will see this in their catalog</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={editingService.popular ?? false}
                    onCheckedChange={(val) => setEditingService({ ...editingService, popular: val })}
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Most Popular Badge</span>
                    <span className="text-[10px] text-slate-400">Highlights card in golden yellow</span>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? 'Saving...' : 'Save & Publish to App'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
