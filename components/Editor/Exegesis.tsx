
import React, { useState } from 'react';
import { SermonProject, TheologicalProfile } from '../../types';
import { Scroll, Languages, BookOpen, Sparkles, X, Plus, Trash2, ListFilter, ClipboardCheck, ArrowRight, Loader2, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeOriginalWord, generateOIAInsight, fetchBibleText } from '../../services/geminiService';
import { withUsageTracking, UsageLimitError } from '../../services/aiGateway';
import { v4 as uuidv4 } from 'uuid';

interface ExegesisProps {
  data: SermonProject;
  profile: TheologicalProfile;
  onChange: (field: keyof SermonProject, value: any) => void;
  onGenerateInsight: (type: 'historical' | 'language' | 'theology', instruction?: string) => Promise<void>;
}

export const Exegesis: React.FC<ExegesisProps> = ({ data, profile, onChange, onGenerateInsight }) => {
  const [activeTab, setActiveTab] = useState<'context' | 'hermeneutics'>('context');
  const [loadingType, setLoadingType] = useState<'historical' | 'language' | 'theology' | null>(null);
  const [instructions, setInstructions] = useState({ historical: '', language: '', theology: '' });
  const [wordAnalysis, setWordAnalysis] = useState<{word: string, content: string} | null>(null);
  const [analyzingWord, setAnalyzingWord] = useState(false);
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);
  const [bibleText, setBibleText] = useState<string>('');
  const [loadingBible, setLoadingBible] = useState(false);

  const handleFetchBible = async () => {
    if (!data.passage?.trim()) {
      alert("본문 구절이 설정되지 않았습니다.");
      return;
    }
    setLoadingBible(true);
    try {
      const text = await withUsageTracking('fetchBibleText',
        () => fetchBibleText(data.passage));
      setBibleText(text);
    } catch (e: any) {
      if (e instanceof UsageLimitError) setBibleText(e.message);
      else setBibleText("본문을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingBible(false);
    }
  };

  const handleGen = async (type: 'historical' | 'language' | 'theology') => {
    setLoadingType(type);
    try {
      await onGenerateInsight(type, instructions[type]);
      setInstructions(prev => ({ ...prev, [type]: '' }));
    } finally {
      setLoadingType(null);
    }
  };

  const handleAddHermeneutic = () => {
    const newItems = [...(data.hermeneutics || [])];
    newItems.push({
      id: uuidv4(),
      observation: '',
      interpretation: '',
      application: ''
    });
    onChange('hermeneutics', newItems);
  };

  const handleDeleteHermeneutic = (id: string) => {
    const newItems = data.hermeneutics.filter(h => h.id !== id);
    onChange('hermeneutics', newItems);
  };

  const handleUpdateHermeneuticField = (id: string, field: 'observation' | 'interpretation' | 'application', value: string) => {
    const newItems = data.hermeneutics.map(h => h.id === id ? { ...h, [field]: value } : h);
    onChange('hermeneutics', newItems);
  };

  const handleDeepAnalysis = async (id: string, observation: string) => {
    if (!observation.trim()) {
        alert("관찰(Observation) 내용을 먼저 입력해주세요.");
        return;
    }
    setAnalyzingItemId(id);
    try {
        const insight = await withUsageTracking('generateOIAInsight',
          () => generateOIAInsight(observation, data.passage, profile));
        const item = data.hermeneutics.find(h => h.id === id);
        if (!item) return;

        const newInterpretation = item.interpretation.trim() ? `${item.interpretation}\n\n[AI 통찰]: ${insight.interpretation}` : insight.interpretation;
        const newApplication = item.application.trim() ? `${item.application}\n\n[AI 제안]: ${insight.application}` : insight.application;

        const newItems = data.hermeneutics.map(h => h.id === id ? { ...h, interpretation: newInterpretation, application: newApplication } : h);
        onChange('hermeneutics', newItems);
    } catch (e) {
        alert("심층 분석 중 오류가 발생했습니다.");
    } finally {
        setAnalyzingItemId(null);
    }
  };

  const renderContextSection = (title: string, icon: React.ReactNode, field: keyof SermonProject, type: 'historical' | 'language' | 'theology') => {
    const content = data[field] as string;
    return (
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
        <div className="bg-white px-5 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 font-serif text-sm">
            <span className="text-crimson">{icon}</span> {title}
          </h3>
        </div>
        <div className="flex-1 relative bg-white overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full h-full p-6 border-0 focus:ring-0 text-slate-900 resize-none outline-none font-serif leading-relaxed text-base bg-white placeholder:text-slate-300"
            placeholder={`${title} 연구 내용을 입력하세요...`}
          />
        </div>
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
            <div className="flex gap-2">
                <input 
                  type="text" 
                  value={instructions[type]}
                  onChange={(e) => setInstructions({...instructions, [type]: e.target.value})}
                  placeholder="보강할 내용이나 지시사항..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-sm text-xs focus:ring-1 focus:ring-crimson outline-none bg-white text-slate-900 shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleGen(type)}
                />
                <button 
                  onClick={() => handleGen(type)}
                  disabled={loadingType !== null}
                  className="bg-slate-900 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-crimson disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm shrink-0"
                >
                  {loadingType === type ? <Sparkles className="animate-spin" size={12}/> : <Sparkles size={12}/>} 
                  {content.length > 0 ? 'AI 보강' : 'AI 연구'}
                </button>
            </div>
        </div>
      </div>
    );
  };

  const handleWordSelect = async () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) return;
    const word = selection.toString().trim();
    setAnalyzingWord(true);
    setWordAnalysis(null);
    try {
        const analysis = await withUsageTracking('analyzeOriginalWord',
          () => analyzeOriginalWord(word, data.passage));
        setWordAnalysis({ word, content: analysis });
    } catch (e: any) {
        if (e instanceof UsageLimitError) setWordAnalysis({ word, content: e.message });
        else setWordAnalysis({ word, content: "분석 중 오류가 발생했습니다." });
    } finally {
        setAnalyzingWord(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12 flex flex-col">
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
          <button onClick={() => setActiveTab('context')} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 ${activeTab === 'context' ? 'border-crimson text-crimson bg-crimson-light/5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <BookOpen size={14} /> 핵심 3대 연구 (배경/원어/신학)
          </button>
          <button onClick={() => setActiveTab('hermeneutics')} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 ${activeTab === 'hermeneutics' ? 'border-crimson text-crimson bg-crimson-light/5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <ListFilter size={14} /> 본문 관찰 및 통찰 (OIA)
          </button>
      </div>

      {activeTab === 'context' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
            {renderContextSection('본문 배경연구', <Scroll size={16} />, 'historicalContext', 'historical')}
            {renderContextSection('원어 연구', <Languages size={16} />, 'originalLanguage', 'language')}
            <div className="lg:col-span-2">
                {renderContextSection('신학적 주제', <BookOpen size={16} />, 'theologicalThemes', 'theology')}
            </div>
        </div>
      )}

      {activeTab === 'hermeneutics' && (
        <div className="space-y-4">
        {/* Bible Text Display */}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 font-serif text-sm">
              <span className="text-crimson"><BookOpen size={16} /></span> 성경 본문 — {data.passage || '구절 미설정'}
            </h3>
            <button
              onClick={handleFetchBible}
              disabled={loadingBible}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-crimson transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loadingBible ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {bibleText ? '다시 불러오기' : '본문 불러오기'}
            </button>
          </div>
          {bibleText && (
            <div className="p-6 max-h-64 overflow-y-auto bg-amber-50/30">
              <div className="font-serif text-base text-slate-800 leading-loose whitespace-pre-wrap">
                {bibleText}
              </div>
            </div>
          )}
          {!bibleText && !loadingBible && (
            <div className="p-6 text-center text-slate-400 text-sm font-serif italic">
              "본문 불러오기" 버튼을 클릭하면 개역개정판 성경 본문이 표시됩니다.
            </div>
          )}
          {loadingBible && (
            <div className="p-6 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin text-crimson" /> 성경 본문을 불러오는 중...
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-sm border border-slate-200 shadow-card flex flex-col min-h-[600px]">
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center px-8">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardCheck size={12}/> 관찰(Observation) - 해석(Interpretation) - 적용(Application)
                </div>
                <button 
                  onClick={handleAddHermeneutic}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-crimson transition-all flex items-center gap-2 shadow-sm"
                >
                    <Plus size={14}/> 연구 항목 추가
                </button>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50">
                {(!data.hermeneutics || data.hermeneutics.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                        <ListFilter size={48} className="text-slate-200 mb-4"/>
                        <p className="text-slate-400 text-sm font-serif italic mb-6">본문에서 깨달음을 얻은 구절이나 주제별로 연구 항목을 추가하세요.</p>
                        <button onClick={handleAddHermeneutic} className="text-crimson font-bold text-xs uppercase tracking-widest border border-crimson/30 px-4 py-2 rounded-sm hover:bg-crimson hover:text-white transition-all">첫 번째 항목 추가</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.hermeneutics.map((item, idx) => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-sm shadow-sm group overflow-hidden">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">연구 포인트 {idx + 1}</span>
                                            <button
                                                onClick={() => handleDeepAnalysis(item.id, item.observation)}
                                                disabled={analyzingItemId === item.id || !item.observation.trim()}
                                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                                    analyzingItemId === item.id
                                                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600'
                                                }`}
                                            >
                                                {analyzingItemId === item.id ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
                                                {analyzingItemId === item.id ? '심층 분석 중...' : 'AI 심층 분석'}
                                            </button>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteHermeneutic(item.id)}
                                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                        <div className="p-4 space-y-2">
                                            <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest">관찰 (Observation)</label>
                                            <textarea
                                                className="w-full h-32 text-sm font-serif p-0 border-0 focus:ring-0 resize-none bg-transparent text-slate-900 placeholder:text-slate-300"
                                                placeholder="무엇이 기록되어 있는가? (사실 확인)"
                                                onMouseUp={handleWordSelect}
                                                value={item.observation}
                                                onChange={(e) => handleUpdateHermeneuticField(item.id, 'observation', e.target.value)}
                                            />
                                        </div>
                                        <div className="p-4 space-y-2 bg-slate-50/30">
                                            <label className="text-[9px] font-black text-crimson uppercase tracking-widest">해석 (Interpretation)</label>
                                            <textarea
                                                className="w-full h-32 text-sm font-serif p-0 border-0 focus:ring-0 resize-none bg-transparent text-slate-900 placeholder:text-slate-300"
                                                placeholder="무슨 뜻인가? (신학적 의미)"
                                                value={item.interpretation}
                                                onChange={(e) => handleUpdateHermeneuticField(item.id, 'interpretation', e.target.value)}
                                            />
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <label className="text-[9px] font-black text-green-600 uppercase tracking-widest">적용 (Application)</label>
                                            <textarea
                                                className="w-full h-32 text-sm font-serif p-0 border-0 focus:ring-0 resize-none bg-transparent text-slate-900 placeholder:text-slate-300"
                                                placeholder="나와 우리에게 어떤 의미인가?"
                                                value={item.application}
                                                onChange={(e) => handleUpdateHermeneuticField(item.id, 'application', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-center">
                 <p className="text-[10px] text-slate-400 italic font-serif flex items-center gap-2">
                    <ArrowRight size={10}/> 관찰 텍스트에서 단어를 드래그하면 원어 분석을 수행할 수 있습니다.
                 </p>
            </div>
        </div>
        </div>
      )}

      {(wordAnalysis || analyzingWord) && (
        <div className="fixed bottom-8 right-8 w-80 bg-white rounded-sm shadow-2xl border border-slate-200 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 text-white p-3 flex justify-between items-center rounded-t-sm">
                <span className="font-bold text-[10px] uppercase tracking-wider">단어 심층 분석</span>
                <button onClick={() => {setWordAnalysis(null); setAnalyzingWord(false);}} className="text-slate-400 hover:text-white"><X size={14}/></button>
            </div>
            <div className="p-5 max-h-80 overflow-y-auto bg-white">
                {analyzingWord ? (
                    <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
                        <Sparkles className="animate-spin text-crimson" size={16}/> 분석 중...
                    </div>
                ) : (
                    <div>
                        <h4 className="text-lg font-bold text-crimson font-serif mb-2">"{wordAnalysis?.word}"</h4>
                        <div className="prose prose-sm text-slate-900 font-serif leading-relaxed">
                            <ReactMarkdown>{wordAnalysis?.content || ''}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
