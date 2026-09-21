'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Building2,
  TrendingUp,
  Loader2,
  Search,
  Ban,
  CheckCircle2,
  Eye,
  Clock,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Layers,
  Plus,
  Key,
  MapPin,
  Check,
  Save,
  Zap,
  Settings2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  X,
  Shield,
  Copy,
  Hash,
} from 'lucide-react';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CommunityDetailSkeleton, TableSkeleton, ListSkeleton } from '@/components/ui/skeleton';

interface CommunityStats {
  communityName: string;
  city: string;
  blocks: string[];
  totalUnits: number;
  totalUsers: number;
  activeBookings: number;
  pendingPayments: number;
  monthlyRevenue: number;
}

interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  currency: string;
  billingMonth: string;
  dueDate: number;
  status: 'pending' | 'paid' | 'overdue' | 'pending_verification';
  invoiceNumber: string;
  cycleNumber: number;
  serviceName: string;
  vehicleReg: string;
}

type TabType = 'overview' | 'blocks_flats' | 'users' | 'bookings' | 'payments' | 'invoices';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = params.id as string;

  const urlTab = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(urlTab || 'overview');
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [community, setCommunity] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Blocks & Flats state
  const [allBlocksFlats, setAllBlocksFlats] = useState<Record<string, string[]>>({});
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [flatsLoading, setFlatsLoading] = useState(false);
  const [flatsSaving, setFlatsSaving] = useState(false);
  const [newBlockInput, setNewBlockInput] = useState('');
  const [singleFlatInput, setSingleFlatInput] = useState('');
  const [flatSearch, setFlatSearch] = useState('');

  // Bulk Floor Range Generator
  const [showGenerator, setShowGenerator] = useState(false);
  const [genStartFloor, setGenStartFloor] = useState<number>(1);
  const [genEndFloor, setGenEndFloor] = useState<number>(14);
  const [genUnitsPerFloor, setGenUnitsPerFloor] = useState<number>(4);
  const [genPrefix, setGenPrefix] = useState<string>('');

  // Edit Society Details Modal State
  const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [editDetailsForm, setEditDetailsForm] = useState({
    name: '',
    city: '',
    address: '',
    pincode: '',
    totalUnits: 0,
    requiresGatePass: false,
    gatePasscode: '',
    parkingFloors: '',
    isActive: true,
  });

  // Invoice Edit Modal State
  const [showEditModal, setShowEditModal] = useState<Invoice | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('pending');
  const [editBillingMonth, setEditBillingMonth] = useState('');

  const fetchFlats = async () => {
    setFlatsLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/flats`);
      if (res.ok) {
        const data = await res.json();
        const blocks = data.blocks || {};
        setAllBlocksFlats(blocks);
        setSelectedBlock((prev) => {
          if (prev && blocks[prev]) return prev;
          const blockKeys = Object.keys(blocks);
          if (blockKeys.length > 0) return blockKeys[0];
          return null;
        });
      }
    } catch (e) {
      console.error('Failed to fetch flats:', e);
    } finally {
      setFlatsLoading(false);
    }
  };

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}`);
      const data = await res.json();
      if (!data.error) {
        setStats(data.stats);
        if (data.community) {
          setCommunity(data.community);
          setEditDetailsForm({
            name: data.community.name || '',
            city: data.community.city || '',
            address: data.community.address || '',
            pincode: data.community.pincode || '',
            totalUnits: data.community.totalUnits || 0,
            requiresGatePass: Boolean(data.community.requiresGatePass),
            gatePasscode: data.community.gatePasscode || '',
            parkingFloors: (data.community.parkingFloors || []).join(', '),
            isActive: data.community.isActive !== false,
          });
        }
        setUsers(data.users || []);
        setBookings(data.bookings || []);
        setPayments(data.payments || []);
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch community details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
    fetchFlats();
  }, [communityId]);

  // Ensure default selected block when blocks load
  useEffect(() => {
    if (!selectedBlock) {
      if (stats?.blocks?.length) {
        setSelectedBlock(stats.blocks[0]);
      } else if (Object.keys(allBlocksFlats).length > 0) {
        setSelectedBlock(Object.keys(allBlocksFlats)[0]);
      }
    }
  }, [stats?.blocks, allBlocksFlats, selectedBlock]);

  // Add new block
  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockInput.trim()) return;
    const cleanName = newBlockInput.trim();
    setFlatsSaving(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/flats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockName: cleanName, flats: [] }),
      });
      if (res.ok) {
        setAllBlocksFlats((prev) => ({ ...prev, [cleanName]: [] }));
        setSelectedBlock(cleanName);
        setNewBlockInput('');
        fetchCommunityData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add block');
      }
    } catch (e: any) {
      alert(e.message || 'Error adding block');
    } finally {
      setFlatsSaving(false);
    }
  };

  // Delete block
  const handleDeleteBlock = async (blockToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${blockToDelete}" and all its flats?`)) return;
    setFlatsSaving(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/flats?block=${encodeURIComponent(blockToDelete)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setAllBlocksFlats((prev) => {
          const updated = { ...prev };
          delete updated[blockToDelete];
          return updated;
        });
        setSelectedBlock((prev) => (prev === blockToDelete ? null : prev));
        fetchCommunityData();
      } else {
        alert('Failed to delete block');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting block');
    } finally {
      setFlatsSaving(false);
    }
  };

  // Save Flats for Selected Block
  const handleSaveFlatsForBlock = async (flatsToSave: string[]) => {
    if (!selectedBlock) return;
    setFlatsSaving(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/flats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockName: selectedBlock, flats: flatsToSave }),
      });
      if (res.ok) {
        setAllBlocksFlats((prev) => ({ ...prev, [selectedBlock]: flatsToSave }));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save flats');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving flats');
    } finally {
      setFlatsSaving(false);
    }
  };

  // Quick Add Flat(s)
  const handleAddSingleOrMultiFlats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock || !singleFlatInput.trim()) return;
    const splitFlats = singleFlatInput
      .split(/[,\n]/)
      .map((f) => f.trim())
      .filter(Boolean);
    if (splitFlats.length === 0) return;
    const currentFlats = allBlocksFlats[selectedBlock] || [];
    const merged = Array.from(new Set([...currentFlats, ...splitFlats]));
    handleSaveFlatsForBlock(merged);
    setSingleFlatInput('');
  };

  // Bulk Range Generator
  const handleRunGenerator = () => {
    if (!selectedBlock) return;
    const generated: string[] = [];
    for (let floor = genStartFloor; floor <= genEndFloor; floor++) {
      for (let unit = 1; unit <= genUnitsPerFloor; unit++) {
        const unitStr = String(unit).padStart(2, '0');
        const flatNum = `${genPrefix}${floor}${unitStr}`;
        generated.push(flatNum);
      }
    }
    const currentFlats = allBlocksFlats[selectedBlock] || [];
    const merged = Array.from(new Set([...currentFlats, ...generated]));
    handleSaveFlatsForBlock(merged);
    setShowGenerator(false);
  };

  // Delete single flat
  const handleRemoveSingleFlat = (flatToRemove: string) => {
    if (!selectedBlock) return;
    const currentFlats = allBlocksFlats[selectedBlock] || [];
    const updated = currentFlats.filter((f) => f !== flatToRemove);
    handleSaveFlatsForBlock(updated);
  };

  // Clear all flats in block
  const handleClearBlockFlats = () => {
    if (!selectedBlock) return;
    if (!confirm(`Clear all flat numbers from "${selectedBlock}"?`)) return;
    handleSaveFlatsForBlock([]);
  };

  // Save Society Details
  const handleSaveSocietyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDetailsForm.name,
          city: editDetailsForm.city,
          address: editDetailsForm.address,
          pincode: editDetailsForm.pincode,
          totalUnits: Number(editDetailsForm.totalUnits) || 0,
          requiresGatePass: editDetailsForm.requiresGatePass,
          gatePasscode: editDetailsForm.gatePasscode,
          parkingFloors: editDetailsForm.parkingFloors
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean),
          isActive: editDetailsForm.isActive,
        }),
      });
      if (res.ok) {
        setIsEditDetailsModalOpen(false);
        await fetchCommunityData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update community');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating community');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleVerify = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchCommunityData();
      }
    } catch (e) {
      console.error('Failed to verify payment:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchCommunityData();
      }
    } catch (e) {
      console.error('Failed to reject payment:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    setProcessing(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCommunityData();
      }
    } catch (e) {
      console.error('Failed to delete invoice:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    setProcessing(showEditModal.id);
    try {
      const res = await fetch(`/api/invoices/${showEditModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editAmount),
          dueDate: new Date(editDueDate).getTime(),
          status: editStatus,
          billingMonth: editBillingMonth,
        }),
      });

      if (res.ok) {
        setShowEditModal(null);
        await fetchCommunityData();
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
    } finally {
      setProcessing(null);
    }
  };

  const openEditModal = (inv: Invoice) => {
    setShowEditModal(inv);
    setEditAmount(inv.amount);
    setEditStatus(inv.status);
    setEditBillingMonth(inv.billingMonth);
    const date = new Date(inv.dueDate);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setEditDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const formatBillingMonthLabel = (billingMonth: string) => {
    if (!billingMonth || billingMonth.length !== 7) return billingMonth;
    const [year, month] = billingMonth.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${months[monthIndex]} ${year}`;
  };

  function getOrdinalSuffix(i: number): string {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) return `${i}st`;
    if (j === 2 && k !== 12) return `${i}nd`;
    if (j === 3 && k !== 13) return `${i}rd`;
    return `${i}th`;
  }

  function groupFlatsByFloor(flats: string[]): { floorLabel: string; flats: string[] }[] {
    const groups: Record<string, { floorNum: number; flats: string[] }> = {};

    for (const flat of flats) {
      const trimmed = flat.trim();
      if (!trimmed) continue;

      if (/^G/i.test(trimmed)) {
        if (!groups['Ground Floor']) {
          groups['Ground Floor'] = { floorNum: 0, flats: [] };
        }
        groups['Ground Floor'].flats.push(trimmed);
        continue;
      }

      const digitsMatch = trimmed.match(/\d+/);
      if (!digitsMatch) {
        if (!groups['Other']) {
          groups['Other'] = { floorNum: 9999, flats: [] };
        }
        groups['Other'].flats.push(trimmed);
        continue;
      }

      const numStr = digitsMatch[0];
      let floorNum = 1;
      if (numStr.length >= 3) {
        floorNum = parseInt(numStr.slice(0, numStr.length - 2), 10);
      } else {
        floorNum = 1;
      }

      const label = `${getOrdinalSuffix(floorNum)} Floor`;
      if (!groups[label]) {
        groups[label] = { floorNum, flats: [] };
      }
      groups[label].flats.push(trimmed);
    }

    return Object.entries(groups)
      .sort((a, b) => a[1].floorNum - b[1].floorNum)
      .map(([floorLabel, data]) => ({
        floorLabel,
        flats: data.flats.sort((x, y) => {
          const numX = parseInt(x.replace(/\D/g, ''), 10) || 0;
          const numY = parseInt(y.replace(/\D/g, ''), 10) || 0;
          return numX !== numY ? numX - numY : x.localeCompare(y);
        }),
      }));
  }

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'blocks_flats', label: 'Blocks & Flats', icon: Layers },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'bookings', label: 'Bookings', icon: FileText },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'invoices', label: 'Invoices', icon: Receipt },
  ];

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
        { label: 'Active Bookings', value: stats.activeBookings, icon: FileText, color: 'bg-green-500' },
        { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'bg-amber-500' },
        { label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'bg-purple-500' },
      ]
    : [];

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.phoneNumber?.includes(search) ||
      u.email?.toLowerCase().includes(s) ||
      u.block?.toLowerCase().includes(s)
    );
  });

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.userName?.toLowerCase().includes(s) ||
      b.userPhone?.includes(search) ||
      b.status?.toLowerCase().includes(s)
    );
  });

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(s) ||
      p.userPhone?.includes(search) ||
      p.upiTransactionId?.toLowerCase().includes(s) ||
      p.status?.toLowerCase().includes(s)
    );
  });

  const filteredInvoices = invoices.filter((i) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      i.userName?.toLowerCase().includes(s) ||
      i.userPhone?.includes(search) ||
      i.invoiceNumber?.toLowerCase().includes(s) ||
      i.status?.toLowerCase().includes(s)
    );
  });

  const getInvoiceStatusBadge = (status: Invoice['status']) => {
    const styles: Record<Invoice['status'], string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      pending_verification: 'bg-amber-100 text-amber-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <CommunityDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/communities')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {stats?.communityName || community?.name || 'Community'}
              </h1>
              <Badge variant={community?.isActive !== false ? 'default' : 'secondary'}>
                {community?.isActive !== false ? 'Active' : 'Inactive'}
              </Badge>
              {community?.requiresGatePass && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  <Shield className="w-3 h-3" /> Gate Pass Required
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {community?.address ? `${community.address}, ` : ''}{stats?.city || community?.city || 'N/A'}{community?.pincode ? ` - ${community.pincode}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditDetailsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
            Edit Society Details
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Blocks & Flats Summary Banner */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-green-950 flex items-center gap-2 text-base">
                <Layers className="w-5 h-5 text-green-600" />
                Blocks & Flat Layout Configuration
              </h3>
              <p className="text-sm text-green-800 mt-1">
                {stats?.blocks?.length || 0} blocks configured across this society. Manage block-wise flat numbers, generate floor ranges, or edit society unit details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('blocks_flats')}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition shadow-sm shrink-0"
            >
              <Layers className="w-4 h-4" />
              Manage Blocks & Flats
            </button>
          </div>

          {/* Blocks */}
          {stats?.blocks && stats.blocks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Configured Blocks</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('blocks_flats')}
                  className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
                >
                  Manage flats <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.blocks.map((block) => (
                  <span
                    key={block}
                    onClick={() => {
                      setSelectedBlock(block);
                      setActiveTab('blocks_flats');
                    }}
                    className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 text-sm font-medium rounded-lg border border-green-200 cursor-pointer transition flex items-center gap-1.5"
                  >
                    <span>{block}</span>
                    {allBlocksFlats[block] && (
                      <span className="text-[11px] bg-white px-1.5 py-0.5 rounded-full text-green-700 font-semibold border border-green-200">
                        {allBlocksFlats[block].length} flats
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Info & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Society Metadata</h3>
                <button
                  type="button"
                  onClick={() => setIsEditDetailsModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="font-medium text-gray-900">{stats?.city || community?.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">PIN Code</p>
                  <p className="font-medium text-gray-900">{community?.pincode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Units</p>
                  <p className="font-medium text-gray-900">{community?.totalUnits || stats?.totalUnits || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registered Users</p>
                  <p className="font-medium text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Street Address</p>
                  <p className="font-medium text-gray-900">{community?.address || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Security & Parking Setup</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Gate Pass Required</p>
                      <p className="text-[11px] text-gray-500">Cleaners need gate approval passcode</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${community?.requiresGatePass ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                    {community?.requiresGatePass ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {community?.requiresGatePass && (
                  <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2.5">
                      <Key className="w-4 h-4 text-purple-700" />
                      <div>
                        <p className="text-xs font-semibold text-purple-900">Cleaner Passcode</p>
                        <p className="text-[11px] text-purple-700">Shown to verified cleaners upon check-in</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-purple-900 bg-white px-2.5 py-1 rounded border border-purple-200">
                      {community?.gatePasscode || 'None set'}
                    </span>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-800 mb-1">Configured Parking Levels</p>
                  {community?.parkingFloors && community.parkingFloors.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {community.parkingFloors.map((floor: string) => (
                        <span key={floor} className="px-2 py-0.5 bg-white text-gray-700 border border-gray-200 rounded text-xs font-medium">
                          {floor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No specific parking floors configured (standard parking)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Blocks & Flats Manager */}
      {activeTab === 'blocks_flats' && (
        <div className="space-y-6">
          {/* Overview / Header info bar */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-green-600" />
                Blocks & Per-Block Flats Manager
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure towers, wings, and flat numbers. Changes immediately sync to resident address selection in Android and iOS apps.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchFlats}
                disabled={flatsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                title="Refresh Flats"
              >
                <RefreshCw className={`w-4 h-4 ${flatsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Blocks List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    Blocks / Towers
                  </h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                    {Object.keys(allBlocksFlats).length} total
                  </span>
                </div>

                {/* Add new block form */}
                <form onSubmit={handleAddBlock} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="e.g. Block A or Tower 1"
                    value={newBlockInput}
                    onChange={(e) => setNewBlockInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={flatsSaving || !newBlockInput.trim()}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </form>

                {/* Block items list */}
                {flatsLoading ? (
                  <ListSkeleton rows={4} />
                ) : Object.keys(allBlocksFlats).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No blocks added yet. Create your first block above.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                    {Object.keys(allBlocksFlats).map((block) => {
                      const isSelected = selectedBlock === block;
                      const flatCount = allBlocksFlats[block]?.length || 0;
                      return (
                        <div
                          key={block}
                          onClick={() => setSelectedBlock(block)}
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${
                            isSelected
                              ? 'bg-green-50 border-green-300 text-green-900 shadow-sm'
                              : 'bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-green-600' : 'bg-gray-300'}`} />
                            <span className="font-semibold text-sm truncate">{block}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isSelected
                                  ? 'bg-green-200/70 text-green-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {flatCount} {flatCount === 1 ? 'flat' : 'flats'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBlock(block);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 rounded transition"
                              title={`Delete ${block}`}
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
            </div>

            {/* Right Column: Flats Workspace */}
            <div className="lg:col-span-8 space-y-4">
              {!selectedBlock ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-700">No Block Selected</p>
                  <p className="text-sm text-gray-400 mt-1">Select a block on the left or create a new block to manage its flats.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
                  {/* Block Header Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900">{selectedBlock}</h3>
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                          {allBlocksFlats[selectedBlock]?.length || 0} Flats
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Manage all flat and unit numbers belonging to {selectedBlock}.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowGenerator(!showGenerator)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          showGenerator
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        {showGenerator ? 'Close Generator' : '⚡ Bulk Range Generator'}
                      </button>

                      {(allBlocksFlats[selectedBlock]?.length || 0) > 0 && (
                        <button
                          type="button"
                          onClick={handleClearBlockFlats}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition"
                          title="Remove all flats in this block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Bulk Range Generator Card */}
                  {showGenerator && (
                    <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-xl border border-amber-200/80 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            Bulk Floor Range Generator
                          </h4>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Quickly generate flats across floors (e.g. Floors 1 to 14, 4 units/floor generates 101 to 104, 201 to 204, up to 1401 to 1404).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowGenerator(false)}
                          className="text-amber-500 hover:text-amber-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Prefix (Optional)</label>
                          <input
                            type="text"
                            value={genPrefix}
                            onChange={(e) => setGenPrefix(e.target.value)}
                            placeholder="e.g. A-"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Start Floor</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={genStartFloor}
                            onChange={(e) => setGenStartFloor(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">End Floor</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={genEndFloor}
                            onChange={(e) => setGenEndFloor(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Flats per Floor</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={genUnitsPerFloor}
                            onChange={(e) => setGenUnitsPerFloor(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                        <div className="text-xs text-amber-800">
                          Total to generate:{' '}
                          <span className="font-bold">
                            {Math.max(0, genEndFloor - genStartFloor + 1) * Math.max(0, genUnitsPerFloor)}
                          </span>{' '}
                          flats (from {genPrefix}{genStartFloor}01 to {genPrefix}{genEndFloor}{String(genUnitsPerFloor).padStart(2, '0')})
                        </div>
                        <button
                          type="button"
                          onClick={handleRunGenerator}
                          disabled={flatsSaving || genEndFloor < genStartFloor || genUnitsPerFloor < 1}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                        >
                          {flatsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Generate & Add Flats
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Single / Comma Flat Adder */}
                  <form onSubmit={handleAddSingleOrMultiFlats} className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Add flat numbers (e.g. 101, 102, 103 or comma-separated)..."
                        value={singleFlatInput}
                        onChange={(e) => setSingleFlatInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={flatsSaving || !singleFlatInput.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition disabled:opacity-50 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Add Flat(s)
                    </button>
                  </form>

                  {/* Flat Search Filter */}
                  {(allBlocksFlats[selectedBlock]?.length || 0) > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={`Filter flats in ${selectedBlock}...`}
                          value={flatSearch}
                          onChange={(e) => setFlatSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      {flatsSaving && (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving changes...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Flats Listing (Grouped by Floor) */}
                  {(() => {
                    const currentFlats = allBlocksFlats[selectedBlock] || [];
                    const filtered = flatSearch
                      ? currentFlats.filter((f) => f.toLowerCase().includes(flatSearch.toLowerCase()))
                      : currentFlats;

                    if (currentFlats.length === 0) {
                      return (
                        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                          <p className="text-sm font-medium text-gray-600">No flats in {selectedBlock} yet</p>
                          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            Use the Bulk Range Generator above to add all flats automatically, or type flat numbers into the input box.
                          </p>
                        </div>
                      );
                    }

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-400 text-xs">
                          No flats match "{flatSearch}".
                        </div>
                      );
                    }

                    const grouped = groupFlatsByFloor(filtered);

                    return (
                      <div className="space-y-5 max-h-[650px] overflow-y-auto pr-2">
                        {grouped.map((group) => (
                          <div key={group.floorLabel} className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                {group.floorLabel}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-400">
                                {group.flats.length} {group.flats.length === 1 ? 'unit' : 'units'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.flats.map((flat) => (
                                <span
                                  key={flat}
                                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 shadow-sm hover:border-gray-300 transition group"
                                >
                                  <span>{flat}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSingleFlat(flat)}
                                    className="text-gray-400 hover:text-red-500 rounded p-0.5 transition"
                                    title={`Remove flat ${flat}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, phone, email, or block..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {tabLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Block / Flat</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicles</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{user.phoneNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {user.block} {user.flatNumber ? `- ${user.flatNumber}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{user.vehicles?.length || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          {user.paymentFlags?.accountRestricted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              <Ban className="w-3 h-3" />
                              Restricted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings by user name, phone, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {tabLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Community</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{booking.userName}</p>
                          <p className="text-xs text-gray-500">{booking.userPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {booking.community || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {booking.vehicleNumber || booking.vehicleName || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{booking.serviceName || booking.planName || booking.plan || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'suspended'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {booking.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {booking.startDate ? formatDateTime(booking.startDate) : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments by user name, phone, or transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {payments.some((p) => p.duplicate) && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Duplicate transaction IDs detected. Please verify these payments carefully.
              </p>
            </div>
          )}

          {tabLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payments found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">UPI App</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={`hover:bg-gray-50 transition ${
                          payment.duplicate ? 'bg-amber-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{payment.userName}</p>
                          <p className="text-xs text-gray-500">{payment.userPhone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 capitalize">
                            {payment.upiAppName || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.upiTransactionId || 'N/A'}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          {payment.adminVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : payment.status === 'pending_manual_verify' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              <XCircle className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">
                            {timeAgo(payment.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!payment.adminVerified &&
                            payment.status === 'pending_manual_verify' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleVerify(payment.id)}
                                  disabled={processing === payment.id}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                  title="Verify payment"
                                >
                                  {processing === payment.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleReject(payment.id)}
                                  disabled={processing === payment.id}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                  title="Reject payment"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices by user name, phone, or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {tabLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No invoices found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle & Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Billing Month</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-800 text-sm">
                            {inv.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{inv.userName}</p>
                          <p className="text-xs text-gray-500">{inv.userPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <p className="font-medium">{inv.serviceName}</p>
                          <p className="text-xs text-gray-500">{inv.vehicleReg}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatBillingMonthLabel(inv.billingMonth)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(inv.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDateTime(inv.dueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getInvoiceStatusBadge(inv.status)}`}>
                            {inv.status === 'pending_verification' ? 'Pending Verif.' : inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(inv)}
                              disabled={processing === inv.id}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit invoice"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              disabled={processing === inv.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateInvoice} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Invoice {showEditModal.invoiceNumber}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Billing Month</label>
                <input
                  type="month"
                  value={editBillingMonth}
                  onChange={(e) => setEditBillingMonth(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Amount (INR)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Invoice['status'])}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing === showEditModal.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {processing === showEditModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Society Details Modal */}
      {isEditDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Society Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update community metadata, security settings, and parking setup.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditDetailsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSocietyDetails} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Society Name</label>
                  <input
                    type="text"
                    value={editDetailsForm.name}
                    onChange={(e) => setEditDetailsForm({ ...editDetailsForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={editDetailsForm.city}
                    onChange={(e) => setEditDetailsForm({ ...editDetailsForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Street Address</label>
                <input
                  type="text"
                  value={editDetailsForm.address}
                  onChange={(e) => setEditDetailsForm({ ...editDetailsForm, address: e.target.value })}
                  placeholder="e.g. Near Outer Ring Road, Bellandur"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={editDetailsForm.pincode}
                    onChange={(e) => setEditDetailsForm({ ...editDetailsForm, pincode: e.target.value })}
                    placeholder="e.g. 560103"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Total Units</label>
                  <input
                    type="number"
                    value={editDetailsForm.totalUnits}
                    onChange={(e) => setEditDetailsForm({ ...editDetailsForm, totalUnits: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Requires Gate Pass
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">Prompt cleaning staff for gate verification passcode.</p>
                  </div>
                  <Switch
                    checked={editDetailsForm.requiresGatePass}
                    onCheckedChange={(checked) => setEditDetailsForm({ ...editDetailsForm, requiresGatePass: checked })}
                  />
                </div>

                {editDetailsForm.requiresGatePass && (
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-gray-500" />
                      Cleaner Gate Passcode
                    </label>
                    <input
                      type="text"
                      value={editDetailsForm.gatePasscode}
                      onChange={(e) => setEditDetailsForm({ ...editDetailsForm, gatePasscode: e.target.value })}
                      placeholder="e.g. 9921# or 4402"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Parking Floors (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={editDetailsForm.parkingFloors}
                  onChange={(e) => setEditDetailsForm({ ...editDetailsForm, parkingFloors: e.target.value })}
                  placeholder="e.g. B1, B2, Ground Floor, Stilt"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Available parking levels shown to residents when selecting their bay.</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-sm font-semibold text-gray-800">Community Status</span>
                  <p className="text-xs text-gray-500">Active communities appear in the mobile app directory.</p>
                </div>
                <Switch
                  checked={editDetailsForm.isActive}
                  onCheckedChange={(checked) => setEditDetailsForm({ ...editDetailsForm, isActive: checked })}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditDetailsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition disabled:opacity-50 shadow-sm"
                >
                  {savingDetails && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
