
import React, { useState, useRef, Suspense } from 'react';
import { 
  Plus, BookOpen, Trash2, Sparkles, Database, Loader2, 
  Layers, BookMarked, Upload, Search, Calendar, Settings, 
  ChevronDown, User, FileEdit, Undo, RefreshCw, ChevronLeft, ArrowRight
} from 'lucide-react';
import { SermonProject, SermonSeries, TheologicalProfile, DEFAULT_PROJECT } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { analyzeImportedSermon } from '../services/geminiService';
import { ProjectCard } from './dashboard/ProjectCard';

const SettingsModal = React.lazy(() => import('./dashboard/SettingsModal'));
const NewProjectModal = React.lazy(() => import('./dashboard/NewProjectModal'));

interface DashboardProps {
  projects: SermonProject[];
  series: SermonSeries[];
  profile: TheologicalProfile;
  onOpenProject: (project: SermonProject) => void;
  onCreateProject: (project: SermonProject) => void;
  onDeleteProject: (id: string) => void;
  onRestoreProject?: (id: string) => void;
  onHardDeleteProject?: (id: string) => void;
  onToggleLockProject?: (id: string) => void;
  onCreateSeries: (series: SermonSeries) => void;
  onDeleteSeries: (id: string) => void;
  onUpdateProfile: (profile: TheologicalProfile) => void;
  onLoadSample: () => void;
  onLoadSampleKr: () => void;
  currentThemeId?: string;
  onThemeChange?: (themeId: string) => void;
  onOpenBlank: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  series,
  profile,
  onOpenProject, 
  onCreateProject, 
  onDeleteProject,
  onRestoreProject,
  onHardDeleteProject,
  onToggleLockProject,
  onCreateSeries,
  onDeleteSeries,
  onUpdateProfile,
  onLoadSample, 
  onLoadSampleKr,
  currentThemeId = 'crimson',
  onThemeChange,
  onOpenBlank
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'series' | 'trash'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');

  // Filtering Logic
  const allActiveProjects = projects.filter(p => !p.isDeleted);
  const deletedProjects = projects.filter(p => p.isDeleted);

  const filteredProjects = allActiveProjects.filter(p => 
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.passage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUpcoming = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return d >= now;
  };

  const upcomingProjects = filteredProjects
      .filter(p => isUpcoming(p.date))
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  const inProgressProjects = filteredProjects
      .filter(p => !isUpcoming(p.date))
      .sort((a, b) => b.lastModified - a.lastModified);

  const handleCreateSeries = () => {
      if(!newSeriesTitle) return;
      const newSeries: SermonSeries = {
          id: uuidv4(),
          title: newSeriesTitle,
          description: newSeriesDesc,
          lastModified: Date.now()
      };
      onCreateSeries(newSeries);
      setIsSeriesModalOpen(false);
      setNewSeriesTitle('');
      setNewSeriesDesc('');
  };

  const handleImportClick = () => {
      if(fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      try {
          const text = await file.text();
          if (file.name.endsWith('.json')) {
              try {
                  const data = JSON.parse(text);
                  const restoredProject: SermonProject = { ...DEFAULT_PROJECT, ...data, id: uuidv4(), lastModified: Date.now(), isDeleted: false, isLocked: false };
                  onCreateProject(restoredProject);
              } catch(err) { alert("JSON 파싱 실패."); }
          } else {
              const analysis = await analyzeImportedSermon(text);
              const importedProject: SermonProject = {
                  ...DEFAULT_PROJECT,
                  id: uuidv4(),
                  title: analysis.title || file.name.replace(/\.[^/.]+$/, ""),
                  passage: analysis.passage || "",
                  theme: analysis.theme || "",
                  structure: analysis.structure || "",
                  draft: analysis.draft || text,
                  applicationPoints: analysis.applicationPoints || "",
                  lastModified: Date.now(),
                  mode: 'deep',
                  status: 'in_progress',
                  isDeleted: false,
                  isLocked: false
              };
              onCreateProject(importedProject);
          }
      } catch (err) { alert("파일 읽기 오류."); } 
      finally { setIsImporting(false); }
  };

  const activeSeries = series.find(s => s.id === selectedSeriesId);
  const seriesProjects = allActiveProjects.filter(p => p.seriesId === selectedSeriesId);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight font-serif">Sermon-AI비서</h1>
               <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide rounded-sm border border-slate-200 flex items-center gap-1">
                   <Database size={10} /> Local Persistence
               </span>
            </div>
            <p className="text-slate-500 mt-1 text-sm">깊이 있는 설교 준비를 위한 목회자 전용 AI 워크스페이스</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
             <div className="relative flex-1 md:w-64 mr-2">
                 <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
                 <input 
                    type="text" 
                    placeholder="프로젝트 검색..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-sm text-sm focus:ring-1 focus:ring-crimson focus:border-crimson outline-none bg-white text-slate-900 placeholder:text-slate-400 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
             </div>

             <div className="relative">
                 {isUserMenuOpen && (
                     <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                 )}
                 <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 p-1.5 rounded-sm transition-all mr-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs shadow-sm">
                        <User size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 hidden md:block max-w-[120px] truncate">로컬 사용자</span>
                    <ChevronDown size={14} className="text-slate-400"/>
                 </button>
                 {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-sm shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-1">
                        <button onClick={() => { setIsSettingsOpen(true); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors border-b">
                            <Settings size={14}/> 환경 설정
                        </button>
                        <button onClick={() => { setActiveTab('trash'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors">
                            <Trash2 size={14}/> 휴지통
                        </button>
                    </div>
                 )}
             </div>

             <div className="flex gap-2">
                 <button onClick={onOpenBlank} className="bg-white text-slate-700 border border-slate-300 p-2.5 rounded-sm shadow-sm flex items-center gap-2 font-bold hover:bg-slate-50 text-xs uppercase tracking-wide" title="자유 묵상 페이지">
                   <FileEdit size={16} />
                 </button>
                 <button onClick={onLoadSampleKr} className="bg-white text-slate-800 border border-slate-300 px-3 py-2.5 rounded-sm shadow-sm font-bold hover:border-crimson text-xs uppercase tracking-wide hidden sm:block">🇰🇷 샘플 로드</button>
             </div>
             
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json,.txt,.md" />
             <button onClick={handleImportClick} disabled={isImporting} className="bg-white text-slate-700 border border-slate-300 px-4 py-2.5 rounded-sm shadow-sm flex items-center gap-2 font-bold hover:bg-slate-50 text-xs uppercase tracking-wide">
               {isImporting ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16} />} 가져오기
             </button>

             <button onClick={() => setIsProjectModalOpen(true)} className="bg-crimson hover:bg-crimson-hover text-white px-5 py-2.5 rounded-sm shadow-sm flex items-center gap-2 font-bold transition-all text-xs uppercase tracking-wide">
               <Plus size={16} /> 새 설교 생성
             </button>
          </div>
        </header>

        {/* NAVIGATION TABS */}
        <div className="flex gap-8 mb-8 border-b border-slate-200">
           <button onClick={() => { setActiveTab('projects'); setSelectedSeriesId(null); }} className={`pb-3 px-1 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === 'projects' ? 'border-crimson text-crimson' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
             내 설교
           </button>
           <button onClick={() => setActiveTab('series')} className={`pb-3 px-1 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === 'series' ? 'border-crimson text-crimson' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
             시리즈
           </button>
           <button onClick={() => { setActiveTab('trash'); setSelectedSeriesId(null); }} className={`pb-3 px-1 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === 'trash' ? 'border-crimson text-crimson' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
             휴지통 {deletedProjects.length > 0 && `(${deletedProjects.length})`}
           </button>
        </div>

        {/* PROJECTS DASHBOARD */}
        {activeTab === 'projects' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
                {upcomingProjects.length > 0 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={16}/> 다가오는 설교
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingProjects.map(p => <ProjectCard key={p.id} project={p} series={series} onOpenProject={onOpenProject} onDeleteProject={onDeleteProject} onToggleLock={onToggleLockProject} />)}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={16}/> {searchQuery ? '검색 결과' : '전체 라이브러리'}
                        </h3>
                    </div>
                    {inProgressProjects.length === 0 && upcomingProjects.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-sm border border-slate-200 border-dashed">
                            <Sparkles size={32} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2 font-serif">워크스페이스가 비어있습니다</h3>
                            <button onClick={() => setIsProjectModalOpen(true)} className="text-crimson font-bold text-sm hover:underline uppercase tracking-wide flex items-center gap-2 mx-auto">
                                <Plus size={14} /> 새 프로젝트 시작
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {inProgressProjects.map(p => <ProjectCard key={p.id} project={p} series={series} onOpenProject={onOpenProject} onDeleteProject={onDeleteProject} onToggleLock={onToggleLockProject} />)}
                        </div>
                    )}
                </section>
            </div>
        )}

        {/* TRASH TAB */}
        {activeTab === 'trash' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm flex items-center gap-3 text-amber-800 mb-8">
                    <RefreshCw size={18} className="shrink-0" />
                    <p className="text-xs font-serif italic">삭제된 설교는 휴지통에 보관되며 언제든지 복구할 수 있습니다.</p>
                </div>
                {deletedProjects.length === 0 ? (
                    <div className="p-20 text-center border border-dashed border-slate-200 rounded-sm bg-white">
                        <Trash2 size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm font-serif">휴지통이 비어있습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deletedProjects.map(p => (
                            <div key={p.id} className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm relative group opacity-75 hover:opacity-100 transition-opacity">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button 
                                        onClick={() => onRestoreProject && onRestoreProject(p.id)}
                                        className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"
                                        title="복구하기"
                                    >
                                        <Undo size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => onHardDeleteProject && onHardDeleteProject(p.id)}
                                        className="text-red-300 hover:text-red-600 p-1"
                                        title="영구 삭제"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 font-serif mb-1 line-clamp-1">{p.title}</h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">{p.passage || "본문 없음"}</p>
                                <div className="text-[9px] text-slate-400 italic">삭제일: {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString() : '알 수 없음'}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* SERIES TAB & DETAIL VIEW */}
        {activeTab === 'series' && (
            <div className="space-y-6 animate-in fade-in">
                {selectedSeriesId && activeSeries ? (
                    // --- SERIES DETAIL VIEW ---
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <button 
                                onClick={() => setSelectedSeriesId(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>시리즈 목록</span>
                                <ArrowRight size={10} />
                                <span className="text-crimson">상세 보기</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-sm border border-slate-200 p-10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 font-serif mb-2">{activeSeries.title}</h2>
                                    <p className="text-slate-500 max-w-2xl">{activeSeries.description || '지정된 설명이 없습니다.'}</p>
                                </div>
                                <button 
                                    onClick={() => setIsProjectModalOpen(true)}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-crimson transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <Plus size={16} /> 이 시리즈에 새 설교 추가
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={16}/> 시리즈 구성 설교 ({seriesProjects.length}편)
                            </h3>
                            {seriesProjects.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-sm border border-slate-200 border-dashed">
                                    <Layers size={32} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 text-sm font-serif italic">아직 이 시리즈에 등록된 설교가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {seriesProjects.map(p => (
                                        <ProjectCard key={p.id} project={p} series={series} onOpenProject={onOpenProject} onDeleteProject={onDeleteProject} onToggleLock={onToggleLockProject} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // --- SERIES LIST VIEW ---
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 font-serif">전체 시리즈</h3>
                            <button onClick={() => setIsSeriesModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide hover:border-crimson">
                                <Plus size={14} /> 새 시리즈
                            </button>
                        </div>
                        {series.length === 0 ? (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-sm bg-white">
                                <Layers size={32} className="text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-400">생성된 시리즈가 없습니다</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {series.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => setSelectedSeriesId(s.id)}
                                        className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm relative group hover:border-indigo-200 transition-all cursor-pointer hover:shadow-md"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-sm"></div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteSeries(s.id); }} 
                                            className="absolute top-4 right-4 text-slate-300 hover:text-crimson opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                        <h3 className="text-xl font-bold text-slate-900 font-serif mb-2 group-hover:text-indigo-600 transition-colors">{s.title}</h3>
                                        <p className="text-sm text-slate-500 mb-6 min-h-[40px] line-clamp-2">{s.description || '설명 없음'}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 p-2 rounded-sm inline-block">
                                                <BookMarked size={12} className="inline mr-1" /> {allActiveProjects.filter(p => p.seriesId === s.id).length}편의 설교
                                            </div>
                                            <ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        <Suspense fallback={null}>
            {isProjectModalOpen && (
                <NewProjectModal 
                    isOpen={isProjectModalOpen} 
                    onClose={() => setIsProjectModalOpen(false)} 
                    onCreate={onCreateProject} 
                    series={series} 
                    profile={profile}
                    initialSeriesId={selectedSeriesId || undefined}
                />
            )}
            {isSettingsOpen && (
                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} profile={profile} onUpdateProfile={onUpdateProfile} currentThemeId={currentThemeId} onThemeChange={onThemeChange} />
            )}
        </Suspense>

        {isSeriesModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white rounded-sm shadow-xl p-6 max-w-md w-full animate-in zoom-in-95">
                    <h2 className="text-lg font-bold mb-4 font-serif">새 시리즈</h2>
                    <div className="space-y-3">
                        <input type="text" placeholder="시리즈 제목 (예: 금요기도회 시리즈)" className="w-full border p-2 rounded-sm font-serif text-sm bg-white text-slate-900" value={newSeriesTitle} onChange={e => setNewSeriesTitle(e.target.value)} autoFocus />
                        <textarea placeholder="설명 / 목표 (예: 일주일의 삶을 위로하고 기도로 승리하는 시간)" className="w-full border p-2 rounded-sm h-20 font-sans text-sm resize-none bg-white text-slate-900" value={newSeriesDesc} onChange={e => setNewSeriesDesc(e.target.value)}></textarea>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setIsSeriesModalOpen(false)} className="px-3 py-2 text-slate-500 font-bold text-xs uppercase">취소</button>
                        <button onClick={handleCreateSeries} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs uppercase rounded-sm">생성</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
