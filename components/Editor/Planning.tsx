
import React, { useState } from 'react';
import { SermonProject } from '../../types';
import { Sparkles, Target, LayoutTemplate, CheckCircle, Users, Briefcase, Heart, BookOpen } from 'lucide-react';
import { StructureOption } from '../../services/geminiService';

interface PlanningProps {
  data: SermonProject;
  onChange: (field: keyof SermonProject, value: any) => void;
  onGenerateStructureOptions: () => Promise<StructureOption[]>;
}

export const Planning: React.FC<PlanningProps> = ({ data, onChange, onGenerateStructureOptions }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<StructureOption[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const results = await onGenerateStructureOptions();
    setOptions(results);
    setLoading(false);
    setShowOptions(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-white p-8 rounded-sm border border-slate-200 shadow-card">
        <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-3">
          <Target className="text-crimson" size={20} />
          <h3 className="text-xl font-bold text-slate-900 font-serif">설교 기본 정보</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">설교 제목</label>
             <input type="text" value={data.title} onChange={(e) => onChange('title', e.target.value)} className="w-full p-3 border border-slate-300 rounded-sm focus:ring-1 focus:ring-crimson outline-none font-serif text-lg bg-white text-slate-900 placeholder:text-slate-300" placeholder="제목을 입력하세요"/>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">본문 구절</label>
             <input type="text" value={data.passage} onChange={(e) => onChange('passage', e.target.value)} className="w-full p-3 border border-slate-300 rounded-sm focus:ring-1 focus:ring-crimson outline-none font-serif text-lg bg-white text-slate-900 placeholder:text-slate-300" placeholder="예: 시편 23:1-6"/>
          </div>
          <div className="space-y-2 lg:col-span-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">핵심 주제</label>
             <input type="text" value={data.theme} onChange={(e) => onChange('theme', e.target.value)} className="w-full p-3 border border-slate-300 rounded-sm focus:ring-1 focus:ring-crimson outline-none text-base bg-white text-slate-900 placeholder:text-slate-300" placeholder="예: 영적 회복과 소망"/>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-sm border border-slate-200 shadow-card">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <LayoutTemplate className="text-slate-700" size={20} />
            <h3 className="text-xl font-bold text-slate-900 font-serif">설교 구조 (Outline)</h3>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-sm font-bold uppercase tracking-widest hover:bg-crimson transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <Sparkles className="animate-spin" size={14} /> : <Sparkles size={14} />} AI 기도회 구조 제안
          </button>
        </div>
        <textarea 
          value={data.structure}
          onChange={(e) => onChange('structure', e.target.value)}
          placeholder="I. 서론: 일주일의 무게와 주님의 초대&#10;II. 본론 1: (첫 번째 대지: 회복의 약속)&#10;III. 본론 2: (두 번째 대지: 원어적 소망)&#10;IV. 본론 3: (세 번째 대지: 결단과 능력)&#10;V. 결론: 기도로 일어서는 삶 (기도 제목 포함)"
          className="w-full h-80 p-8 border border-slate-200 rounded-sm focus:ring-1 focus:ring-crimson outline-none font-mono text-sm leading-loose bg-white text-slate-900 placeholder:text-slate-300"
        />
      </div>

      {showOptions && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="bg-white rounded-sm shadow-2xl max-w-6xl w-full max-h-[80vh] flex flex-col p-8 border-t-8 border-crimson">
             <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
               <h2 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-3"><Sparkles className="text-crimson" size={24} /> AI 구조 제안 (금요기도회 특화)</h2>
               <button onClick={() => setShowOptions(false)} className="text-slate-400 hover:text-slate-900 uppercase font-bold text-xs">닫기</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pb-4">
               {options.map((opt, idx) => (
                 <div key={idx} className="bg-white border border-slate-200 rounded-sm p-6 hover:border-crimson hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full" onClick={() => { onChange('structure', opt.outline); setShowOptions(false); }}>
                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-crimson font-serif mb-2">{opt.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 italic flex-1">{opt.description}</p>
                    <div className="bg-white p-4 rounded-sm border border-slate-100 mb-4 h-48 overflow-hidden relative">
                        <pre className="text-[10px] text-slate-600 font-mono leading-relaxed">{opt.outline}</pre>
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
                    </div>
                    <button className="w-full py-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-sm group-hover:bg-crimson transition-colors">이 구조 적용하기</button>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
