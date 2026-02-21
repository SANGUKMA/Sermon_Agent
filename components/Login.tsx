
import React, { useState } from 'react';
import { APP_CONFIG } from '../constants';
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, User, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!email || !password) {
        setError("이메일과 비밀번호를 입력해주세요.");
        return;
    }

    if (isSignUp) {
        if (password !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (password.length < 6) {
            setError("비밀번호는 6자 이상이어야 합니다.");
            return;
        }
    }

    setIsLoading(true);

    try {
        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            });
            if (error) throw error;
            if (data.session) {
                onLogin(data.session.user.email || email);
            } else {
                setError("회원가입 확인 메일을 확인해주세요.");
            }
        } else {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            if (data.session) {
                onLogin(data.session.user.email || email);
            }
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || "인증에 실패했습니다.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-crimson/90 to-slate-900/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        
        <div className="relative z-20">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-6">
             <span className="font-serif font-black text-xl">G</span>
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4 leading-tight">
            설교 준비의 새로운 기준,<br/>
            {APP_CONFIG.appName}
          </h1>
          <p className="text-slate-300 text-lg font-light leading-relaxed max-w-md">
            깊이 있는 주석 연구부터 감동적인 원고 작성까지.<br/>
            AI와 함께 목회 본질에 집중하세요.
          </p>
        </div>

        <div className="relative z-20 space-y-6">
           <div className="flex gap-4 items-start">
              <div className="p-1 bg-white/20 rounded-full mt-1"><CheckCircle2 size={16} /></div>
              <div>
                 <h4 className="font-bold text-sm uppercase tracking-wider mb-1">Deep Research</h4>
                 <p className="text-sm text-slate-400">학술적 주석 및 원어 연구 지원</p>
              </div>
           </div>
           <div className="flex gap-4 items-start">
              <div className="p-1 bg-white/20 rounded-full mt-1"><CheckCircle2 size={16} /></div>
              <div>
                 <h4 className="font-bold text-sm uppercase tracking-wider mb-1">Doctrinal Safety</h4>
                 <p className="text-sm text-slate-400">교단별 신학적 가이드라인 준수</p>
              </div>
           </div>
           <div className="mt-8 pt-8 border-t border-white/10 text-xs text-slate-500">
              © {new Date().getFullYear()} Sermon AI Assistant. All rights reserved.
           </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 font-serif mb-2">
                {isSignUp ? '계정 생성' : '환영합니다'}
            </h2>
            <p className="text-slate-500">
                {isSignUp ? '새로운 워크스페이스를 설정합니다.' : '워크스페이스에 접근하려면 로그인하세요.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">이름 (목회자명)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crimson focus:border-crimson sm:text-sm transition-all bg-slate-50 focus:bg-white"
                            placeholder="김목사"
                        />
                    </div>
                </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">이메일 주소</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crimson focus:border-crimson sm:text-sm transition-all bg-slate-50 focus:bg-white"
                  placeholder="pastor@church.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crimson focus:border-crimson sm:text-sm transition-all bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {isSignUp && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">비밀번호 확인</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <CheckCircle2 size={18} />
                        </div>
                        <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 sm:text-sm transition-all bg-slate-50 focus:bg-white ${
                            confirmPassword && password !== confirmPassword 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-slate-200 focus:ring-crimson focus:border-crimson'
                        }`}
                        placeholder="••••••••"
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded-sm flex items-center gap-2 animate-in slide-in-from-left-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                    {error}
                </div>
            )}

            {!isSignUp && (
                <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-crimson focus:ring-crimson border-slate-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                    로그인 상태 유지
                    </label>
                </div>

                <div className="text-sm">
                    <a href="#" className="font-medium text-crimson hover:text-crimson-dark">
                    비밀번호 찾기
                    </a>
                </div>
                </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-sm text-white bg-crimson hover:bg-crimson-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crimson transition-all uppercase tracking-wider shadow-lg shadow-crimson/20 disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? <UserPlus size={18}/> : <LogIn size={18}/>}
                    {isSignUp ? '회원가입 완료' : '로그인'} 
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
             <p className="text-slate-500 text-sm">
                 {isSignUp ? '이미 계정이 있으신가요? ' : '아직 회원이 아니신가요? '}
                 <button 
                    onClick={toggleMode}
                    className="font-bold text-crimson hover:underline focus:outline-none"
                 >
                     {isSignUp ? '로그인하기' : '회원가입하기'}
                 </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
