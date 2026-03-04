
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SermonProject, TheologicalProfile, AudienceContext, DraftOption } from "../types";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const FLASH_MODEL = "gemini-3-flash-preview";
const PRO_MODEL = "gemini-3-pro-preview";

const cleanJson = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

// Custom error class for AI-related errors
export class AIError extends Error {
  public isQuota: boolean;
  constructor(message: string, isQuota = false) {
    super(message);
    this.name = 'AIError';
    this.isQuota = isQuota;
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 4, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.status || error?.code;
    const errorMessage = error?.message || "";
    const isQuotaError = status === 429 || errorMessage.includes('429') || errorMessage.includes('quota');
    const isRetriable = isQuotaError || status === 503 || status === 504;

    if (retries > 0 && isRetriable) {
      const nextDelay = isQuotaError ? delay * 3 : delay * 2;
      console.warn(`Gemini API Quota/Status: ${status}. Retrying in ${nextDelay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      return withRetry(fn, retries - 1, nextDelay);
    }
    if (isQuotaError) throw new AIError("API 사용량이 일시적으로 초과되었습니다. 약 1분 후 다시 시도해주세요.", true);
    throw new AIError(error.message || "AI 요청에 실패했습니다.");
  }
}

export interface StructureOption {
  name: string;
  description: string;
  outline: string;
}

export const getProfileInstruction = (profile?: TheologicalProfile) => {
  if (!profile) return "";
  const guardrailInstruction = profile.guardrail
    ? `\n- 신학적 가이드라인: "${profile.guardrail}" 준수.`
    : "";

  return `THEOLOGICAL PROFILE:
- 전통: ${profile.denomination}, 스타일: ${profile.style}
- 지양: ${profile.avoidance}${guardrailInstruction}
- 구조 원칙: 반드시 "서론 - 본론 1, 2, 3 - 결론"의 삼대지 형식을 유지하십시오.

INSTRUCTION:
- 모든 설교는 성경적 근거(배경, 원어, 신학)가 탄탄해야 하며, 동시에 청중의 삶에 깊이 공명해야 합니다.
- 한국어로만 답변하십시오.`;
};

const getContextInstruction = (audience?: AudienceContext, goal?: string, targetTime?: number) => {
  const isSundayService = audience?.description?.includes('주일') || audience?.currentSituation?.includes('주일');
  let instruction = `\n[설교 컨텍스트]:
- 시간: ${targetTime || 20}분 분량
- 청중: ${audience?.description || '성도'} (상황: ${audience?.currentSituation || '일반'})`;

  if (isSundayService) {
    instruction += `
- 주일예배 특수 지침:
  1. 경배와 찬양: 거룩한 주일에 하나님을 예배하는 성도들의 마음을 고양시키는 경건한 언어를 사용하십시오.
  2. 말씀 중심: 성경 본문의 핵심 메시지가 성도들의 삶 속에 깊이 뿌리내릴 수 있도록 '진리'와 '변화'의 메시지를 강조하십시오.
  3. 삶의 적용: 설교 대지마다 성도들이 한 주의 삶에서 실천할 수 있는 구체적인 적용점을 제시하고, 결론에는 말씀으로 변화된 삶을 향한 결단과 헌신을 이끌어 내십시오.`;
  }

  if (goal) instruction += `\n- 설교 목표: ${goal}`;
  return instruction;
};

export const chatWithSermonAI = async (
  userMessage: string,
  project: SermonProject,
  profile?: TheologicalProfile,
  activeStage?: string
): Promise<string> => {
  const ai = getAI();
  const prompt = `
    현재 설교: ${project.title} (${project.passage})
    단계: ${activeStage || '대화'}
    ${getProfileInstruction(profile)}
    ${getContextInstruction(project.audienceContext, project.sermonGoal, project.preachingSettings?.targetTime)}
    질문: "${userMessage}"
  `;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: prompt }] },
  }));

  return response.text || "답변을 생성할 수 없습니다.";
};

export const generateExegesisHelp = async (
  passage: string,
  type: 'historical' | 'language' | 'theology',
  currentContent?: string,
  instruction?: string,
  profile?: TheologicalProfile
): Promise<string> => {
  const ai = getAI();
  const contextMap = { historical: "배경연구", language: "원어 연구", theology: "신학적 주제" };
  const prompt = `
    본문: ${passage}
    분야: ${contextMap[type]}
    ${getProfileInstruction(profile)}
    [특수 지침]: 이 연구가 주일 예배에 모인 성도들의 신앙과 삶에 어떤 영적 의미와 변화를 주는지 연결점을 찾아 기술하십시오.
    요청: ${instruction || '깊이 있는 분석 제공'}
  `;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: prompt }] },
  }));

  return response.text || currentContent || "연구 결과 생성 실패";
};

export const generateStructureOptions = async (
  title: string,
  passage: string,
  theme: string,
  profile?: TheologicalProfile,
  audience?: AudienceContext,
  goal?: string
): Promise<StructureOption[]> => {
  const ai = getAI();
  const prompt = `
    설교 제목: ${title}
    본문: ${passage}
    주제: ${theme}
    ${getProfileInstruction(profile)}
    ${getContextInstruction(audience, goal, 20)}
    위 정보를 바탕으로 '서론-본론1,2,3-결론'의 삼대지 구조 3가지를 제안하십시오.
    각 대지는 성도의 신앙 성장과 삶의 변화에 긴밀히 연결되어야 합니다.
  `;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            outline: { type: Type.STRING },
          },
          required: ["name", "description", "outline"],
        }
      }
    },
  }));

  return JSON.parse(cleanJson(response.text || "[]")) as StructureOption[];
};

export const generateSermonDraft = async (project: SermonProject, profile?: TheologicalProfile, options?: DraftOption): Promise<string> => {
  const ai = getAI();
  const prompt = `
    원고 작성: ${project.title} (${project.passage})
    구조: ${project.structure}
    연구 데이터:
    - 배경: ${project.historicalContext}
    - 원어: ${project.originalLanguage}
    - 신학: ${project.theologicalThemes}

    ${getProfileInstruction(profile)}
    ${getContextInstruction(project.audienceContext, project.sermonGoal, project.preachingSettings?.targetTime)}

    [원고 작성 지침]:
    1. 20분 분량의 주일예배 설교답게 성도들의 마음을 감동시키는 경건하고 선포적인 어조를 사용하십시오.
    2. 주일에 하나님의 말씀을 사모하며 나아온 성도들을 향해 진리와 소망의 메시지를 매 대지마다 강조하십시오.
    3. 결론에는 말씀에 반응하여 삶 속에서 실천할 수 있는 구체적인 결단과 적용점을 제시하며 마무리하십시오.
  `;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: PRO_MODEL,
    contents: { parts: [{ text: prompt }] },
  }));

  return response.text || "원고 작성 실패";
};

export const generatePreachingNotes = async (draft: string): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: `핵심 대지 및 선포 요약, 그리고 주일예배 설교 핵심 메시지와 적용점 추출: ${draft}` }] },
  }));
  return response.text || "";
};

export const generateMeditationTemplate = async (): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: "주일 예배를 앞두고 말씀을 깊이 묵상하고자 하는 목회자를 위한 영적 묵상 질문 3가지 생성." }] },
  }));
  return response.text || "";
};

export const generateMeditationIntegration = async (journal: string, passage: string): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: `목회자의 개인 묵상(${journal})을 주일 예배 성도들을 향한 변화와 성장의 메시지로 승화시켜 본문(${passage})과 연결 제안.` }] },
  }));
  return response.text || "";
};

export const performDoctrinalReview = async (draft: string, profile?: TheologicalProfile): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: `신학적 건전성 및 주일예배 취지(말씀 중심의 예배와 삶의 변화) 부합 여부 검토: ${draft}\n${getProfileInstruction(profile)}` }] },
  }));
  return response.text || "";
};

export const analyzeImportedSermon = async (text: string): Promise<Partial<SermonProject>> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: `텍스트 분석 및 '서론-본론1,2,3-결론' 구조로 재구성: ${text}` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          passage: { type: Type.STRING },
          theme: { type: Type.STRING },
          structure: { type: Type.STRING },
          draft: { type: Type.STRING },
          applicationPoints: { type: Type.STRING }
        }
      }
    }
  }));
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const analyzeOriginalWord = async (word: string, passage: string): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: `본문 ${passage}의 단어 "${word}" 원어 의미와 주일 예배 성도에게 주는 신학적 소망 및 적용 분석.` }] },
  }));
  return response.text || "";
};

export const generateOIAInsight = async (observation: string, passage: string, profile?: TheologicalProfile): Promise<{ interpretation: string, application: string }> => {
  const ai = getAI();
  const prompt = `본문(${passage}) 관찰: "${observation}"\n위 내용을 바탕으로 주일 예배 성도들의 신앙 성장을 돕는 신학적 해석과 실천적 적용 제안.\n${getProfileInstruction(profile)}`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          interpretation: { type: Type.STRING },
          application: { type: Type.STRING }
        },
        required: ["interpretation", "application"]
      }
    }
  }));

  return JSON.parse(cleanJson(response.text || "{}"));
};

export const polishBlock = async (text: string, instruction: string, profile?: TheologicalProfile, explain: boolean = false): Promise<string> => {
  const ai = getAI();
  const prompt = `설교 문체 수정(주일 예배 성도를 향한 경건하고 선포적인 톤): "${text}"\n지시: ${instruction}`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: prompt }] },
  }));

  return response.text || text;
};

export const fetchBibleText = async (passage: string): Promise<string> => {
  const ai = getAI();
  const prompt = `성경 본문 "${passage}"의 전체 텍스트를 개역개정판 기준으로 절 번호와 함께 정확히 출력하십시오.
다른 설명이나 해설 없이 본문 텍스트만 출력하십시오.
형식 예시:
1 여호와는 나의 목자시니 내게 부족함이 없으리로다
2 그가 나를 푸른 초장에 누이시며...`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: prompt }] },
  }));

  return response.text || "본문을 불러올 수 없습니다.";
};
