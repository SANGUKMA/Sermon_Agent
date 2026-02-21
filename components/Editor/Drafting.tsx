
import React, { useState, useEffect } from 'react';
import { SermonProject, DraftOption, DraftVersion } from '../../types';
import { Sparkles, ArrowRight, RefreshCw, Check, Clock, Copy, GitBranch, History, ChevronLeft, ChevronRight, Settings2, Sliders } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface DraftingProps {
  data: SermonProject;
  onGenerateDraft: (options: DraftOption) => Promise<string>;
  onSaveDraft: (draft: string) => void;
}

interface ExtendedDraftingProps extends DraftingProps {
    onChange: (field: keyof SermonProject, value: any) => void;
}

export const Drafting: React.FC<ExtendedDraftingProps> = ({ data, onGenerateDraft, onSaveDraft, onChange }) => {
  const [options, setOptions] = useState<DraftOption>({
      length: 'medium',
      tone: 'warm',
      audienceFocus: 'general'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'compare'>('editor');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  
  const renderHighlightedDraft = (text: string) => {
      if (!text) return <p className="text-slate-400 italic">아직 생성된 내용이 없습니다.</p>;
      
      const parts = text.split(/(\[\[LOCAL_STORY:.*?\]\])/g);
      return parts.map((part, i) => {
          if (part.startsWith('[[LOCAL_STORY:')) {
              return (
                  <span key={i} className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded border border-amber-200 font-bold text-sm mx-1">
                      {part}
                  </span>
              );
          }
          return <span key={i}>{part}</span>;
      });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const content = await onGenerateDraft(options);
        const newVersion: DraftVersion = {
            id: uuidv4(),
            timestamp: Date.now(),
            content: content,
            options: { ...options }
        };
        const updatedVersions = [newVersion, ...(data.draftVersions || [])];
        onChange('draftVersions', updatedVersions);
        onChange('draft', content);
        setSelectedVersionId(newVersion.id);
    } catch (e) {
        console.error(e);
        alert("초안 생성에 실패했습니다.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRestoreVersion = (version: DraftVersion) => {
      if(confirm("현재 초안을 이 버전으로 교체하시겠습니까?")) {
          onChange('draft', version.content);
          setActiveTab('editor');
      }
  };

  const getSelectedVersionContent = () => {
      return data.draftVersions?.find(v => v.id === selectedVersionId)?.content || '';
  };

  return (
    <div className="flex h-full gap-6 pb-8">
        <div className="w-80 flex flex-col gap-6 shrink-0">
            <div className="bg-white rounded-sm border border-slate-200 shadow-card p-5">
                <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold font-serif border-b border-slate-100 pb-2 text-sm uppercase tracking-wide">
                    <Sliders size={16} className="text-crimson"/> 생성 옵션
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex justify-between">
                            <span>목표 분량</span>
                            <span className="text-crimson">{options.length === 'short' ? '짧게' : options.length === 'medium' ? '보통' : '길게'}</span>
                        </label>
                        <input 
                            type="range" min="0" max="2" step="1" 
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-crimson"
                            value={options.length === 'short' ? 0 : options.length === 'medium' ? 1 : 2}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setOptions({...options, length: val === 0 ? 'short' : val === 1 ? 'medium' : 'long'});
                            }}
                        />
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">설교 톤 (TONE)</label>
                         <div className="grid grid-cols-2 gap-2">
                             {[{val: 'warm', label: '따뜻하게'}, {val: 'authoritative', label: '권위있게'}, {val: 'storytelling', label: '스토리텔링'}, {val: 'academic', label: '학술적으로'}].map(t => (
                                 <button key={t.val} onClick={() => setOptions({...options, tone: t.val as any})}
                                    className={`text-[10px] py-2 border rounded-sm font-bold transition-all ${options.tone === t.val ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                 >
                                     {t.label}
                                 </button>
                             ))}
                         </div>
                    </div>
                    <button onClick={handleGenerate} disabled={isGenerating}
                        className="w-full bg-crimson text-white py-3 rounded-sm font-bold uppercase text-xs tracking-wider shadow-md hover:bg-crimson-hover disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    >
                        {isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                        {data.draft ? '새 버전 생성하기' : '첫 초안 생성하기'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-sm border border-slate-200 shadow-card flex-1 flex flex-col overflow-hidden min-h-[250px]">
                <div className="p-3 bg-white border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">버전 히스토리</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-white">
                    {data.draftVersions?.map((v, idx) => (
                        <div key={v.id} onClick={() => { setSelectedVersionId(v.id); setActiveTab('compare'); }}
                            className={`p-3 rounded-sm border cursor-pointer transition-all ${selectedVersionId === v.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-[10px] text-slate-700">버전 {data.draftVersions!.length - idx}</span>
                                <span className="text-[9px] text-slate-400 font-mono">{new Date(v.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-sm border border-slate-200 shadow-card overflow-hidden">
            <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-white">
                <div className="flex gap-4">
                    <button onClick={() => setActiveTab('editor')} className={`text-xs font-bold uppercase tracking-wider h-12 border-b-2 px-2 transition-all ${activeTab === 'editor' ? 'border-crimson text-crimson' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>현재 초안</button>
                    {selectedVersionId && (
                         <button onClick={() => setActiveTab('compare')} className={`text-xs font-bold uppercase tracking-wider h-12 border-b-2 px-2 transition-all flex items-center gap-2 ${activeTab === 'compare' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><GitBranch size={14}/> 비교</button>
                    )}
                </div>
                <button onClick={() => onSaveDraft(data.draft)} className="flex items-center gap-2 text-green-700 font-bold text-xs uppercase tracking-wide hover:bg-green-50 px-3 py-1.5 rounded-sm transition-colors"><Check size={14}/> 저장 및 다음</button>
            </div>

            <div className="flex-1 relative overflow-hidden flex bg-white">
                <div className={`flex-1 flex flex-col bg-white ${activeTab === 'compare' ? 'border-r border-slate-200' : ''}`}>
                    <textarea 
                        value={data.draft}
                        onChange={(e) => onChange('draft', e.target.value)}
                        placeholder="초안 내용이 여기에 표시됩니다..."
                        className="flex-1 w-full p-8 resize-none focus:outline-none font-serif text-lg leading-relaxed text-slate-900 bg-white placeholder:text-slate-400 shadow-sm"
                    />
                </div>
                {activeTab === 'compare' && selectedVersionId && (
                    <div className="flex-1 flex flex-col bg-white">
                         <div className="bg-indigo-50 p-2 flex justify-between items-center px-4 border-b border-indigo-100">
                             <span className="text-[10px] font-bold text-indigo-800 uppercase">과거 버전 (Read Only)</span>
                             <button onClick={() => { const v = data.draftVersions?.find(v => v.id === selectedVersionId); if(v) handleRestoreVersion(v); }} className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded shadow-sm font-bold uppercase hover:bg-indigo-50">복원하기</button>
                         </div>
                         <div className="flex-1 p-8 overflow-y-auto font-serif text-lg leading-relaxed text-slate-900 whitespace-pre-wrap bg-white">
                             {renderHighlightedDraft(getSelectedVersionContent())}
                         </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
