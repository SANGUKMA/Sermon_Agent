
import React, { useState } from 'react';
import { SermonProject, MeditationEntry } from '../../types';
import { Heart, Lightbulb, Sparkles, BrainCircuit, X, Lock, Unlock, Plus, Calendar, Trash2, Edit2, Check, Undo2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

interface MeditationProps {
  data: SermonProject;
  onUpdate: (updates: Partial<SermonProject>) => void;
  onGetTemplate: () => Promise<string>;
  onGetInsights: (journal: string) => Promise<string>;
}

const TEMPLATES = [
  { label: "개인적 찔림 (Conviction)", prompt: "이 말씀이 내 마음을 어떻게 찌르는가?" },
  { label: "회중의 필요 (Needs)", prompt: "우리 성도들이 겪는 어떤 짐을 이 말씀이 다루고 있는가?" },
  { label: "그리스도 연결 (Christ)", prompt: "이 본문은 어떻게 예수 그리스도를 가리키는가?" },
  { label: "회개 (Confession)", prompt: "이 말씀 앞에 내가 회개해야 할 죄는 무엇인가?" },
];

export const Meditation: React.FC<MeditationProps> = ({ data, onUpdate, onGetTemplate, onGetInsights }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  
  // New Entry State
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  const [newContent, setNewContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');

  const entries = data.meditationEntries || [];

  const syncLegacyJournal = (updatedEntries: MeditationEntry[]) => {
    return updatedEntries
      .filter(e => !e.isPrivate)
      .map(e => `[${new Date(e.date).toLocaleDateString()}] ${e.prompt}: ${e.content}`).join('\n\n');
  };

  const handleAddEntry = () => {
    if (!newContent.trim()) return;
    
    const newEntry: MeditationEntry = {
      id: uuidv4(),
      date: Date.now(),
      prompt: activeTemplate || '자유 묵상',
      content: newContent,
      isPrivate: isPrivate
    };

    const updatedEntries = [...entries, newEntry];
    onUpdate({
        meditationEntries: updatedEntries,
        journal: syncLegacyJournal(updatedEntries)
    });

    setNewContent('');
    setActiveTemplate('');
  };

  const handleDeleteEntry = (id: string) => {
    if(!confirm("이 기록을 삭제하시겠습니까?")) return;
    const updatedEntries = entries.filter(e => e.id !== id);
    onUpdate({
        meditationEntries: updatedEntries,
        journal: syncLegacyJournal(updatedEntries)
    });
  };

  const handleStartEdit = (entry: MeditationEntry) => {
    setEditingId(entry.id);
    setEditBuffer(entry.content);
  };

  const handleSaveEdit = (id: string) => {
    const updatedEntries = entries.map(e => e.id === id ? { ...e, content: editBuffer } : e);
    onUpdate({
        meditationEntries: updatedEntries,
        journal: syncLegacyJournal(updatedEntries)
    });
    setEditingId(null);
    setEditBuffer('');
  };

  const handleAnalyze = async () => {
    const fullText = entries
      .map(e => `[${e.isPrivate ? 'PRIVATE' : 'PUBLIC'}] ${e.content}`).join('\n\n');

    if (!fullText) {
        setSuggestions("분석할 묵상 기록이 없습니다.");
        return;
    }
    
    setIsAnalyzing(true);
    const result = await onGetInsights(fullText);
    setSuggestions(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-12">
      
      {/* COLUMN 1: Timeline & History */}
      <div className="lg:col-span-1 bg-white rounded-sm border border-slate-200 shadow-card flex flex-col h-full min-h-[600px]">
         <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
             <Calendar className="text-slate-500" size={18} />
             <h3 className="font-bold text-slate-900 font-serif">영적 타임라인</h3>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-white">
             <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100"></div>
             {entries.length === 0 && (
                 <div className="text-center py-10 text-slate-400 text-sm italic pl-4">
                     아직 기록이 없습니다. 묵상을 시작해보세요.
                 </div>
             )}
             {[...entries].reverse().map((entry) => (
                 <div key={entry.id} className="relative pl-8 group animate-in slide-in-from-left-2 duration-300">
                     <div className={`absolute left-[1.35rem] top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${entry.isPrivate ? 'bg-slate-300' : 'bg-crimson'}`}></div>
                     <div className={`bg-white border p-4 rounded-sm shadow-sm hover:shadow-md transition-shadow relative ${entry.isPrivate ? 'border-slate-100' : 'border-slate-200'}`}>
                         
                         {/* Entry Actions */}
                         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             {editingId !== entry.id && (
                               <button onClick={() => handleStartEdit(entry)} className="text-slate-300 hover:text-blue-500 p-1"><Edit2 size={12}/></button>
                             )}
                             <button onClick={() => handleDeleteEntry(entry.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                         </div>

                         <div className="flex justify-between items-start mb-2">
                             <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                 {new Date(entry.date).toLocaleDateString()}
                             </span>
                             {entry.isPrivate && <Lock size={12} className="text-slate-300" />}
                         </div>
                         <h4 className="text-xs font-bold text-slate-800 mb-1 font-serif">{entry.prompt}</h4>
                         
                         {editingId === entry.id ? (
                           <div className="space-y-2 mt-2">
                             <textarea 
                                value={editBuffer}
                                onChange={(e) => setEditBuffer(e.target.value)}
                                className="w-full text-sm font-serif p-2 border border-blue-200 rounded-sm focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px]"
                             />
                             <div className="flex justify-end gap-2">
                               <button onClick={() => setEditingId(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"><Undo2 size={10}/> 취소</button>
                               <button onClick={() => handleSaveEdit(entry.id)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Check size={10}/> 저장</button>
                             </div>
                           </div>
                         ) : (
                           <p className="text-sm text-slate-600 font-serif leading-relaxed line-clamp-6">
                               {entry.content}
                           </p>
                         )}
                     </div>
                 </div>
             ))}
         </div>
      </div>

      {/* COLUMN 2: Editor Workspace */}
      <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-sm border border-slate-200 shadow-card p-6 flex flex-col h-[420px] shrink-0">
             <div className="flex justify-between items-center mb-4 shrink-0">
                 <div className="flex items-center gap-2 font-bold text-slate-900 font-serif text-lg">
                     <Heart className="text-crimson" size={20} />
                     <h3>새 묵상 기록</h3>
                 </div>
                 <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setIsPrivate(!isPrivate)}
                       className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-sm font-bold uppercase transition-colors ${isPrivate ? 'bg-slate-100 text-slate-600' : 'bg-green-50 text-green-700 border border-green-200'}`}
                     >
                         {isPrivate ? <><Lock size={14}/> 비공개</> : <><Unlock size={14}/> 공개</>}
                     </button>
                 </div>
             </div>

             <div className="flex gap-2 mb-4 flex-wrap shrink-0">
                 {TEMPLATES.map(t => (
                     <button 
                       key={t.label}
                       onClick={() => setActiveTemplate(t.label)}
                       className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-wide transition-all ${activeTemplate === t.label ? 'bg-crimson text-white border-crimson' : 'bg-white text-slate-500 border-slate-200 hover:border-crimson hover:text-crimson'}`}
                     >
                         {t.label}
                     </button>
                 ))}
             </div>

             {activeTemplate && (
                 <div className="bg-white p-3 mb-3 text-sm text-slate-700 italic border-l-4 border-crimson font-serif shrink-0 border border-slate-100 shadow-sm">
                     "{TEMPLATES.find(t => t.label === activeTemplate)?.prompt}"
                 </div>
             )}

             <textarea
               value={newContent}
               onChange={(e) => setNewContent(e.target.value)}
               className="flex-1 p-4 resize-none focus:outline-none bg-white text-slate-900 leading-loose font-serif text-lg border border-slate-300 rounded-sm mb-4 focus:border-crimson focus:ring-1 focus:ring-crimson transition-all placeholder:text-slate-400"
               placeholder="이곳에 묵상한 내용을 기록하세요..."
             />
             
             <div className="flex justify-end shrink-0">
                 <button 
                   onClick={handleAddEntry}
                   disabled={!newContent.trim()}
                   className="bg-slate-900 text-white px-6 py-2 rounded-sm text-sm font-bold uppercase hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                 >
                     <Plus size={16} /> 기록 저장
                 </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[420px] shrink-0">
             <div className="bg-white rounded-sm border border-slate-200 shadow-card flex flex-col overflow-hidden h-full">
                 <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
                     <Lightbulb className="text-amber-500" size={18}/>
                     <h3 className="font-bold text-slate-900 font-serif">적용점 (Application Points)</h3>
                 </div>
                 <textarea
                    value={data.applicationPoints}
                    onChange={(e) => onUpdate({ applicationPoints: e.target.value })}
                    className="flex-1 p-6 resize-none focus:outline-none bg-white text-slate-900 leading-relaxed font-serif placeholder:text-slate-400"
                    placeholder="회중을 위한 구체적인 실천 사항..."
                 />
             </div>

             <div className="bg-white rounded-sm border border-slate-200 flex flex-col p-4 relative h-full overflow-hidden shadow-card">
                 <div className="flex justify-between items-center mb-4 shrink-0">
                     <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                         <BrainCircuit size={16}/> AI 인사이트 합성
                     </h3>
                     {suggestions && <button onClick={() => setSuggestions(null)}><X size={16} className="text-slate-400 hover:text-slate-700"/></button>}
                 </div>
                 
                 {suggestions ? (
                     <div className="flex-1 overflow-y-auto prose prose-sm font-serif bg-white p-3 rounded-sm border border-slate-100 shadow-sm text-slate-900">
                         <ReactMarkdown>{suggestions}</ReactMarkdown>
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center">
                         <p className="text-slate-500 text-xs mb-4 px-4">
                             기록된 묵상을 분석하여 설교와의 연결점을 제안합니다.
                         </p>
                         <button
                           onClick={handleAnalyze}
                           disabled={isAnalyzing || entries.length === 0}
                           className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-sm text-xs font-bold uppercase hover:text-crimson hover:border-crimson shadow-sm flex items-center gap-2 disabled:opacity-50"
                         >
                           {isAnalyzing ? <Sparkles className="animate-spin" size={14}/> : <Sparkles size={14}/>} 
                           인사이트 생성
                         </button>
                     </div>
                 )}
             </div>
          </div>
      </div>
    </div>
  );
};
