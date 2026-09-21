'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  Plus,
  Edit2,
  Building2,
  Users,
  ArrowRight,
  Trash2,
  Layers,
  Key,
  MapPin,
  Shield,
} from 'lucide-react';
import { CardGridSkeleton } from '@/components/ui/skeleton';

interface Community {
  id: string;
  name: string;
  city: string;
  address: string;
  pincode?: string;
  blocks: string[];
  totalUnits: number;
  neighborCount: number;
  features?: Record<string, boolean>;
  isActive?: boolean;
  requiresGatePass: boolean;
  gatePasscode?: string;
  parkingFloors?: string[];
}

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    pincode: '',
    blocks: '',
    totalUnits: 0,
    requiresGatePass: false,
    gatePasscode: '',
    parkingFloors: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/communities');
      const data = await res.json();
      setCommunities(data);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCommunity
        ? `/api/communities/${editingCommunity.id}`
        : '/api/communities';
      const method = editingCommunity ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          city: formData.city,
          address: formData.address,
          pincode: formData.pincode,
          totalUnits: Number(formData.totalUnits) || 0,
          requiresGatePass: formData.requiresGatePass,
          gatePasscode: formData.gatePasscode,
          isActive: formData.isActive,
          blocks: formData.blocks.split(',').map((b) => b.trim()).filter(Boolean),
          parkingFloors: formData.parkingFloors.split(',').map((f) => f.trim()).filter(Boolean),
        }),
      });

      setShowForm(false);
      setEditingCommunity(null);
      setFormData({
        name: '',
        city: '',
        address: '',
        pincode: '',
        blocks: '',
        totalUnits: 0,
        requiresGatePass: false,
        gatePasscode: '',
        parkingFloors: '',
        isActive: true,
      });
      await fetchCommunities();
    } catch (error) {
      console.error('Failed to save community:', error);
    }
  };

  const handleEdit = (community: Community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name || '',
      city: community.city || '',
      address: community.address || '',
      pincode: community.pincode || '',
      blocks: (community.blocks || []).join(', '),
      totalUnits: community.totalUnits || 0,
      requiresGatePass: Boolean(community.requiresGatePass),
      gatePasscode: community.gatePasscode || '',
      parkingFloors: (community.parkingFloors || []).join(', '),
      isActive: community.isActive !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the community "${name}"?`)) return;
    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete community');
      } else {
        await fetchCommunities();
      }
    } catch (error) {
      console.error('Failed to delete community:', error);
      alert('An error occurred while deleting the community');
    }
  };

  const filteredCommunities = communities.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.city.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="text-gray-500">{communities.length} communities</p>
        </div>
        <button
          onClick={() => {
            setEditingCommunity(null);
            setFormData({
              name: '',
              city: '',
              address: '',
              pincode: '',
              blocks: '',
              totalUnits: 0,
              requiresGatePass: false,
              gatePasscode: '',
              parkingFloors: '',
              isActive: true,
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Community
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search communities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
        />
      </div>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : filteredCommunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No communities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommunities.map((community) => (
            <div
              key={community.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              onClick={() => router.push(`/communities/${community.id}`)}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{community.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {community.city}{community.pincode ? ` - ${community.pincode}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/communities/${community.id}?tab=blocks_flats`);
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Manage Blocks & Flats"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(community); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(community.id, community.name); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Blocks</span>
                    <span className="font-medium text-gray-900">{community.blocks?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Units</span>
                    <span className="font-medium text-gray-900">{community.totalUnits || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Users</span>
                    <span className="font-medium text-gray-900">{community.neighborCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Gate Pass</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${community.requiresGatePass ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {community.requiresGatePass ? 'Required' : 'Not Required'}
                      </span>
                      {community.requiresGatePass && community.gatePasscode && (
                        <span className="font-mono text-xs bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded">
                          {community.gatePasscode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {community.blocks && community.blocks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-500">Blocks</p>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/communities/${community.id}?tab=blocks_flats`);
                      }}
                      className="text-[11px] text-green-600 hover:text-green-700 font-medium"
                    >
                      Edit Flats →
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {community.blocks.map((block) => (
                      <span
                        key={block}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {block}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCommunity ? 'Edit Community' : 'Add Community'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Society Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g. 560103"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street or landmark"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Blocks (comma-separated)</label>
                <input
                  type="text"
                  value={formData.blocks}
                  onChange={(e) => setFormData({ ...formData, blocks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Block A, Block B, Block C"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Total Units</label>
                <input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gatePass"
                    checked={formData.requiresGatePass}
                    onChange={(e) => setFormData({ ...formData, requiresGatePass: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="gatePass" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    Requires Gate Pass
                  </label>
                </div>

                {formData.requiresGatePass && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-purple-600" /> Cleaner Gate Passcode
                    </label>
                    <input
                      type="text"
                      value={formData.gatePasscode}
                      onChange={(e) => setFormData({ ...formData, gatePasscode: e.target.value })}
                      placeholder="e.g. 9921# or 4402"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Parking Floors (comma-separated)</label>
                <input
                  type="text"
                  value={formData.parkingFloors}
                  onChange={(e) => setFormData({ ...formData, parkingFloors: e.target.value })}
                  placeholder="e.g. B1, B2, Ground Floor"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 -mx-6 -mb-6 bg-white">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition shadow-sm"
                >
                  {editingCommunity ? 'Save Changes' : 'Add Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
