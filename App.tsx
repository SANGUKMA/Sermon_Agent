
import React, { useState, useEffect } from 'react';
import { SermonProject, SermonSeries, TheologicalProfile, SAMPLE_PROJECT, DEFAULT_PROFILE, CustomPrompt, AVAILABLE_COLOR_SETS } from './types';
import { Dashboard } from './components/Dashboard';
import { ProjectEditor } from './components/ProjectEditor';
import { BlankPage } from './components/BlankPage';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { v4 as uuidv4 } from 'uuid';
import { storageManager, mergeLocalToCloud } from './services/storage';
import { supabase, signOut, upsertUserProfile, checkUserActive } from './services/supabaseClient';
import { ADMIN_EMAIL } from './constants';
import { AdminDashboard } from './components/AdminDashboard';
import { PricingModal } from './components/PricingModal';
import type { Session } from '@supabase/supabase-js';
import { fetchSubscriptionState, processPayment, type SubscriptionState } from './services/subscriptionService';
import { updateCachedState } from './services/aiGateway';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Data State
  const [projects, setProjects] = useState<SermonProject[]>([]);
  const [series, setSeries] = useState<SermonSeries[]>([]);
  const [profile, setProfile] = useState<TheologicalProfile>(DEFAULT_PROFILE);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<string>('crimson');

  const [currentProject, setCurrentProject] = useState<SermonProject | null>(null);
  const [view, setView] = useState<'dashboard' | 'editor' | 'blank' | 'admin'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Subscription State
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [billingProcessing, setBillingProcessing] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<'pro' | 'church' | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        handleAuthLogin(session);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setSession(session);
        } else {
          setSession(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Apply Theme CSS Variables
  useEffect(() => {
    const theme = AVAILABLE_COLOR_SETS.find(t => t.id === currentThemeId) || AVAILABLE_COLOR_SETS[0];
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--color-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);

    // Save preference
    localStorage.setItem('ps_theme_pref', currentThemeId);
  }, [currentThemeId]);

  // Handle login: init local, switch to supabase, merge, load from cloud
  const handleAuthLogin = async (loginSession: Session) => {
    setIsSyncing(true);
    setLoading(true);
    try {
      const userId = loginSession.user.id;
      const userEmail = loginSession.user.email || '';
      const fullName = loginSession.user.user_metadata?.full_name || '';

      // 0. Upsert user profile & check if active
      await upsertUserProfile(userId, userEmail, fullName);
      const active = await checkUserActive(userId);
      if (!active) {
        alert('계정이 비활성화되었습니다. 관리자에게 문의하세요.');
        await signOut();
        setSession(null);
        setIsSyncing(false);
        setAuthLoading(false);
        setLoading(false);
        return;
      }

      // Set admin status
      setIsAdmin(userEmail === ADMIN_EMAIL);

      // 1. Initialize local IndexedDB first
      await storageManager.initialize();

      // 2. Switch to Supabase adapter
      const cloudAdapter = await storageManager.switchToSupabase(userId);

      // 3. Merge local data → cloud (lastModified conflict resolution)
      const localAdapter = storageManager.getLocalAdapter();
      await mergeLocalToCloud(localAdapter, cloudAdapter);

      // 4. Load everything from cloud
      await loadAllData();

      // 5. 구독 상태 로드
      const subState = await fetchSubscriptionState();
      setSubscriptionState(subState);
      updateCachedState(subState);

      // 6. 빌링 콜백 처리 (토스 리다이렉트)
      const urlParams = new URLSearchParams(window.location.search);
      const authKey = urlParams.get('authKey');
      const customerKey = urlParams.get('customerKey');
      const savedPlan = sessionStorage.getItem('pending_plan') as 'pro' | 'church' | null;
      if (authKey && customerKey && savedPlan) {
        setBillingProcessing(true);
        try {
          const result = await processPayment(authKey, customerKey, savedPlan);
          if (result.success) {
            const refreshed = await fetchSubscriptionState();
            setSubscriptionState(refreshed);
            updateCachedState(refreshed);
            alert(`${savedPlan === 'pro' ? '프로' : '교회'} 플랜 결제가 완료되었습니다!`);
          } else {
            alert(`결제 실패: ${result.error}`);
          }
        } catch (e: any) {
          alert(`결제 처리 오류: ${e.message}`);
        } finally {
          setBillingProcessing(false);
          sessionStorage.removeItem('pending_plan');
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
      // Fallback to local
      storageManager.switchToLocal();
      await loadAllData();
    } finally {
      setIsSyncing(false);
      setAuthLoading(false);
      setLoading(false);
    }
  };

  // Handle offline skip
  const handleSkipLogin = async () => {
    setIsOfflineMode(true);
    setAuthLoading(false);
    await initializeAndLoad();
  };

  // Handle Login from Login component
  const handleLogin = (loginSession: Session) => {
    setSession(loginSession);
    handleAuthLogin(loginSession);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setSession(null);
    storageManager.switchToLocal();
    setProjects([]);
    setSeries([]);
    setProfile(DEFAULT_PROFILE);
    setCustomPrompts([]);
    setCurrentProject(null);
    setView('dashboard');
    setIsOfflineMode(false);
    setShowLogin(false);
    setIsSignUpMode(false);
    setAuthLoading(false);
  };

  // Load all data from current adapter
  const loadAllData = async () => {
    try {
      const [projData, seriesData, profileData, promptsData] = await Promise.all([
        storageManager.getAdapter().loadProjects(),
        storageManager.getAdapter().loadSeries(),
        storageManager.getAdapter().loadProfile(),
        storageManager.getAdapter().loadCustomPrompts()
      ]);

      setProjects(projData);
      setSeries(seriesData);
      setProfile(profileData);
      setCustomPrompts(promptsData);

      // Load Theme Preference
      const savedTheme = localStorage.getItem('ps_theme_pref');
      if (savedTheme && AVAILABLE_COLOR_SETS.some(t => t.id === savedTheme)) {
        setCurrentThemeId(savedTheme);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // Initialize Storage and Load Data (for offline mode)
  const initializeAndLoad = async () => {
    setLoading(true);
    try {
      await storageManager.initialize();
      await loadAllData();
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Project Actions ---
  const handleCreateProject = async (project: SermonProject) => {
    setProjects([project, ...projects]);
    setCurrentProject(project);
    setView('editor');
    await storageManager.getAdapter().saveProject(project);
  };

  const handleUpdateProject = async (updatedProject: SermonProject) => {
    const updatedProjects = projects.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
    setCurrentProject(updatedProject);
    await storageManager.getAdapter().saveProject(updatedProject);
  };

  const handleToggleLockProject = async (id: string) => {
    const updatedProjects = projects.map(p =>
      p.id === id ? { ...p, isLocked: !p.isLocked } : p
    );
    setProjects(updatedProjects);
    const target = updatedProjects.find(p => p.id === id);
    if (target) await storageManager.getAdapter().saveProject(target);
  };

  const handleSoftDeleteProject = async (id: string) => {
    const target = projects.find(p => p.id === id);
    if (target?.isLocked) {
        alert("이 설교는 잠겨있습니다. 먼저 잠금을 해제해주세요.");
        return;
    }

    if(confirm('이 설교를 휴지통으로 이동하시겠습니까?')) {
      const updatedProjects = projects.map(p =>
        p.id === id ? { ...p, isDeleted: true, deletedAt: Date.now() } : p
      );
      setProjects(updatedProjects);
      const target = updatedProjects.find(p => p.id === id);
      if (target) await storageManager.getAdapter().saveProject(target);
    }
  };

  const handleRestoreProject = async (id: string) => {
    const updatedProjects = projects.map(p =>
      p.id === id ? { ...p, isDeleted: false, deletedAt: undefined } : p
    );
    setProjects(updatedProjects);
    const target = updatedProjects.find(p => p.id === id);
    if (target) await storageManager.getAdapter().saveProject(target);
    alert("설교가 복구되었습니다.");
  };

  const handleHardDeleteProject = async (id: string) => {
    if(confirm('이 설교를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setProjects(projects.filter(p => p.id !== id));
      await storageManager.getAdapter().deleteProject(id);
    }
  };

  // --- Series Actions ---
  const handleCreateSeries = async (newSeries: SermonSeries) => {
      setSeries([newSeries, ...series]);
      await storageManager.getAdapter().saveSeries(newSeries);
  };

  const handleDeleteSeries = async (id: string) => {
      if(confirm("Delete this series? Projects attached to it will not be deleted.")) {
        setSeries(series.filter(s => s.id !== id));
        await storageManager.getAdapter().deleteSeries(id);
      }
  };

  // --- Profile Actions ---
  const handleUpdateProfile = async (newProfile: TheologicalProfile) => {
      setProfile(newProfile);
      await storageManager.getAdapter().saveProfile(newProfile);
  };

  // --- Custom Prompt Actions ---
  const handleCreateCustomPrompt = async (prompt: CustomPrompt) => {
      setCustomPrompts([prompt, ...customPrompts]);
      await storageManager.getAdapter().saveCustomPrompt(prompt);
  };

  const handleDeleteCustomPrompt = async (id: string) => {
      setCustomPrompts(customPrompts.filter(p => p.id !== id));
      await storageManager.getAdapter().deleteCustomPrompt(id);
  };

  const handleOpenProject = (project: SermonProject) => {
    setCurrentProject(project);
    setView('editor');
  };

  const handleLoadSampleKr = async () => {
    if (projects.some(p => p.title === SAMPLE_PROJECT.title)) {
      alert("이미 샘플 설교가 생성되었습니다");
      return;
    }
    const sampleCopy = {
      ...SAMPLE_PROJECT,
      id: uuidv4(),
      lastModified: Date.now(),
      isDeleted: false,
      isLocked: false
    };
    await handleCreateProject(sampleCopy);
  };

  const handleBackToDashboard = () => {
    setCurrentProject(null);
    setView('dashboard');
  };

  // --- Subscription Actions ---
  const handleSelectPlan = async (plan: 'pro' | 'church') => {
    const clientKey = process.env.TOSS_CLIENT_KEY;
    if (!clientKey) {
      alert('결제 설정이 완료되지 않았습니다.');
      return;
    }

    setPendingPlan(plan);
    setBillingProcessing(true);

    try {
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const toss = await loadTossPayments(clientKey);
      const userId = session?.user?.id || 'anonymous';
      const customerKey = `CUST-${userId.replace(/-/g, '').slice(0, 20)}`;

      sessionStorage.setItem('pending_plan', plan);

      await toss.requestBillingAuth({
        method: 'CARD',
        customerKey,
        successUrl: `${window.location.origin}${window.location.pathname}`,
        failUrl: `${window.location.origin}${window.location.pathname}`,
      });
    } catch (e: any) {
      console.error('Toss billing auth error:', e);
      setBillingProcessing(false);
      setPendingPlan(null);
      sessionStorage.removeItem('pending_plan');
    }
  };

  const handleOpenPricingModal = () => setShowPricingModal(true);

  // --- Auth Loading ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin w-10 h-10 border-4 border-crimson border-t-transparent rounded-full"></div>
           <p className="text-slate-500 font-serif italic">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // --- Show Landing or Login if not authenticated and not offline ---
  if (!session && !isOfflineMode) {
    if (!showLogin) {
      return (
        <LandingPage
          onGoToLogin={() => { setIsSignUpMode(false); setShowLogin(true); }}
          onGoToSignUp={() => { setIsSignUpMode(true); setShowLogin(true); }}
          onSkip={handleSkipLogin}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSkip={handleSkipLogin}
        onBackToLanding={() => { setShowLogin(false); setIsSignUpMode(false); }}
        initialSignUp={isSignUpMode}
      />
    );
  }

  // --- Syncing overlay ---
  if (isSyncing || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin w-10 h-10 border-4 border-crimson border-t-transparent rounded-full"></div>
           <p className="text-slate-500 font-serif italic">
             {isSyncing ? '클라우드 동기화 중...' : 'Loading Workspace...'}
           </p>
        </div>
      </div>
    );
  }

  const isCloudMode = !!session && !isOfflineMode;
  const userEmail = session?.user?.email || undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {view === 'dashboard' && (
        <Dashboard
          projects={projects}
          series={series}
          profile={profile}
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleSoftDeleteProject}
          onRestoreProject={handleRestoreProject}
          onHardDeleteProject={handleHardDeleteProject}
          onToggleLockProject={handleToggleLockProject}
          onCreateSeries={handleCreateSeries}
          onDeleteSeries={handleDeleteSeries}
          onUpdateProfile={handleUpdateProfile}
          onLoadSample={() => {}}
          onLoadSampleKr={handleLoadSampleKr}
          currentThemeId={currentThemeId}
          onThemeChange={setCurrentThemeId}
          onOpenBlank={() => setView('blank')}
          userEmail={userEmail}
          isCloudMode={isCloudMode}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          onOpenAdmin={() => setView('admin')}
          subscriptionState={subscriptionState}
          onUpgrade={handleOpenPricingModal}
        />
      )}

      {view === 'editor' && currentProject && (
          <ProjectEditor
            project={currentProject}
            profile={profile}
            onUpdate={handleUpdateProject}
            onBack={handleBackToDashboard}
            customPrompts={customPrompts}
            onSaveCustomPrompt={handleCreateCustomPrompt}
            onDeleteCustomPrompt={handleDeleteCustomPrompt}
            onShowPricing={handleOpenPricingModal}
          />
      )}

      {view === 'blank' && (
        <BlankPage
          onBack={handleBackToDashboard}
          onCreateProject={handleCreateProject}
          onShowPricing={handleOpenPricingModal}
        />
      )}

      {view === 'admin' && isAdmin && (
        <AdminDashboard onBack={handleBackToDashboard} />
      )}

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleSelectPlan}
        isProcessing={billingProcessing}
      />
    </div>
  );
};

export default App;
