
import React, { useState } from 'react';
import { SermonProject, PreachingSettings, CustomPrompt, EditorSettings, DEFAULT_EDITOR_SETTINGS } from '../../types';
import { 
  Printer, Monitor, Edit, List, 
  Sparkles, Bold, Italic, Download,
  ShieldAlert, ShieldCheck, X, Clock, Play, Pause, RotateCcw,
  Presentation, GitCompare, Plus, StopCircle, MessageSquare, Save, Trash2, Brain,
  Share2, Users, FileText, Lock, Database, CheckSquare, Square, Palette, ChevronDown, Type
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ManuscriptProps {
  data: SermonProject;
  onChange: (field: keyof SermonProject, value: any) => void;
  onGenerateNotes: () => Promise<void>;
  onAiEdit: (text: string, instruction: string, explain?: boolean) => Promise<string>;
  onDoctrinalReview: () => Promise<string>;
  customPrompts?: CustomPrompt[];
  onSaveCustomPrompt?: (prompt: CustomPrompt) => void;
  onDeleteCustomPrompt?: (id: string) => void;
}

type ViewMode = 'editor' | 'pulpit' | 'print' | 'notes' | 'slides' | 'diff';

const BACKGROUND_COLORS = [
  { name: 'Paper', color: '#ffffff', textColor: '#0f172a' },
  { name: 'Cream', color: '#fcfaf2', textColor: '#1a1a1a' },
  { name: 'Sepia', color: '#f4ecd8', textColor: '#2c1810' },
  { name: 'Soft Gray', color: '#f1f5f9', textColor: '#1e293b' },
  { name: 'Forest', color: '#1a2f23', textColor: '#e2e8f0' },
  { name: 'Midnight', color: '#0f172a', textColor: '#f1f5f9' },
  { name: 'Deep Space', color: '#0a0a0a', textColor: '#d1d5db' },
];

const estimateTime = (text: string, rate: 'slow' | 'normal' | 'fast'): number => {
    const wordCount = text.trim().split(/\s+/).length;
    const wpm = rate === 'slow' ? 100 : rate === 'fast' ? 160 : 130;
    return Math.ceil(wordCount / wpm);
};

export const Manuscript: React.FC<ManuscriptProps> = ({ 
    data, onChange, onGenerateNotes, onAiEdit, onDoctrinalReview,
    customPrompts = [], onSaveCustomPrompt, onDeleteCustomPrompt
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [selection, setSelection] = useState<string>('');
  const [aiInstruction, setAiInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [isExplainMode, setIsExplainMode] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const settings: PreachingSettings = data.preachingSettings || { speechRate: 'normal', targetTime: 30 };
  const editorSettings: EditorSettings = data.editorSettings || DEFAULT_EDITOR_SETTINGS;

  const updateEditorSettings = (updates: Partial<EditorSettings>) => {
      onChange('editorSettings', { ...editorSettings, ...updates });
  };

  const estimatedTime = estimateTime(data.draft || '', settings.speechRate);
  const isOverTime = estimatedTime > settings.targetTime;

  const currentBg = BACKGROUND_COLORS.find(c => c.color === editorSettings.backgroundColor) || BACKGROUND_COLORS[0];

  const handleAiEdit = async () => {
    if (!selection || !aiInstruction) return;
    setIsAiEditing(true);
    const newText = await onAiEdit(selection, aiInstruction, isExplainMode);
    const updatedDraft = data.draft.replace(selection, newText);
    onChange('draft', updatedDraft);
    setIsAiEditing(false);
    setAiInstruction('');
    setSelection('');
  };
  
  const handleReview = async () => {
      setIsReviewing(true);
      const result = await onDoctrinalReview();
      setReviewResult(result);
      setIsReviewing(false);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selectedText = target.value.substring(target.selectionStart, target.selectionEnd);
    if (selectedText.length > 5) setSelection(selectedText);
    else setSelection('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap justify-between items-center mb-6 no-print border-b border-slate-200 pb-4 gap-4">
        <div className="flex gap-2 items-center">
          <button onClick={() => setViewMode('editor')} className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border ${viewMode === 'editor' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>에디터</button>
          <button onClick={() => setViewMode('pulpit')} className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border ${viewMode === 'pulpit' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>발표 모드</button>
          
          <div className="h-4 w-px bg-slate-300 mx-1"></div>
          
          <div className="relative">
              <button 
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className="px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                  <Palette size={14} /> 집필 환경 <ChevronDown size={10} />
              </button>
              {isPaletteOpen && (
                  <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsPaletteOpen(false)}></div>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-sm shadow-xl border border-slate-200 z-50 p-3 animate-in fade-in slide-in-from-top-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">배경 테마</p>
                          <div className="grid grid-cols-4 gap-2 mb-4">
                              {BACKGROUND_COLORS.map(c => (
                                  <button 
                                    key={c.name}
                                    onClick={() => { updateEditorSettings({ backgroundColor: c.color }); setIsPaletteOpen(false); }}
                                    title={c.name}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${editorSettings.backgroundColor === c.color ? 'border-crimson scale-110 shadow-sm' : 'border-slate-100'}`}
                                    style={{ backgroundColor: c.color }}
                                  />
                              ))}
                          </div>
                          <div className="space-y-3 px-1">
                              <div>
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">글자 크기</label>
                                  <div className="flex items-center gap-3">
                                      <button onClick={() => updateEditorSettings({ fontSize: Math.max(12, editorSettings.fontSize - 2) })} className="p-1 border rounded hover:bg-slate-50 text-slate-600"><Type size={12} /></button>
                                      <span className="text-xs font-mono font-bold text-slate-700">{editorSettings.fontSize}</span>
                                      <button onClick={() => updateEditorSettings({ fontSize: Math.min(32, editorSettings.fontSize + 2) })} className="p-1 border rounded hover:bg-slate-50 text-slate-600"><Type size={16} /></button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </>
              )}
          </div>
        </div>
        <div className="flex gap-3">
            <div className={`text-[10px] font-bold flex items-center gap-1 bg-white px-3 py-1.5 rounded-sm border ${isOverTime ? 'text-red-600' : 'text-green-600'}`}>
                예상 시간: {estimatedTime}분 / 목표: {settings.targetTime}분
            </div>
        </div>
      </div>

      {viewMode === 'editor' && (
        <div className="flex-1 relative flex gap-6 overflow-hidden">
           <div className="flex-1 rounded-sm shadow-card border border-slate-200 overflow-hidden flex flex-col transition-colors duration-500" style={{ backgroundColor: currentBg.color }}>
             <div className="border-b border-slate-100 p-2 flex gap-4 items-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-black/5 rounded-sm" style={{ color: currentBg.textColor }}><Bold size={14} /></button>
                    <button className="p-1.5 hover:bg-black/5 rounded-sm" style={{ color: currentBg.textColor }}><Italic size={14} /></button>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <button onClick={handleReview} disabled={isReviewing} className="text-[10px] bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-sm font-bold uppercase hover:bg-indigo-50 flex items-center gap-2 transition-all shadow-sm">
                    {isReviewing ? <Sparkles className="animate-spin" size={12} /> : <ShieldAlert size={12} />} 신학적 검토
                </button>
             </div>
             <textarea
              id="manuscript-editor"
              value={data.draft}
              onChange={(e) => onChange('draft', e.target.value)}
              onSelect={handleSelect}
              style={{ 
                  backgroundColor: 'transparent', 
                  color: currentBg.textColor,
                  fontSize: `${editorSettings.fontSize}px`,
                  lineHeight: editorSettings.lineHeight
              }}
              className="flex-1 p-10 resize-none focus:outline-none font-serif placeholder:text-slate-400"
              placeholder="최종 설교 원고를 작성하세요..."
             />
           </div>
           
           {reviewResult && (
               <div className="w-80 bg-white rounded-sm shadow-xl border-l-4 border-indigo-500 p-6 absolute right-0 top-0 bottom-0 overflow-y-auto animate-in slide-in-from-right z-20">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-indigo-900 flex items-center gap-2 font-serif uppercase text-xs tracking-wider"><ShieldCheck size={16}/> 검토 리포트</h3>
                       <button onClick={() => setReviewResult(null)} className="text-slate-400 hover:text-slate-700"><X size={16}/></button>
                   </div>
                   <div className="prose prose-sm prose-slate font-sans text-slate-900">
                       <ReactMarkdown>{reviewResult}</ReactMarkdown>
                   </div>
               </div>
           )}

           {selection && !reviewResult && (
             <div className="w-72 bg-white rounded-sm shadow-2xl border border-crimson p-0 absolute right-6 top-24 animate-in fade-in slide-in-from-right-4 z-10 overflow-hidden flex flex-col">
                <div className="bg-crimson p-3 flex justify-between items-center text-white">
                    <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-2"><Sparkles size={12} /> AI 다듬기</span>
                    <button onClick={() => setSelection('')}><X size={14}/></button>
                </div>
                <div className="p-4 space-y-4">
                    <textarea value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="다듬기 지시를 입력하세요..." className="w-full text-xs p-3 border border-slate-200 rounded-sm focus:ring-1 focus:ring-crimson outline-none resize-none bg-white text-slate-900" rows={3}/>
                    <button onClick={handleAiEdit} disabled={isAiEditing || !aiInstruction} className="w-full bg-crimson text-white py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-crimson-hover shadow-md transition-all">
                        {isAiEditing ? '처리 중...' : '적용하기'}
                    </button>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Pulpit / Presentation View */}
      {viewMode === 'pulpit' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex-1 overflow-y-auto transition-colors duration-500 relative"
            style={{ backgroundColor: currentBg.color }}
          >
            <div className="max-w-3xl mx-auto py-16 px-12">
              {/* Title Header */}
              <div className="text-center mb-12 border-b pb-8" style={{ borderColor: `${currentBg.textColor}20` }}>
                <h1
                  className="font-serif font-black mb-3 leading-tight"
                  style={{ color: currentBg.textColor, fontSize: `${editorSettings.fontSize + 8}px` }}
                >
                  {data.title || '제목 없음'}
                </h1>
                <p
                  className="font-serif italic opacity-60"
                  style={{ color: currentBg.textColor, fontSize: `${editorSettings.fontSize - 2}px` }}
                >
                  {data.passage || '본문 없음'}
                </p>
              </div>

              {/* Draft Content */}
              <div
                className="font-serif whitespace-pre-wrap leading-loose pulpit-view"
                style={{
                  color: currentBg.textColor,
                  fontSize: `${editorSettings.fontSize + 2}px`,
                  lineHeight: editorSettings.lineHeight + 0.2
                }}
              >
                {data.draft || '작성된 원고가 없습니다. 에디터 모드에서 원고를 작성하세요.'}
              </div>

              {/* Preaching Notes */}
              {data.notes && (
                <div className="mt-16 pt-8 border-t" style={{ borderColor: `${currentBg.textColor}20` }}>
                  <h3
                    className="font-serif font-bold mb-4 uppercase tracking-wider opacity-50"
                    style={{ color: currentBg.textColor, fontSize: `${editorSettings.fontSize - 4}px` }}
                  >
                    설교 노트
                  </h3>
                  <div
                    className="font-serif whitespace-pre-wrap opacity-70"
                    style={{ color: currentBg.textColor, fontSize: `${editorSettings.fontSize - 2}px`, lineHeight: 1.8 }}
                  >
                    {data.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-white border-t border-slate-200 p-3 flex items-center justify-between no-print">
            <div className="flex items-center gap-4">
              <div className={`text-[10px] font-bold flex items-center gap-1 ${isOverTime ? 'text-red-600' : 'text-green-600'}`}>
                <Clock size={12} /> 예상 {estimatedTime}분
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="px-3 py-1.5 bg-white border border-slate-200 rounded-sm text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <Printer size={12} /> 인쇄
              </button>
              <button onClick={() => setViewMode('editor')} className="px-3 py-1.5 bg-slate-900 text-white rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 flex items-center gap-2">
                <Edit size={12} /> 편집으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
