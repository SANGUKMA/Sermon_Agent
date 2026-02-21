
import React, { useState, useEffect } from 'react';
import { SermonProject, SermonSeries, TheologicalProfile, SermonMode, DEFAULT_PROJECT } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { X, BookOpen, Calendar, Layers, Zap, PenTool, FileText } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: SermonProject) => void;
  series: SermonSeries[];
  profile: TheologicalProfile;
  initialSeriesId?: string;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreate, series, profile, initialSeriesId }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newPassage, setNewPassage] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSeriesId, setNewSeriesId] = useState(initialSeriesId || '');
  const [creationMode, setCreationMode] = useState<SermonMode>('deep');

  useEffect(() => {
    if (initialSeriesId) {
      setNewSeriesId(initialSeriesId);
    }
  }, [initialSeriesId, isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    const project: SermonProject = {
      ...DEFAULT_PROJECT,
      id: uuidv4(),
      title: newTitle || '제목 없는 설교',
      passage: newPassage,
      date: newDate,
      seriesId: newSeriesId,
      mode: creationMode,
      lastModified: Date.now(),
    };
    onCreate(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <PenTool size={20} className="text-crimson" /> 새 설교 프로젝트
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">설교 준비 방식</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setCreationMode('deep')}
                className={`flex-1 py-3 px-2 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${creationMode === 'deep' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <BookOpen size={16} /> 딥 모드 (Deep)
              </button>
              <button 
                onClick={() => setCreationMode('quick')}
                className={`flex-1 py-3 px-2 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${creationMode === 'quick' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <Zap size={16} /> 퀵 모드 (Quick)
              </button>
              <button 
                onClick={() => setCreationMode('manual')}
                className={`flex-1 py-3 px-2 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${creationMode === 'manual' ? 'bg-slate-500 text-white border-slate-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <FileText size={16} /> 수동 작성 (Blank)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic text-center">
              {creationMode === 'deep' && '단계별로 깊이 있는 연구와 묵상을 진행합니다.'}
              {creationMode === 'quick' && 'AI가 즉시 전체 설교 초안을 생성합니다.'}
              {creationMode === 'manual' && 'AI 도움 없이 빈 페이지에서 바로 원고를 작성합니다.'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">설교 제목</label>
            <input 
              type="text"
              autoFocus
              className="w-full bg-white border border-slate-300 p-3 rounded-sm text-base font-serif text-slate-900 focus:ring-1 focus:ring-crimson focus:border-crimson outline-none shadow-sm placeholder:text-slate-300" 
              placeholder="예: 하나님 나라의 비전" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">본문 구절</label>
              <input 
                type="text"
                className="w-full bg-white border border-slate-300 p-3 rounded-sm text-base font-serif text-slate-900 focus:ring-1 focus:ring-crimson focus:border-crimson outline-none shadow-sm placeholder:text-slate-300" 
                placeholder="예: 마태복음 5:1-12" 
                value={newPassage} 
                onChange={e => setNewPassage(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">설교 일자</label>
              <input 
                type="date"
                className="w-full bg-white border border-slate-300 p-3 rounded-sm text-sm font-sans text-slate-900 focus:ring-1 focus:ring-crimson focus:border-crimson outline-none shadow-sm" 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">관련 시리즈 (선택)</label>
            <select 
              className="w-full bg-white border border-slate-300 p-3 rounded-sm text-sm font-serif text-slate-900 focus:ring-1 focus:ring-crimson focus:border-crimson outline-none shadow-sm appearance-none"
              value={newSeriesId}
              onChange={e => setNewSeriesId(e.target.value)}
            >
              <option value="">시리즈 없음</option>
              {series.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-700 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleCreate}
            className={`px-8 py-2.5 text-white font-bold text-[10px] uppercase tracking-widest rounded-sm shadow-lg transition-all ${
                creationMode === 'quick' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 
                creationMode === 'manual' ? 'bg-slate-700 hover:bg-slate-800 shadow-slate-200' :
                'bg-crimson hover:bg-crimson-hover shadow-crimson/20'}`}
          >
            워크스페이스 입장
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
