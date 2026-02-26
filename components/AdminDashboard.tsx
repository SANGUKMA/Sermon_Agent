
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Search, Users, Shield, ShieldOff, Trash2,
  Loader2, RefreshCw, UserCheck, UserX
} from 'lucide-react';
import {
  fetchAllUserProfiles,
  toggleUserActive,
  deleteUserProfile,
  UserProfile
} from '../services/supabaseClient';
import { ADMIN_EMAIL } from '../constants';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const profiles = await fetchAllUserProfiles();
    setUsers(profiles);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    // 관리자 자신은 비활성화 불가
    const targetUser = users.find(u => u.user_id === userId);
    if (targetUser?.email === ADMIN_EMAIL) {
      alert('관리자 자신은 비활성화할 수 없습니다.');
      return;
    }

    const action = currentActive ? '비활성화' : '활성화';
    if (!confirm(`이 사용자를 ${action}하시겠습니까?`)) return;

    setActionLoading(userId);
    const success = await toggleUserActive(userId, !currentActive);
    if (success) {
      setUsers(users.map(u =>
        u.user_id === userId ? { ...u, is_active: !currentActive } : u
      ));
    } else {
      alert(`${action} 실패. 다시 시도해주세요.`);
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string) => {
    const targetUser = users.find(u => u.user_id === userId);
    if (targetUser?.email === ADMIN_EMAIL) {
      alert('관리자 자신은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm('이 사용자 프로필을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setActionLoading(userId);
    const success = await deleteUserProfile(userId);
    if (success) {
      setUsers(users.filter(u => u.user_id !== userId));
    } else {
      alert('삭제 실패. 다시 시도해주세요.');
    }
    setActionLoading(null);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && u.is_active) ||
      (filterStatus === 'inactive' && !u.is_active);
    return matchesSearch && matchesFilter;
  });

  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const formatLastSignIn = (timestamp: number | null) => {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> 대시보드로 돌아가기
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} className="text-crimson" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-serif">
              관리자 대시보드
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            전체 사용자 목록을 조회하고 계정을 관리합니다.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Users size={14} /> 전체
            </div>
            <p className="text-2xl font-black text-slate-900">{users.length}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-sm p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-1">
              <UserCheck size={14} /> 활성
            </div>
            <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-sm p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest mb-1">
              <UserX size={14} /> 비활성
            </div>
            <p className="text-2xl font-black text-red-500">{inactiveCount}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="이메일 또는 이름으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-sm text-sm focus:ring-1 focus:ring-crimson focus:border-crimson outline-none bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-slate-300 rounded-sm px-3 py-2.5 text-sm bg-white text-slate-700 shadow-sm outline-none focus:ring-1 focus:ring-crimson"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성만</option>
              <option value="inactive">비활성만</option>
            </select>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="bg-white border border-slate-300 px-3 py-2.5 rounded-sm shadow-sm hover:bg-slate-50 transition-colors"
              title="새로고침"
            >
              <RefreshCw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-sm border border-slate-200 border-dashed">
            <Users size={32} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-serif">
              {searchQuery || filterStatus !== 'all'
                ? '검색 조건에 맞는 사용자가 없습니다.'
                : '등록된 사용자가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-widest">
                      이메일
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-widest">
                      이름
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-widest">
                      가입일
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-widest">
                      마지막 접속
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-widest">
                      상태
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-xs text-slate-500 uppercase tracking-widest">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isAdmin = user.email === ADMIN_EMAIL;
                    const isProcessing = actionLoading === user.user_id;

                    return (
                      <tr
                        key={user.user_id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          !user.is_active ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">{user.email}</span>
                            {isAdmin && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-crimson/10 text-crimson rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {user.full_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {formatLastSignIn(user.last_sign_in)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                              user.is_active
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-red-50 text-red-500'
                            }`}
                          >
                            {user.is_active ? (
                              <>
                                <UserCheck size={10} /> 활성
                              </>
                            ) : (
                              <>
                                <UserX size={10} /> 비활성
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {isProcessing ? (
                              <Loader2 size={14} className="animate-spin text-slate-400" />
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    handleToggleActive(user.user_id, user.is_active)
                                  }
                                  disabled={isAdmin}
                                  className={`p-1.5 rounded transition-colors ${
                                    isAdmin
                                      ? 'text-slate-200 cursor-not-allowed'
                                      : user.is_active
                                      ? 'text-amber-500 hover:bg-amber-50'
                                      : 'text-emerald-500 hover:bg-emerald-50'
                                  }`}
                                  title={
                                    isAdmin
                                      ? '관리자'
                                      : user.is_active
                                      ? '비활성화'
                                      : '활성화'
                                  }
                                >
                                  {user.is_active ? (
                                    <ShieldOff size={14} />
                                  ) : (
                                    <Shield size={14} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(user.user_id)}
                                  disabled={isAdmin}
                                  className={`p-1.5 rounded transition-colors ${
                                    isAdmin
                                      ? 'text-slate-200 cursor-not-allowed'
                                      : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                                  }`}
                                  title={isAdmin ? '관리자' : '삭제'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
