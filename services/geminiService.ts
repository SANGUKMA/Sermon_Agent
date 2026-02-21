
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
  const isFridayMeeting = audience?.description?.includes('금요') || audience?.currentSituation?.includes('일주일');
  let instruction = `\n[설교 컨텍스트]:
- 시간: ${targetTime || 20}분 분량
- 청중: ${audience?.description || '성도'} (상황: ${audience?.currentSituation || '일반'})`;

  if (isFridayMeeting) {
    instruction += `
- 금요기도회 특수 지침:
  1. 감성적 공감: 한 주간 회사, 사업, 가사 등으로 지친 성도들의 노고를 위로하는 따뜻한 언어를 사용하십시오.
  2. 영적 회복: 약해진 신앙이 다시 일어설 수 있도록 '소망'과 '능력'의 메시지를 강조하십시오.
  3. 기도 연결: 설교 대지마다 기도로 연결될 수 있는 강력한 선포적 문구를 포함하고, 결론에는 뜨거운 통성기도를 위한 구체적인 제목 3가지를 제시하십시오.`;
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
    [특수 지침]: 이 연구가 일주일의 삶에 지친 성도들에게 어떤 영적 의미와 소망을 주는지 연결점을 찾아 기술하십시오.
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
    각 대지는 성도의 삶의 현장(직장, 사업 등)과 긴밀히 연결되어야 합니다.
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
    1. 20분 분량의 기도회 설교답게 성도들의 가슴을 뜨겁게 하는 선포적 어조를 사용하십시오.
    2. 세상에서 지쳐 돌아온 성도들을 안아주는 하나님의 사랑과 회복의 약속을 매 대지마다 강조하십시오.
    3. 결론에는 뜨거운 통성기도로 나아갈 수 있는 구체적인 기도 제목들을 제시하며 마무리하십시오.
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
    contents: { parts: [{ text: `핵심 대지 및 선포 요약, 그리고 기도회 인도용 기도 제목 추출: ${draft}` }] },
  }));
  return response.text || "";
};

export const generateMeditationTemplate = async (): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: "세상살이에 지친 목회자와 성도를 위한 위로와 회복의 묵상 질문 3가지 생성." }] },
  }));
  return response.text || "";
};

export const generateMeditationIntegration = async (journal: string, passage: string): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: `목회자의 개인 묵상(${journal})을 지친 성도들을 향한 소망의 메시지로 승화시켜 본문(${passage})과 연결 제안.` }] },
  }));
  return response.text || "";
};

export const performDoctrinalReview = async (draft: string, profile?: TheologicalProfile): Promise<string> => {
  const ai = getAI();
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: `신학적 건전성 및 금요기도회 취지(회복과 소망) 부합 여부 검토: ${draft}\n${getProfileInstruction(profile)}` }] },
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
    contents: { parts: [{ text: `본문 ${passage}의 단어 "${word}" 원어 의미와 지친 성도에게 주는 신학적 소망 분석.` }] },
  }));
  return response.text || "";
};

export const generateOIAInsight = async (observation: string, passage: string, profile?: TheologicalProfile): Promise<{ interpretation: string, application: string }> => {
  const ai = getAI();
  const prompt = `본문(${passage}) 관찰: "${observation}"\n위 내용을 바탕으로 일주일의 삶을 위로하는 신학적 해석과 실천적 적용 제안.\n${getProfileInstruction(profile)}`;

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
  const prompt = `설교 문체 수정(지친 성도를 향한 위로의 톤): "${text}"\n지시: ${instruction}`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: FLASH_MODEL,
    contents: { parts: [{ text: prompt }] },
  }));

  return response.text || text;
};
