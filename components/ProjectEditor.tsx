
import React, { useState, useEffect, useRef } from 'react';
import { SermonProject, SermonStage, TheologicalProfile, CustomPrompt } from '../types';
import { 
  Layout, Book, PenTool, Edit3, FileText, ChevronRight, 
  CheckCircle2, ChevronLeft, RefreshCcw, Sparkles, Home, ShieldCheck, MessageSquare, Brain, Loader2, AlertTriangle, X 
} from 'lucide-react';
import {
  generateStructureOptions,
  generateExegesisHelp,
  generateSermonDraft,
  generatePreachingNotes,
  polishBlock,
  generateMeditationTemplate,
  generateMeditationIntegration,
  performDoctrinalReview,
  chatWithSermonAI,
  AIError
} from '../services/geminiService';

// Sub-components
import { Planning } from './Editor/Planning';
import { Exegesis } from './Editor/Exegesis';
import { Meditation } from './Editor/Meditation';
import { Drafting } from './Editor/Drafting';
import { Manuscript } from './Editor/Manuscript';
import { SermonOverview } from './SermonOverview';

interface ProjectEditorProps {
  project: SermonProject;
  profile: TheologicalProfile;
  onUpdate: (project: SermonProject) => void;
  onBack: () => void;
  // Custom Prompts Props
  customPrompts?: CustomPrompt[];
  onSaveCustomPrompt?: (prompt: CustomPrompt) => void;
  onDeleteCustomPrompt?: (id: string) => void;
}

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
}

const STEPS = [
  { id: 'OVERVIEW', label: '개요 (Overview)', icon: Home },
  { id: SermonStage.PLANNING, label: '기획 (Planning)', icon: Layout },
  { id: SermonStage.EXEGESIS, label: '주석 (Exegesis)', icon: Book },
  { id: SermonStage.MEDITATION, label: '묵상 (Meditation)', icon: PenTool },
  { id: SermonStage.DRAFTING, label: '초안 (Drafting)', icon: Sparkles },
  { id: SermonStage.MANUSCRIPT, label: '원고 (Manuscript)', icon: FileText },
];

export const ProjectEditor: React.FC<ProjectEditorProps> = ({ 
  project, 
  profile, 
  onUpdate, 
  onBack,
  customPrompts = [],
  onSaveCustomPrompt,
  onDeleteCustomPrompt
}) => {
  const [activeStage, setActiveStage] = useState<string>(
    project.mode === 'manual' ? SermonStage.MANUSCRIPT : 'OVERVIEW'
  );
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  
  // Right Sidebar State
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(project.mode !== 'manual');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  // Initial AI Message
  useEffect(() => {
    if (chatHistory.length === 0) {
        setChatHistory([{
            role: 'ai',
            content: `안녕하세요! **${project.title}** 설교 준비를 돕겠습니다. 본문은 *${project.passage}*입니다. 무엇을 도와드릴까요?`,
            timestamp: Date.now()
        }]);
    }
  }, [project.id]);

  // Debounced auto-save: saves project after 3 seconds of inactivity
  const lastProjectRef = useRef(project);
  useEffect(() => {
    // Skip save if project hasn't actually changed
    if (lastProjectRef.current === project) return;

    const timer = setTimeout(() => {
      setSaving(true);
      onUpdate({ ...project, lastModified: Date.now() });
      lastProjectRef.current = project;
      setSaving(false);
      setLastSaved(new Date());
    }, 3000);
    return () => clearTimeout(timer);
  }, [project]);

  // Single field update (Legacy support)
  const updateProjectField = (field: keyof SermonProject, value: any) => {
    onUpdate({
      ...project,
      [field]: value,
      lastModified: Date.now()
    });
  };

  // Multiple fields update (Atomic update)
  const updateProject = (updates: Partial<SermonProject>) => {
    onUpdate({
      ...project,
      ...updates,
      lastModified: Date.now()
    });
  };

  const nextStage = () => {
    const currentIndex = STEPS.findIndex(s => s.id === activeStage);
    if (currentIndex < STEPS.length - 1) {
      setActiveStage(STEPS[currentIndex + 1].id);
    }
  };

  const handleSendChat = async () => {
      if (!chatInput.trim() || isChatLoading) return;
      
      const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
      setChatHistory(prev => [...prev, userMsg]);
      setChatInput('');
      setIsChatLoading(true);
      setQuotaError(null);

      try {
          const response = await chatWithSermonAI(chatInput, project, profile, activeStage);
          const aiMsg: ChatMessage = { role: 'ai', content: response, timestamp: Date.now() };
          setChatHistory(prev => [...prev, aiMsg]);
      } catch (err: any) {
          if (err instanceof AIError && err.isQuota) {
            setQuotaError(err.message);
          }
          const errorMsg: ChatMessage = { role: 'ai', content: err.message || 'AI 연결에 실패했습니다.', timestamp: Date.now() };
          setChatHistory(prev => [...prev, errorMsg]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const renderStage = () => {
    switch (activeStage) {
      case 'OVERVIEW':
        return (
            <SermonOverview 
                project={project} 
                onStartPhase={(stage) => setActiveStage(stage)}
            />
        );
      case SermonStage.PLANNING:
        return (
          <Planning
            data={project}
            onChange={updateProjectField}
            onGenerateStructureOptions={async () => {
               try {
                 setQuotaError(null);
                 return await generateStructureOptions(project.title, project.passage, project.theme, profile);
               } catch (e: any) {
                 if (e instanceof AIError) setQuotaError(e.message);
                 return [];
               }
            }}
          />
        );
      case SermonStage.EXEGESIS:
        return (
          <Exegesis
            data={project}
            profile={profile}
            onChange={updateProjectField}
            onGenerateInsight={async (type, instruction) => {
               try {
                 setQuotaError(null);
                 const currentContent = project[
                   type === 'historical' ? 'historicalContext' :
                   type === 'language' ? 'originalLanguage' : 'theologicalThemes'
                 ];

                 const insight = await generateExegesisHelp(project.passage, type, currentContent, instruction, profile);

                 if(type === 'historical') updateProjectField('historicalContext', insight);
                 if(type === 'language') updateProjectField('originalLanguage', insight);
                 if(type === 'theology') updateProjectField('theologicalThemes', insight);
               } catch (e: any) {
                 if (e instanceof AIError && e.isQuota) setQuotaError(e.message);
                 else setQuotaError(e.message || 'AI 연구 생성에 실패했습니다.');
               }
            }}
          />
        );
      case SermonStage.MEDITATION:
        return (
           <Meditation 
             data={project} 
             onUpdate={updateProject} 
             onGetTemplate={generateMeditationTemplate}
             onGetInsights={async (journal) => generateMeditationIntegration(journal, project.passage)}
           />
        );
      case SermonStage.DRAFTING:
        return (
          <Drafting
            data={project}
            onChange={updateProjectField}
            onGenerateDraft={async (options) => {
              try {
                setQuotaError(null);
                return await generateSermonDraft(project, profile, options);
              } catch (e: any) {
                if (e instanceof AIError) setQuotaError(e.message);
                throw e;
              }
            }}
            onSaveDraft={(draft) => {
              updateProjectField('draft', draft);
              nextStage();
            }}
          />
        );
      case SermonStage.MANUSCRIPT:
        return (
          <Manuscript 
            data={project} 
            onChange={updateProjectField}
            onGenerateNotes={async () => {
               const notes = await generatePreachingNotes(project.draft);
               updateProjectField('notes', notes);
            }}
            onAiEdit={async (text, instruction, explain) => {
                return await polishBlock(text, instruction, profile, explain);
            }}
            onDoctrinalReview={async () => {
                return await performDoctrinalReview(project.draft, profile);
            }}
            customPrompts={customPrompts}
            onSaveCustomPrompt={onSaveCustomPrompt}
            onDeleteCustomPrompt={onDeleteCustomPrompt}
          />
        );
      default:
        return <div>Unknown Stage</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] overflow-hidden font-sans">
      
      {/* COLUMN 1: Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col no-print shadow-lg z-20 shrink-0">
        <div className="p-5 border-b border-slate-100">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-crimson transition-colors mb-4 text-xs font-bold uppercase tracking-wide">
            <ChevronLeft size={14} /> 대시보드
          </button>
          <div className="mb-1">
            <h2 className="font-black text-lg text-slate-900 leading-tight font-serif truncate" title={project.title}>
                {project.title || "제목 없음"}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-serif italic truncate">{project.passage || "본문 없음"}</p>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStage === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStage(step.id)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-bold transition-all border-l-[3px] group ${
                  isActive 
                    ? 'border-crimson bg-crimson-light/50 text-crimson' 
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-crimson' : 'text-slate-400 group-hover:text-slate-600'} />
                {step.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
           <div className="flex items-center justify-between text-[10px] text-slate-500">
             <div className="flex items-center gap-1.5">
               {saving ? <RefreshCcw className="animate-spin text-crimson" size={10} /> : <CheckCircle2 size={10} className="text-green-700" />}
               {saving ? '저장 중...' : '저장됨'}
             </div>
             {lastSaved && <div className="font-mono opacity-60">{lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
           </div>
        </div>
      </div>

      {/* COLUMN 2: Main Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 no-print shadow-sm shrink-0">
           <div className="flex items-center gap-3">
             <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest">
               {activeStage} 단계
             </span>
             {project.mode === 'manual' && (
                 <span className="text-[10px] text-slate-600 font-bold border border-slate-200 bg-slate-100 px-2 py-1 rounded-sm hidden md:inline-block">
                     MANUAL MODE
                 </span>
             )}
           </div>
           
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
               className={`p-2 rounded-sm transition-colors ${isAiSidebarOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
               title="AI 도우미 토글"
             >
               <MessageSquare size={18} />
             </button>
             {activeStage !== SermonStage.MANUSCRIPT && activeStage !== 'OVERVIEW' && (
               <button 
                onClick={nextStage}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-sm text-xs font-bold hover:bg-slate-800 transition-all shadow-sm uppercase tracking-wide"
               >
                 다음 단계 <ChevronRight size={14} />
               </button>
             )}
           </div>
        </header>

        {/* Quota Error Notification */}
        {quotaError && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
              <AlertTriangle size={16} className="text-amber-500" />
              {quotaError}
            </div>
            <button onClick={() => setQuotaError(null)} className="text-amber-400 hover:text-amber-600"><X size={14}/></button>
          </div>
        )}

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto bg-[#f9fafb] p-6 lg:p-10 relative">
           <div className="max-w-5xl mx-auto min-h-full">
              {renderStage()}
           </div>
        </main>
      </div>

      {/* COLUMN 3: AI Companion Sidebar */}
      {isAiSidebarOpen && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 shrink-0 animate-in slide-in-from-right duration-300">
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Brain size={14} className="text-indigo-600"/> AI 설교 도우미
              </h3>
              <button onClick={() => setIsAiSidebarOpen(false)} className="text-slate-400 hover:text-slate-600"><ChevronRight size={16}/></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex flex-col gap-4">
                  {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-sm text-xs leading-relaxed max-w-[90%] shadow-sm border ${
                              msg.role === 'ai' 
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-900 rounded-tl-none' 
                                : 'bg-white border-slate-200 text-slate-700 rounded-tr-none'
                          }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>
                  ))}
                  {isChatLoading && (
                      <div className="flex items-center gap-2 text-indigo-500 animate-pulse text-xs">
                          <Loader2 size={12} className="animate-spin" /> AI가 생각 중입니다...
                      </div>
                  )}
                  <div ref={chatEndRef} />
              </div>
           </div>

           {/* Chat Input */}
           <div className="p-4 border-t border-slate-200 bg-white">
              <div className="relative">
                  <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                    placeholder="무엇이든 물어보세요..." 
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-sm p-3 pr-10 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none outline-none"
                    rows={3}
                  ></textarea>
                  <button 
                    onClick={handleSendChat}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                      <ChevronRight size={12} />
                  </button>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 text-center italic">현재 설교 문맥을 바탕으로 답변합니다.</p>
           </div>
        </div>
      )}

    </div>
  );
};
