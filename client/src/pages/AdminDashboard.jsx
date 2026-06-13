import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  FileText,
  AlertOctagon,
  TrendingUp,
  ShieldAlert,
  Loader2,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Reported content previewer modal
  const [previewContent, setPreviewContent] = useState(null); // { type, data }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      const reportsRes = await api.get('/admin/reports');

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (reportsRes.data.success) setReports(reportsRes.data.reports);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const handleResolveReport = async (reportId) => {
    setActionLoadingId(reportId);
    try {
      const res = await api.put(`/admin/reports/${reportId}`, { status: 'resolved' });
      if (res.data.success) {
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: 'resolved' } : r))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBanUser = async (offenderId, reportId) => {
    setActionLoadingId(`${reportId}-ban`);
    try {
      const res = await api.put(`/admin/users/${offenderId}/ban`);
      if (res.data.success) {
        // Toggle user banned state in local reports view
        setReports((prev) =>
          prev.map((r) => {
            if (r.reportedUser && r.reportedUser._id === offenderId) {
              return {
                ...r,
                reportedUser: { ...r.reportedUser, isBanned: res.data.isBanned },
              };
            }
            // If post owner is banned
            if (r.reportedPost && r.reportedPost.user === offenderId) {
              return r;
            }
            return r;
          })
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteContent = async (contentType, contentId, reportId) => {
    setActionLoadingId(`${reportId}-delete`);
    try {
      const res = await api.delete('/admin/content', {
        data: { contentType, contentId },
      });

      if (res.data.success) {
        // Resolve report locally and clear content reference
        setReports((prev) =>
          prev.map((r) => {
            if (r._id === reportId) {
              return {
                ...r,
                status: 'resolved',
                reportedPost: contentType === 'post' ? null : r.reportedPost,
                reportedComment: contentType === 'comment' ? null : r.reportedComment,
                reportedReel: contentType === 'reel' ? null : r.reportedReel,
              };
            }
            return r;
          })
        );
        // Reload stats
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data.success) setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-20 text-center border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard p-8 space-y-4 shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full border-2 border-instagram-red flex items-center justify-center text-instagram-red">
          <ShieldAlert size={22} />
        </div>
        <h3 className="font-extrabold text-sm text-neutral-800 dark:text-white">Access Denied</h3>
        <p className="text-xs text-neutral-400 mt-1">You must have administrator privileges to view this page.</p>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-neutral-800 dark:text-white">Admin Dashboard</h2>
        <p className="text-xs text-neutral-400">Moderate users, view reports, and monitor system analytics.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-2xl font-extrabold text-neutral-800 dark:text-white block">
              {stats.totalUsers.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-instagram-blue/10 text-instagram-blue rounded-xl">
            <Users size={20} />
          </div>
        </div>

        {/* Total Posts */}
        <div className="border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Posts</span>
            <span className="text-2xl font-extrabold text-neutral-800 dark:text-white block">
              {stats.totalPosts.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <FileText size={20} />
          </div>
        </div>

        {/* Open Reports */}
        <div className="border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Open Reports</span>
            <span className="text-2xl font-extrabold text-neutral-800 dark:text-white block">
              {stats.openReports.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-instagram-red/10 text-instagram-red rounded-xl">
            <AlertOctagon size={20} />
          </div>
        </div>

        {/* Growth speed */}
        <div className="border border-premium-lightBorder dark:border-premium-darkBorder rounded-2xl bg-white dark:bg-premium-darkCard p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">User Growth</span>
            <span className="text-2xl font-extrabold text-neutral-800 dark:text-white block">
              +{stats.userGrowth}%
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Moderation Reports Table Grid */}
      <div className="border border-premium-lightBorder dark:border-premium-darkBorder bg-white dark:bg-premium-darkCard rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-premium-lightBorder dark:border-premium-darkBorder">
          <h3 className="font-extrabold text-sm text-neutral-800 dark:text-white">Active Moderation Queue</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-neutral-50 dark:bg-premium-darkBg border-b border-premium-lightBorder dark:border-premium-darkBorder text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Reporter</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Targets</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-premium-darkBorder/40">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-neutral-50/50 dark:hover:bg-premium-darkBg/20 transition">
                  {/* Reporter */}
                  <td className="p-4 font-semibold text-neutral-800 dark:text-neutral-200">
                    @{report.reporter?.username || 'Unknown'}
                  </td>

                  {/* Reason */}
                  <td className="p-4 text-neutral-500 max-w-xs truncate">
                    {report.reason}
                  </td>

                  {/* Targets */}
                  <td className="p-4">
                    {report.reportedPost && (
                      <button
                        onClick={() => setPreviewContent({ type: 'post', data: report.reportedPost })}
                        className="px-2 py-1 bg-instagram-blue/10 text-instagram-blue font-bold rounded-lg hover:underline flex items-center space-x-1"
                      >
                        <Eye size={12} />
                        <span>View Post</span>
                      </button>
                    )}
                    {report.reportedComment && (
                      <span className="text-neutral-500 italic truncate max-w-xs block">
                        Comment: "{report.reportedComment.content}"
                      </span>
                    )}
                    {report.reportedUser && (
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        User: @{report.reportedUser.username}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        report.status === 'resolved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/45 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/45 dark:text-yellow-400'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="p-4 flex justify-center space-x-2 items-center">
                    {report.status !== 'resolved' && (
                      <>
                        {/* Resolve */}
                        <button
                          onClick={() => handleResolveReport(report._id)}
                          disabled={actionLoadingId === report._id}
                          className="p-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg transition"
                          title="Mark Resolved"
                        >
                          <CheckCircle size={15} />
                        </button>

                        {/* Ban Offender */}
                        {report.reportedUser && (
                          <button
                            onClick={() => handleToggleBanUser(report.reportedUser._id, report._id)}
                            disabled={actionLoadingId === `${report._id}-ban`}
                            className={`p-1.5 rounded-lg transition ${
                              report.reportedUser.isBanned
                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            }`}
                            title={report.reportedUser.isBanned ? 'Unban User' : 'Ban User'}
                          >
                            <Ban size={15} />
                          </button>
                        )}

                        {/* Delete content */}
                        {report.reportedPost && (
                          <button
                            onClick={() => handleDeleteContent('post', report.reportedPost._id, report._id)}
                            disabled={actionLoadingId === `${report._id}-delete`}
                            className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition"
                            title="Delete Post"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-400 text-sm">
                    No moderation reports filed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Content Modal */}
      <Modal isOpen={previewContent !== null} onClose={() => setPreviewContent(null)} title="Content Preview">
        {previewContent && previewContent.type === 'post' && (
          <div className="space-y-4">
            <div className="aspect-square bg-neutral-900 rounded-xl overflow-hidden">
              <img src={previewContent.data.media[0]?.url} alt="preview content" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Owner ID: {previewContent.data.user}
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default AdminDashboard;
