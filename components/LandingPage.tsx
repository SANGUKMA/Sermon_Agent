
import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../constants';
import {
  BookOpen, Sparkles, ShieldCheck, Cloud, FolderOpen, PenLine,
  ChevronDown, ChevronRight, Menu, X, ArrowRight, Check, Users, Zap
} from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToSignUp: () => void;
  onSkip: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin, onGoToSignUp, onSkip }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: BookOpen, title: '주석 연구', desc: '학술적 주석과 원어(히브리어·그리스어) 분석을 AI가 즉시 제공합니다.' },
    { icon: Sparkles, title: 'AI 초안 작성', desc: '본문 분석을 바탕으로 설교 초안을 자동 생성합니다.' },
    { icon: ShieldCheck, title: '신학 안전장치', desc: '교단별 신학 프로필에 맞춰 교리적 일관성을 검증합니다.' },
    { icon: Cloud, title: '클라우드 동기화', desc: '어떤 기기에서든 작업을 이어갈 수 있습니다.' },
    { icon: FolderOpen, title: '시리즈 관리', desc: '설교를 시리즈별로 체계적으로 분류·관리합니다.' },
    { icon: PenLine, title: '자유 묵상', desc: '빈 페이지에서 자유롭게 묵상하고 영감을 기록합니다.' },
  ];

  const steps = [
    { num: '01', title: '무료 가입', desc: '이메일 하나로 30초 만에 시작하세요.' },
    { num: '02', title: '본문 입력', desc: '설교 본문과 주제를 입력하면 준비 끝.' },
    { num: '03', title: 'AI 분석 & 원고', desc: '주석 연구부터 원고 초안까지 AI가 도와줍니다.' },
  ];

  const plans = [
    {
      name: '무료',
      price: '0',
      period: '',
      desc: '설교 준비를 체험해보세요',
      features: ['월 5회 AI 분석', '기본 주석 연구', '로컬 저장', '1개 설교 시리즈'],
      cta: '무료로 시작',
      highlighted: false,
    },
    {
      name: '프로',
      price: '19,900',
      period: '/월',
      desc: '개인 목회자를 위한 최적의 플랜',
      features: ['무제한 AI 분석', '심층 원어 연구', '클라우드 동기화', '무제한 시리즈', '맞춤 프롬프트', '우선 지원'],
      cta: '프로 시작하기',
      highlighted: true,
    },
    {
      name: '교회',
      price: '49,900',
      period: '/월',
      desc: '교회 전체 사역팀을 위한 플랜',
      features: ['프로 기능 전체 포함', '최대 10명 팀원', '팀 공유 워크스페이스', '관리자 대시보드', '설교 아카이브', '전담 지원'],
      cta: '문의하기',
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: 'AI가 생성한 설교를 그대로 사용해도 되나요?',
      a: 'AI는 설교 준비를 돕는 도구입니다. 주석 연구, 구조 제안, 초안 생성 등을 통해 목회자의 준비 시간을 단축해 드리지만, 최종 설교는 목회자의 영적 분별과 수정을 거쳐 완성하시길 권장합니다.',
    },
    {
      q: '어떤 교단의 신학을 지원하나요?',
      a: '개혁주의, 복음주의, 감리교, 오순절/은사주의 등 주요 교단의 신학적 프로필을 제공합니다. 설정에서 교단을 선택하면 AI가 해당 교단의 교리적 기준에 맞춰 응답합니다.',
    },
    {
      q: '데이터는 안전한가요?',
      a: '모든 데이터는 Supabase 클라우드에 암호화되어 저장됩니다. 오프라인 모드를 사용하면 브라우저 로컬에만 저장할 수도 있습니다. 사용자의 설교 데이터는 AI 학습에 사용되지 않습니다.',
    },
    {
      q: '무료 플랜에서 유료로 전환하면 데이터가 유지되나요?',
      a: '네, 플랜을 업그레이드해도 기존 데이터는 모두 유지됩니다. 로컬 데이터도 클라우드로 자동 병합됩니다.',
    },
    {
      q: '환불 정책은 어떻게 되나요?',
      a: '유료 플랜은 결제일로부터 14일 이내에 전액 환불이 가능합니다. 이후에는 남은 기간에 대한 일할 환불을 제공합니다.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* ─── Navigation Header ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-slate-200' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-sm bg-crimson flex items-center justify-center">
                <span className="font-serif font-black text-white text-sm">G</span>
              </div>
              <span className="font-serif font-bold text-lg">{APP_CONFIG.appName}</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('features')} className="text-sm text-slate-600 hover:text-crimson transition-colors">기능</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-slate-600 hover:text-crimson transition-colors">가격</button>
              <button onClick={() => scrollToSection('faq')} className="text-sm text-slate-600 hover:text-crimson transition-colors">FAQ</button>
              <button onClick={onGoToLogin} className="text-sm font-medium text-slate-700 hover:text-crimson transition-colors">로그인</button>
              <button onClick={onGoToSignUp} className="text-sm font-bold text-white bg-crimson hover:bg-crimson-hover px-4 py-2 rounded-sm transition-colors">
                시작하기
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 space-y-2">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-sm text-slate-600 hover:text-crimson">기능</button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 text-sm text-slate-600 hover:text-crimson">가격</button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-2 text-sm text-slate-600 hover:text-crimson">FAQ</button>
              <hr className="border-slate-100" />
              <button onClick={onGoToLogin} className="block w-full text-left py-2 text-sm font-medium text-slate-700">로그인</button>
              <button onClick={onGoToSignUp} className="block w-full text-center py-2.5 text-sm font-bold text-white bg-crimson hover:bg-crimson-hover rounded-sm">시작하기</button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-crimson-light text-crimson text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
                <Zap size={14} />
                AI 기반 설교 준비 도구
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black leading-tight mb-6 text-slate-900">
                설교 준비의<br />
                <span className="text-crimson">새로운 기준</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                깊이 있는 주석 연구부터 감동적인 원고 작성까지.
                AI와 함께 목회 본질에 집중하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onGoToSignUp}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-crimson hover:bg-crimson-hover rounded-sm transition-all shadow-lg shadow-crimson/20 uppercase tracking-wider"
                >
                  무료로 시작하기
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={onSkip}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-sm transition-all"
                >
                  오프라인으로 체험
                </button>
              </div>
            </div>

            {/* Right: App Mockup */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Browser Frame */}
                <div className="bg-white rounded-sm shadow-card border border-slate-200 overflow-hidden">
                  {/* Title Bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="inline-block bg-white border border-slate-200 rounded-sm px-4 py-1 text-xs text-slate-400">
                        sermon-ai.app
                      </div>
                    </div>
                  </div>
                  {/* Mock Content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-sm bg-crimson flex items-center justify-center">
                        <span className="font-serif font-black text-white text-xs">G</span>
                      </div>
                      <div>
                        <div className="h-3 w-28 bg-slate-200 rounded-full"></div>
                        <div className="h-2 w-20 bg-slate-100 rounded-full mt-1.5"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-sm p-3 space-y-2">
                          <div className="h-2.5 w-full bg-slate-200 rounded-full"></div>
                          <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
                          <div className="h-2 w-1/2 bg-slate-100 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-crimson-light border border-crimson/10 rounded-sm p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-crimson" />
                        <div className="h-2.5 w-24 bg-crimson/20 rounded-full"></div>
                      </div>
                      <div className="h-2 w-full bg-crimson/10 rounded-full"></div>
                      <div className="h-2 w-5/6 bg-crimson/10 rounded-full"></div>
                      <div className="h-2 w-2/3 bg-crimson/10 rounded-full"></div>
                    </div>
                  </div>
                </div>
                {/* Decorative */}
                <div className="absolute -z-10 -top-4 -right-4 w-full h-full bg-crimson/5 rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-black mb-4">목회자를 위해 설계된 기능</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              설교 준비의 모든 단계를 체계적으로 지원합니다.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-6 bg-white border border-slate-200 rounded-sm hover:shadow-card hover:border-crimson/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-sm bg-crimson-light flex items-center justify-center mb-4 group-hover:bg-crimson group-hover:text-white transition-colors">
                  <f.icon size={20} className="text-crimson group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-serif font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-black mb-4">3단계로 시작하세요</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              복잡한 설정 없이 바로 설교 준비를 시작할 수 있습니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-crimson text-white font-serif font-bold text-lg mb-4">
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t-2 border-dashed border-slate-300"></div>
                )}
                <h3 className="font-serif font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-black mb-4">구독 상품 안내</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              필요에 맞는 플랜을 선택하세요. 모든 유료 플랜은 월간 정기결제이며, 언제든지 해지할 수 있습니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col p-6 rounded-sm border transition-all ${
                  plan.highlighted
                    ? 'border-crimson shadow-lg shadow-crimson/10 scale-105'
                    : 'border-slate-200 hover:shadow-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-crimson text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    추천
                  </div>
                )}
                <h3 className="font-serif font-bold text-xl mb-1">{plan.name} 플랜</h3>
                <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>
                <div className="mb-2">
                  <span className="text-4xl font-black font-serif">₩{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
                {plan.period && (
                  <p className="text-xs text-slate-400 mb-4">매월 자동 결제 · VAT 포함 · 언제든 해지 가능</p>
                )}
                {!plan.period && (
                  <p className="text-xs text-slate-400 mb-4">신용카드 등록 없이 무료 이용</p>
                )}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check size={16} className="text-crimson mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGoToSignUp}
                  className={`w-full py-3 text-sm font-bold rounded-sm transition-all uppercase tracking-wider ${
                    plan.highlighted
                      ? 'bg-crimson text-white hover:bg-crimson-hover shadow-lg shadow-crimson/20'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-crimson hover:text-crimson'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">
            결제는 토스페이먼츠를 통해 안전하게 처리됩니다. 유료 플랜은 회원가입 후 결제할 수 있습니다.
          </p>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-black mb-4">자주 묻는 질문</h2>
            <p className="text-slate-500">궁금한 점이 있으시면 언제든지 문의해주세요.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-serif font-bold text-sm sm:text-base pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-crimson">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            무료 플랜으로 {APP_CONFIG.appName}의 모든 핵심 기능을 체험해보세요.
            설교 준비가 달라집니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onGoToSignUp}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold bg-white text-crimson hover:bg-slate-50 rounded-sm transition-all uppercase tracking-wider"
            >
              무료 회원가입
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onGoToLogin}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium text-white/90 hover:text-white border border-white/30 hover:border-white/60 rounded-sm transition-all"
            >
              이미 계정이 있으신가요?
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-white/10 flex items-center justify-center">
                <span className="font-serif font-black text-white text-xs">G</span>
              </div>
              <span className="font-serif font-bold text-white text-sm">{APP_CONFIG.appName}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">기능</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">가격</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button>
              <button onClick={onGoToLogin} className="hover:text-white transition-colors">로그인</button>
            </div>
          </div>

          {/* ─── 사업자정보 ─── */}
          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-500 leading-relaxed">
              <div className="space-y-1">
                <p><span className="text-slate-400">상호:</span> 스파크AI교육연구소</p>
                <p><span className="text-slate-400">대표:</span> 마상욱</p>
                <p><span className="text-slate-400">사업자등록번호:</span> 142-82-03136</p>
                <p><span className="text-slate-400">업태:</span> 교육서비스업 | <span className="text-slate-400">종목:</span> AI컨설팅, 교육</p>
              </div>
              <div className="space-y-1">
                <p><span className="text-slate-400">사업장 주소:</span> 경기도 용인시 기흥구 사은로 126번길 10 113동 103호</p>
                <p><span className="text-slate-400">전화:</span> 031-8005-8630</p>
                <p><span className="text-slate-400">이메일:</span> issacma@naver.com</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {APP_CONFIG.appName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
