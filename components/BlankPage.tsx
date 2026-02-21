
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, Send, Loader2, Eraser, 
  Copy, Check, BookOpen, MessageSquare, 
  Save, Wand2, FilePlus, ChevronRight, X, Edit3, CornerDownRight
} from 'lucide-react';
import { chatWithSermonAI, analyzeImportedSermon } from '../services/geminiService';
import { DEFAULT_PROJECT, DEFAULT_PROFILE, SermonProject } from '../types';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

interface BlankPageProps {
  onBack: () => void;
  onCreateProject: (project: SermonProject) => void;
}

export const BlankPage: React.FC<BlankPageProps> = ({ onBack, onCreateProject }) => {
  // Persistence: Load from localStorage on mount
  const [scratchpad, setScratchpad] = useState(() => {
    return localStorage.getItem('sermon_scratchpad') || '';
  });
  
  const [prompt, setPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selection, setSelection] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever scratchpad changes
  useEffect(() => {
    localStorage.setItem('sermon_scratchpad', scratchpad);
  }, [scratchpad]);

  const handleAskAI = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;
    setIsLoading(true);
    setAiOutput('');
    try {
      const result = await chatWithSermonAI(
        finalPrompt, 
        { 
          ...DEFAULT_PROJECT, 
          id: 'scratchpad-session',
          lastModified: Date.now(),
          title: '자유 묵상 및 스케치',
          draft: selection || scratchpad 
        }, 
        DEFAULT_PROFILE, 
        'SCRATCHPAD'
      );
      setAiOutput(result);
    } catch (error) {
      setAiOutput("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
      if(!customPrompt) setPrompt('');
    }
  };

  const handleCopy = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToScratchpad = () => {
    if (!aiOutput) return;
    setScratchpad(prev => prev + (prev ? '\n\n' : '') + aiOutput);
    setAiOutput('');
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selectedText = target.value.substring(target.selectionStart, target.selectionEnd);
    if (selectedText.length > 3) setSelection(selectedText);
    else setSelection('');
  };

  const handleConvertToProject = async () => {
    if (!scratchpad.trim()) return;
    setIsConverting(true);
    try {
      const analysis = await analyzeImportedSermon(scratchpad);
      const newProject: SermonProject = {
        ...DEFAULT_PROJECT,
        id: uuidv4(),
        title: analysis.title || "스크래치패드 기반 설교",
        passage: analysis.passage || "",
        draft: scratchpad,
        lastModified: Date.now(),
        mode: 'deep',
        status: 'in_progress'
      };
      onCreateProject(newProject);
      localStorage.removeItem('sermon_scratchpad');
      setScratchpad('');
    } catch (err) {
      alert("프로젝트 변환 중 오류가 발생했습니다.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col font-sans overflow-hidden">
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-2 text-slate-500 hover:text-crimson transition-all font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            대시보드
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <h1 className="font-serif font-black text-slate-900 text-lg tracking-tight flex items-center gap-2">
             <Wand2 size={20} className="text-crimson" />
             자유 묵상 스크래치패드
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleConvertToProject}
            disabled={!scratchpad.trim() || isConverting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-crimson transition-all disabled:opacity-50 shadow-sm"
          >
            {isConverting ? <Loader2 size={14} className="animate-spin" /> : <FilePlus size={14} />}
            설교 프로젝트로 전환
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-sm transition-colors ${isSidebarOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col bg-[#fdfdfb] transition-all duration-500 relative ${isSidebarOpen ? 'w-1/2' : 'w-full'}`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={14}/> 자유 집필 영역
                </span>
                <div className="flex gap-4">
                    {selection && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1">
                            <span className="text-[9px] font-bold text-crimson uppercase">선택 영역:</span>
                            <button onClick={() => handleAskAI(`다음 문장을 더 설교적인 문체로 다듬어줘: "${selection}"`)} className="text-[10px] bg-crimson/5 text-crimson px-2 py-1 rounded-sm font-bold border border-crimson/20 hover:bg-crimson hover:text-white transition-all">다듬기</button>
                            <button onClick={() => handleAskAI(`다음 내용의 신학적 의미를 더 확장해줘: "${selection}"`)} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-sm font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">내용 확장</button>
                            <button onClick={() => setSelection('')} className="p-1 text-slate-300 hover:text-slate-500"><X size={12}/></button>
                        </div>
                    )}
                    <button onClick={() => setScratchpad('')} className="p-1.5 text-slate-400 hover:text-crimson transition-colors" title="전체 삭제"><Eraser size={16}/></button>
                </div>
            </div>
            <textarea 
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                onSelect={handleSelect}
                placeholder="여기에 자유롭게 설교 아이디어나 묵상을 기록하세요..."
                className="flex-1 w-full p-10 md:p-16 resize-none focus:outline-none bg-transparent text-slate-900 leading-[2] font-serif text-xl placeholder:text-slate-300"
            />
            <div className="p-4 border-t border-slate-100 bg-white/50 text-[10px] text-slate-400 font-mono flex justify-between">
                <span>글자 수: {scratchpad.length}</span>
                <span>로컬 자동 저장 시스템 작동 중</span>
            </div>
        </div>

        <div className={`bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-[450px]' : 'w-0 opacity-0 pointer-events-none'}`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" /> AI 응답 결과
                    </h3>
                    {aiOutput && (
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-crimson transition-all">{copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}</button>
                            <button onClick={handleAddToScratchpad} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all"><CornerDownRight size={16} /></button>
                            <button onClick={() => setAiOutput('')} className="p-1.5 text-slate-400 hover:text-slate-600 transition-all"><X size={16} /></button>
                        </div>
                    )}
                </div>

                <div className="min-h-[200px]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <Loader2 className="animate-spin text-crimson" size={32} />
                            <p className="text-xs font-serif italic">영감을 불러오는 중...</p>
                        </div>
                    ) : aiOutput ? (
                        <div className="prose prose-sm prose-slate max-w-none font-serif leading-relaxed text-slate-800 animate-in fade-in slide-in-from-bottom-2">
                            <ReactMarkdown>{aiOutput}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
                            <Edit3 size={48} className="mb-4" />
                            <p className="text-sm font-serif italic">AI가 당신의 묵상을 도울 준비가 되었습니다.</p>
                        </div>
                    )}
                    <div ref={outputRef} />
                </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="relative">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                        placeholder="무엇을 도와드릴까요?"
                        className="w-full bg-white border border-slate-300 rounded-sm p-4 pr-12 text-sm focus:ring-1 focus:ring-crimson outline-none resize-none shadow-sm min-h-[100px]"
                    />
                    <button 
                        onClick={() => handleAskAI()}
                        disabled={isLoading || !prompt.trim()}
                        className="absolute right-3 bottom-3 p-2 bg-slate-900 text-white rounded-sm hover:bg-crimson transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};
