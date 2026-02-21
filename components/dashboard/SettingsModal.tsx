
import React, { useState, useEffect } from 'react';
import { UserCog, BookOpen, ShieldAlert, AlertCircle, Eye, Check, Palette, Database, ExternalLink, Zap, Layout } from 'lucide-react';
import { TheologicalProfile, AVAILABLE_COLOR_SETS } from '../../types';
import { getProfileInstruction } from '../../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TheologicalProfile;
  onUpdateProfile: (profile: TheologicalProfile) => void;
  currentThemeId: string;
  onThemeChange?: (themeId: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, profile, onUpdateProfile, currentThemeId, onThemeChange 
}) => {
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'subscription'>('profile');
  const [localProfile, setLocalProfile] = useState<TheologicalProfile>(profile);

  useEffect(() => {
    if (isOpen) {
      setLocalProfile(profile);
    }
  }, [isOpen, profile]);

  const handleSaveProfile = () => {
      onUpdateProfile(localProfile);
      alert("프로필이 업데이트되었습니다.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
         <div className="bg-white rounded-sm shadow-2xl p-0 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                <button onClick={() => setSettingsTab('profile')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${settingsTab === 'profile' ? 'bg-white text-crimson border-t-2 border-t-crimson' : 'text-slate-500 hover:text-slate-700'}`}>
                    신학적 프로필 (Theological Profile)
                </button>
                <button onClick={() => setSettingsTab('appearance')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${settingsTab === 'appearance' ? 'bg-white text-crimson border-t-2 border-t-crimson' : 'text-slate-500 hover:text-slate-700'}`}>
                    화면 설정 (Appearance)
                </button>
                <button onClick={() => setSettingsTab('subscription')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${settingsTab === 'subscription' ? 'bg-white text-crimson border-t-2 border-t-crimson' : 'text-slate-500 hover:text-slate-700'}`}>
                    API 및 한도 (API Quota)
                </button>
            </div>

            <div className="p-0 overflow-y-auto flex-1 bg-[#f9fafb]">
                {/* --- Theological Profile Tab --- */}
                {settingsTab === 'profile' && (
                    <div className="flex flex-col lg:flex-row h-full">
                        {/* Left: Input Form */}
                        <div className="flex-1 p-8 overflow-y-auto border-r border-slate-200 bg-white">
                            <div className="bg-blue-50 p-4 rounded-sm border border-blue-100 flex gap-3 mb-8">
                                <UserCog className="text-blue-600 shrink-0 mt-0.5" size={20} />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-blue-900">AI 페르소나 설정</h4>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        교단적 배경과 선호하는 설교 구조를 입력하십시오. AI가 이 설정을 바탕으로 원고를 구성합니다.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Identity Section */}
                                <section className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                        <BookOpen size={14}/> 정체성 및 스타일
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">교단 / 신학적 전통</label>
                                            <input type="text" className="w-full border border-slate-300 p-2.5 rounded-sm text-sm focus:ring-1 focus:ring-crimson focus:border-crimson outline-none bg-white text-slate-900 shadow-sm" 
                                                value={localProfile.denomination} 
                                                onChange={e => setLocalProfile({...localProfile, denomination: e.target.value})}
                                                placeholder="예: 대한예수교장로회 (합동)"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">주요 설교 스타일</label>
                                            <input type="text" className="w-full border border-slate-300 p-2.5 rounded-sm text-sm focus:ring-1 focus:ring-crimson focus:border-crimson outline-none bg-white text-slate-900 shadow-sm" 
                                                value={localProfile.style} 
                                                onChange={e => setLocalProfile({...localProfile, style: e.target.value})}
                                                placeholder="예: 강해 설교"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Structure Section */}
                                <section className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                        <Layout size={14}/> 설교 구조 설정
                                    </h4>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">기본 설교 구조 (Default Structure)</label>
                                        <input type="text" className="w-full border border-slate-300 p-2.5 rounded-sm text-sm focus:ring-1 focus:ring-crimson focus:border-crimson outline-none bg-white text-slate-900 shadow-sm" 
                                            value={localProfile.preferredStructure} 
                                            onChange={e => setLocalProfile({...localProfile, preferredStructure: e.target.value})}
                                            placeholder="예: 서론 - 본론(1, 2, 3대지) - 결론"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-2 italic">* 모든 AI 생성 결과물이 이 구조를 따르도록 강제됩니다.</p>
                                    </div>
                                </section>
                                
                                {/* Guardrail Section */}
                                <section className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                        <ShieldAlert size={14}/> 신학적 안전장치
                                    </h4>
                                    
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-3 uppercase">신학적 스펙트럼</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Conservative', 'Moderate', 'Broad Evangelical', 'Progressive'].map((opt) => (
                                                <div 
                                                    key={opt}
                                                    onClick={() => setLocalProfile({...localProfile, guardrail: opt})}
                                                    className={`cursor-pointer border p-3 rounded-sm flex items-center gap-2 transition-all ${localProfile.guardrail === opt ? 'border-crimson bg-crimson-light/10 ring-1 ring-crimson' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${localProfile.guardrail === opt ? 'border-crimson' : 'border-slate-300'}`}>
                                                        {localProfile.guardrail === opt && <div className="w-2 h-2 rounded-full bg-crimson"></div>}
                                                    </div>
                                                    <span className={`text-xs font-bold ${localProfile.guardrail === opt ? 'text-crimson' : 'text-slate-600'}`}>{opt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Right: Preview Panel */}
                        <div className="w-full lg:w-[400px] bg-slate-900 text-slate-300 p-8 flex flex-col shrink-0 border-l border-slate-800 shadow-inner">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Eye size={14}/> AI 프롬프트 미리보기
                            </h4>
                            
                            <div className="bg-slate-950 rounded-md p-4 border border-slate-800 flex-1 font-mono text-[11px] overflow-y-auto leading-relaxed text-green-400/90 shadow-inner whitespace-pre-wrap">
                                <div className="opacity-50 mb-4">// System Instruction Preview</div>
                                {getProfileInstruction(localProfile)}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-slate-800">
                                <button 
                                    onClick={handleSaveProfile} 
                                    className="w-full bg-crimson text-white py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-crimson-hover shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={16}/> 프로필 저장 및 적용
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- Appearance Tab --- */}
                {settingsTab === 'appearance' && (
                    <div className="p-8 max-w-3xl mx-auto">
                        <div className="space-y-8 bg-white p-8 rounded-sm shadow-sm border border-slate-200">
                            <div className="flex gap-4 items-start border-b border-slate-100 pb-6">
                                <div className="p-3 bg-slate-100 rounded-sm">
                                    <Palette className="text-slate-600" size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">테마 컬러</h4>
                                    <p className="text-sm text-slate-500">선택 즉시 적용됩니다.</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {AVAILABLE_COLOR_SETS.map((theme) => (
                                    <button 
                                        key={theme.id}
                                        onClick={() => onThemeChange && onThemeChange(theme.id)}
                                        className={`p-4 rounded-sm border-2 text-left transition-all relative flex flex-col gap-3 group ${currentThemeId === theme.id ? 'border-slate-900 bg-slate-50 shadow-md transform scale-[1.02]' : 'border-slate-200 hover:border-slate-300 hover:bg-white'}`}
                                    >
                                        <div className="flex gap-1.5">
                                            <div className="w-8 h-8 rounded-full shadow-sm ring-1 ring-black/5" style={{ backgroundColor: theme.colors.primary }}></div>
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 block group-hover:text-slate-900">{theme.name}</span>
                                        </div>
                                        {currentThemeId === theme.id && (
                                            <div className="absolute top-3 right-3 text-slate-900 bg-white rounded-full p-1 shadow-sm"><Check size={14} /></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- API & Quota Tab --- */}
                {settingsTab === 'subscription' && (
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-200 space-y-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="bg-amber-100 p-3 rounded-full text-amber-600"><AlertCircle size={24} /></div>
                                    <div><h4 className="text-lg font-bold text-slate-900 mb-1 font-serif">API 한도 관리</h4></div>
                                </div>
                                <a href="https://aistudio.google.com/app/plan_information" target="_blank" rel="noreferrer" className="block w-full text-center bg-white border border-slate-300 text-slate-700 py-3 rounded-sm font-bold text-xs uppercase tracking-widest hover:border-crimson hover:text-crimson transition-all flex items-center justify-center gap-2">
                                    <ExternalLink size={14} /> 요금제 및 한도 확인하기
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 z-10">
                <div className="text-[10px] text-slate-400">Settings changes are auto-saved locally.</div>
                <button onClick={onClose} className="text-slate-500 text-xs hover:text-slate-900 font-bold uppercase px-6 py-2 border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors">닫기</button>
            </div>
         </div>
      </div>
  );
};

export default SettingsModal;
