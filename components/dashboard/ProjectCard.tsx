
import React from 'react';
import { Calendar, Layers, Trash2, Clock, Zap, Lock, Unlock, FileText } from 'lucide-react';
import { SermonProject, SermonSeries } from '../../types';

interface ProjectCardProps {
    project: SermonProject;
    series: SermonSeries[];
    onOpenProject: (project: SermonProject) => void;
    onDeleteProject: (id: string) => void;
    onToggleLock?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, series, onOpenProject, onDeleteProject, onToggleLock }) => {
    const projectSeries = series.find(s => s.id === project.seriesId);
    
    const handleToggleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleLock) onToggleLock(project.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (project.isLocked) {
            alert("이 설교는 잠겨있습니다. 먼저 잠금을 해제해주세요.");
            return;
        }
        onDeleteProject(project.id);
    };

    const getBorderColor = () => {
        if (project.isLocked) return 'border-slate-300';
        if (project.mode === 'manual') return 'border-slate-200';
        return 'border-slate-200';
    };

    const getTopBarColor = () => {
        if (project.isLocked) return 'bg-slate-400';
        if (project.mode === 'quick') return 'bg-amber-500';
        if (project.mode === 'manual') return 'bg-slate-500';
        return 'bg-crimson';
    };

    return (
      <div 
          onClick={() => onOpenProject(project)}
          className={`group bg-white rounded-sm border p-0 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col relative overflow-hidden h-full ${getBorderColor()}`}
      >
          <div className={`h-1 w-full transition-all ${getTopBarColor()} group-hover:h-2`}></div>
          <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 flex-wrap">
                      {project.date && (
                          <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded-sm flex items-center gap-1 bg-slate-50">
                              <Calendar size={10} /> {new Date(project.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                          </span>
                      )}
                      {projectSeries && (
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider border border-indigo-100 bg-indigo-50 px-2 py-0.5 rounded-sm flex items-center gap-1">
                              <Layers size={10} /> {projectSeries.title}
                          </span>
                      )}
                      {project.mode === 'manual' && (
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-sm flex items-center gap-1">
                              <FileText size={10} /> Manual
                          </span>
                      )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={handleToggleLock} 
                        className={`p-1 rounded transition-colors ${project.isLocked ? 'text-crimson bg-crimson-light/30' : 'text-slate-300 hover:text-slate-600'}`}
                        title={project.isLocked ? '잠금 해제' : '프로젝트 잠금'}
                      >
                          {project.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <button 
                        onClick={handleDelete} 
                        className={`p-1 transition-colors ${project.isLocked ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-crimson'}`}
                        title={project.isLocked ? '잠긴 프로젝트는 삭제할 수 없습니다' : '휴지통으로 이동'}
                      >
                          <Trash2 size={14} />
                      </button>
                  </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                  {project.isLocked && <Lock size={12} className="text-crimson shrink-0" />}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-crimson transition-colors leading-tight font-serif line-clamp-2">
                      {project.title}
                  </h3>
              </div>
              <p className="text-slate-500 text-xs font-serif italic border-l-2 border-slate-100 pl-2 mb-4 line-clamp-1">
                  {project.passage || "본문 없음"}
              </p>
          </div>
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                  <Clock size={12} /> {new Date(project.lastModified).toLocaleDateString()}
              </div>
              {project.mode === 'quick' && <Zap size={12} className="text-amber-500"/>}
              {project.mode === 'manual' && <FileText size={12} className="text-slate-400"/>}
          </div>
      </div>
    );
};
