import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import {
  HiOutlineUsers, HiOutlineBuildingStorefront, HiOutlineCalendar,
  HiOutlineCheck, HiOutlineXMark, HiOutlineShieldCheck, HiOutlineArrowPath,
} from 'react-icons/hi2';

const statusVariant = {
  approved: 'active',
  pending: 'pending',
  rejected: 'cancelled',
};

export default function AdminPage() {
  const [tab, setTab] = useState('businesses');
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      adminAPI.getBusinesses(),
      adminAPI.getUsers(),
      adminAPI.getReports(),
    ]).then(([b, u, r]) => {
      setBusinesses(b.value?.data?.businesses || []);
      setUsers(u.value?.data?.users || []);
      setReports(r.value?.data?.reports || null);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleApproval = async (id, status) => {
    setBusyId(id);
    try {
      await adminAPI.setApproval(id, status);
      await loadAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update approval');
    }
    setBusyId(null);
  };

  const stats = [
    { label: 'Total Users', value: reports?.totalUsers ?? users.length, icon: HiOutlineUsers, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' },
    { label: 'Businesses', value: reports?.totalBusinesses ?? businesses.length, icon: HiOutlineBuildingStorefront, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
    { label: 'Pending Review', value: businesses.filter(b => b.approvalStatus === 'pending').length, icon: HiOutlineShieldCheck, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' },
    { label: 'Appointments', value: reports?.totalAppointments ?? 0, icon: HiOutlineCalendar, color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10' },
  ];

  const pendingCount = businesses.filter(b => b.approvalStatus === 'pending').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Review and approve businesses to keep the platform safe.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{s.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-5 py-4 mb-6">
          <HiOutlineShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            {pendingCount} business{pendingCount > 1 ? 'es' : ''} waiting for approval. Review below to make them visible to customers.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex gap-2">
            {[
              { id: 'businesses', label: `Businesses${pendingCount ? ` (${pendingCount})` : ''}` },
              { id: 'users', label: 'Users' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.id ? 'gradient-primary text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={loadAll} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors">
            <HiOutlineArrowPath className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : tab === 'businesses' ? (
            businesses.length === 0 ? (
              <div className="text-center py-16">
                <HiOutlineBuildingStorefront className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No businesses registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      {['Business', 'Category', 'Owner', 'Status', 'Actions'].map(h => (
                        <th key={h} className={`text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 pb-3 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => (
                      <tr key={b._id} className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {b.name?.charAt(0)?.toUpperCase() || 'B'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">{b.name}</p>
                              <p className="text-[11px] text-zinc-400">{b.address || 'No address'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-sm text-zinc-500 dark:text-zinc-400 capitalize">{b.category || '—'}</td>
                        <td className="py-3.5">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{b.owner?.name || 'Unknown'}</p>
                          <p className="text-[11px] text-zinc-400">{b.owner?.email || ''}</p>
                        </td>
                        <td className="py-3.5">
                          <Badge variant={statusVariant[b.approvalStatus] || 'default'}>{b.approvalStatus || 'unknown'}</Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          {b.approvalStatus !== 'approved' ? (
                            <button onClick={() => handleApproval(b._id, 'approved')} disabled={busyId === b._id}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50 inline-flex items-center gap-1">
                              <HiOutlineCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                          ) : null}
                          {b.approvalStatus !== 'rejected' && (
                            <button onClick={() => handleApproval(b._id, 'rejected')} disabled={busyId === b._id}
                              className="ml-2 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 inline-flex items-center gap-1">
                              <HiOutlineXMark className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                          {b.approvalStatus === 'approved' && b.approvalStatus !== 'rejected' && (
                            <span className="text-[11px] text-zinc-400 ml-2">Visible to customers</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    {['Name', 'Email', 'Role', 'Status'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 pb-3 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                      <td className="py-3.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{u.name}</td>
                      <td className="py-3.5 text-sm text-zinc-500 dark:text-zinc-400">{u.email}</td>
                      <td className="py-3.5"><Badge variant={u.role === 'admin' ? 'confirmed' : u.role === 'business' ? 'waiting' : 'pending'}>{u.role}</Badge></td>
                      <td className="py-3.5"><Badge variant={u.isActive ? 'active' : 'cancelled'}>{u.isActive ? 'active' : 'inactive'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
