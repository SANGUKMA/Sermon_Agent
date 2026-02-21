
import React from 'react';
import { SermonProject, SermonStage } from '../types';
import { 
  Calendar, Layers, Target, BookOpen, Clock, 
  CheckCircle2, Circle, ArrowRight, Activity, Heart, Lock
} from 'lucide-react';

interface SermonOverviewProps {
  project: SermonProject;
  onStartPhase: (stage: SermonStage) => void;
}

export const SermonOverview: React.FC<SermonOverviewProps> = ({ project, onStartPhase }) => {
  // Helper to calculate phase progress
  const getProgress = (stage: SermonStage) => {
    switch (stage) {
      case SermonStage.PLANNING:
        return (project.title && project.passage && project.structure) ? 100 : project.title ? 50 : 0;
      case SermonStage.EXEGESIS:
        let exeCount = 0;
        if (project.historicalContext) exeCount++;
        if (project.originalLanguage) exeCount++;
        if (project.theologicalThemes) exeCount++;
        return Math.round((exeCount / 3) * 100);
      case SermonStage.MEDITATION:
        return (project.meditationEntries && project.meditationEntries.length > 0) ? 100 : 0;
      case SermonStage.DRAFTING:
        return project.draft ? 100 : 0;
      case SermonStage.MANUSCRIPT:
        return project.notes ? 100 : 0;
      default:
        return 0;
    }
  };

  const phases = [
    { id: SermonStage.PLANNING, label: '기획 (Planning)', desc: '구조 및 목표 설정', progress: getProgress(SermonStage.PLANNING) },
    { id: SermonStage.EXEGESIS, label: '주석 (Exegesis)', desc: '심층 본문 연구', progress: getProgress(SermonStage.EXEGESIS) },
    { id: SermonStage.MEDITATION, label: '묵상 (Meditation)', desc: '개인적 적용', progress: getProgress(SermonStage.MEDITATION) },
    { id: SermonStage.DRAFTING, label: '초안 (Drafting)', desc: 'AI 초안 작성', progress: getProgress(SermonStage.DRAFTING) },
    { id: SermonStage.MANUSCRIPT, label: '원고 (Manuscript)', desc: '최종 편집 및 노트', progress: getProgress(SermonStage.MANUSCRIPT) },
  ];

  const recentMeditations = [...(project.meditationEntries || [])].reverse().slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Section */}
      <div className="bg-white rounded-sm border border-slate-200 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-crimson"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1"><BookOpen size={14}/> {project.passage}</span>
              {project.date && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-crimson"><Calendar size={14}/> {new Date(project.date).toLocaleDateString()}</span>
                </>
              )}
            </div>
            <h1 className="text-4xl font-black text-slate-900 font-serif mb-2 leading-tight">{project.title}</h1>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
               <Layers size={16} className="text-slate-400"/>
               {project.theme || "주제 미설정"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase">대상 청중</div>
                <div className="font-serif text-slate-800">{project.audienceContext?.description || project.audience}</div>
             </div>
             {project.sermonGoal && (
                 <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-sm max-w-xs">
                     <div className="flex items-start gap-2">
                         <Target size={14} className="text-indigo-600 mt-1 shrink-0"/>
                         <p className="text-xs text-indigo-900 font-medium italic">"{project.sermonGoal}"</p>
                     </div>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Phase Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {phases.map((phase, idx) => (
          <button 
            key={phase.id}
            onClick={() => onStartPhase(phase.id)}
            className="bg-white border border-slate-200 p-4 rounded-sm hover:border-crimson hover:shadow-md transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full">
               <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${phase.progress}%` }}></div>
            </div>
            
            <div className="flex justify-between items-start mb-2">
               <span className="text-2xl font-black text-slate-200 group-hover:text-crimson/20 font-serif">0{idx + 1}</span>
               {phase.progress === 100 ? <CheckCircle2 size={18} className="text-green-500"/> : <Circle size={18} className="text-slate-200"/>}
            </div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide group-hover:text-crimson transition-colors">{phase.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{phase.desc}</p>
          </button>
        ))}
      </div>

      {/* Main Content Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Side: Structure and Summary */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-sm border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 font-serif mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Activity size={18} className="text-slate-400"/> 설교 개요 요약
                </h3>
                <div className="space-y-4">
                    {project.structure ? (
                        <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Structure</div>
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-serif leading-relaxed line-clamp-6">{project.structure}</pre>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm italic bg-slate-50 rounded-sm border border-dashed border-slate-200">
                            구조가 아직 설정되지 않았습니다. 기획 단계로 이동하세요.
                        </div>
                    )}
                    
                    {project.applicationPoints && (
                        <div className="bg-yellow-50/50 p-4 rounded-sm border border-yellow-100">
                            <div className="text-[10px] font-bold text-yellow-600 uppercase mb-2">주요 적용점</div>
                            <div className="text-sm text-slate-700 font-serif line-clamp-3">{project.applicationPoints}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* 영적 타임라인 미리보기 추가 */}
            <div className="bg-white rounded-sm border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 font-serif mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Heart size={18} className="text-crimson"/> 최근 영적 묵상 (Spiritual Timeline)
                </h3>
                <div className="space-y-4">
                    {recentMeditations.length > 0 ? (
                        <div className="relative pl-6 space-y-6">
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                            {recentMeditations.map((entry) => (
                                <div key={entry.id} className="relative">
                                    <div className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${entry.isPrivate ? 'bg-slate-300' : 'bg-crimson'}`}></div>
                                    <div className="bg-white border border-slate-100 p-4 rounded-sm shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</span>
                                            {entry.isPrivate && <Lock size={10} className="text-slate-300" />}
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-700 mb-1">{entry.prompt}</h4>
                                        <p className="text-sm text-slate-600 font-serif leading-relaxed line-clamp-2">{entry.content}</p>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => onStartPhase(SermonStage.MEDITATION)}
                                className="text-xs font-bold text-crimson hover:underline flex items-center gap-1 mt-2"
                            >
                                전체 타임라인 보기 <ArrowRight size={12}/>
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-sm border border-dashed border-slate-200">
                             <Heart size={32} className="text-slate-200 mx-auto mb-3" />
                             <p className="text-slate-400 text-sm font-serif italic mb-4">작성된 영적 묵상이 없습니다.</p>
                             <button 
                                onClick={() => onStartPhase(SermonStage.MEDITATION)}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-sm text-xs font-bold uppercase tracking-widest hover:border-crimson hover:text-crimson transition-all shadow-sm"
                             >
                                묵상 시작하기
                             </button>
                        </div>
                    )}
                </div>
            </div>
         </div>

         {/* Right Side: Quick Actions & Status */}
         <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-sm p-6 shadow-lg flex flex-col justify-between relative overflow-hidden h-64">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div>
                    <h3 className="font-bold text-lg mb-2 font-serif">작업 계속하기</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">마지막으로 작업하던 부분부터 바로 시작하세요. 말씀의 깊이를 더해갑니다.</p>
                </div>
                
                <button 
                onClick={() => onStartPhase(SermonStage.PLANNING)} 
                className="bg-white text-slate-900 py-3 px-4 rounded-sm font-bold uppercase text-xs tracking-wider flex items-center justify-between hover:bg-crimson hover:text-white transition-colors"
                >
                    워크스페이스 입장 <ArrowRight size={16}/>
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">설교 준비 상태</h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">진행률</span>
                        <span className="text-xs font-bold text-slate-900">
                            {Math.round(phases.reduce((acc, curr) => acc + curr.progress, 0) / 5)}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-crimson" style={{ width: `${phases.reduce((acc, curr) => acc + curr.progress, 0) / 5}%` }}></div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
