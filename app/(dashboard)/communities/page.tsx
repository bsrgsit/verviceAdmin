'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Edit2,
  Building2,
  Users,
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  city: string;
  address: string;
  blocks: string[];
  totalUnits: number;
  neighborCount: number;
  features: Record<string, boolean>;
  isActive: boolean;
  requiresGatePass: boolean;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    blocks: '',
    totalUnits: 0,
    requiresGatePass: false,
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
          ...formData,
          blocks: formData.blocks.split(',').map((b) => b.trim()).filter(Boolean),
        }),
      });

      setShowForm(false);
      setEditingCommunity(null);
      setFormData({ name: '', city: '', address: '', blocks: '', totalUnits: 0, requiresGatePass: false });
      await fetchCommunities();
    } catch (error) {
      console.error('Failed to save community:', error);
    }
  };

  const handleEdit = (community: Community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      city: community.city,
      address: community.address,
      blocks: community.blocks.join(', '),
      totalUnits: community.totalUnits,
      requiresGatePass: community.requiresGatePass,
    });
    setShowForm(true);
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
            setFormData({ name: '', city: '', address: '', blocks: '', totalUnits: 0, requiresGatePass: false });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
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
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{community.name}</h3>
                    <p className="text-sm text-gray-500">{community.city}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(community)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
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
                  <span className={`px-2 py-0.5 text-xs rounded-full ${community.requiresGatePass ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {community.requiresGatePass ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>

              {community.blocks && community.blocks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Blocks</p>
                  <div className="flex flex-wrap gap-1">
                    {community.blocks.map((block) => (
                      <span
                        key={block}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCommunity ? 'Edit Community' : 'Add Community'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blocks (comma-separated)</label>
                <input
                  type="text"
                  value={formData.blocks}
                  onChange={(e) => setFormData({ ...formData, blocks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Block A, Block B, Block C"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                <input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="gatePass"
                  checked={formData.requiresGatePass}
                  onChange={(e) => setFormData({ ...formData, requiresGatePass: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="gatePass" className="text-sm text-gray-700">Requires Gate Pass</label>
              </div>
            </form>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                {editingCommunity ? 'Save Changes' : 'Add Community'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
