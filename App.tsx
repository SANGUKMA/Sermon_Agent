
import React, { useState, useEffect } from 'react';
// Fixed: Removed SAMPLE_PROJECT_KR as it is not exported from types.ts and SAMPLE_PROJECT is already the Korean sample.
import { SermonProject, SermonSeries, TheologicalProfile, SAMPLE_PROJECT, DEFAULT_PROFILE, CustomPrompt, AVAILABLE_COLOR_SETS } from './types';
import { Dashboard } from './components/Dashboard';
import { ProjectEditor } from './components/ProjectEditor';
import { BlankPage } from './components/BlankPage';
import { v4 as uuidv4 } from 'uuid';
import { storageManager } from './services/storage';

const App: React.FC = () => {
  // Data State
  const [projects, setProjects] = useState<SermonProject[]>([]);
  const [series, setSeries] = useState<SermonSeries[]>([]);
  const [profile, setProfile] = useState<TheologicalProfile>(DEFAULT_PROFILE);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<string>('crimson');
  
  const [currentProject, setCurrentProject] = useState<SermonProject | null>(null);
  const [view, setView] = useState<'dashboard' | 'editor' | 'blank'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Initialize Storage and Load Data on Mount
  useEffect(() => {
    initializeAndLoad();
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

  // Initialize Storage and Load Data
  const initializeAndLoad = async () => {
    setLoading(true);
    try {
      await storageManager.initialize();
      
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
    // Fixed: Used SAMPLE_PROJECT instead of non-existent SAMPLE_PROJECT_KR
    if (projects.some(p => p.title === SAMPLE_PROJECT.title)) {
      alert("이미 샘플 설교가 생성되었습니다");
      return;
    }
    // Fixed: Used SAMPLE_PROJECT instead of non-existent SAMPLE_PROJECT_KR
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin w-10 h-10 border-4 border-crimson border-t-transparent rounded-full"></div>
           <p className="text-slate-500 font-serif italic">Loading Workspace...</p>
        </div>
      </div>
    );
  }

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
          />
      )}

      {view === 'blank' && (
        <BlankPage 
          onBack={handleBackToDashboard} 
          onCreateProject={handleCreateProject}
        />
      )}
    </div>
  );
};

export default App;
