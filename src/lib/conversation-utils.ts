/**
 * Utility functions for conversation management and keyword extraction
 * 从会话内容中提取关键词来生成有意义的会话标题
 */

import type { Conversation, ConversationSummary, ChatMessage, PatientData } from '@/types/conversation';

// 日本语医学术语和关键词模式
const MEDICAL_KEYWORDS = [
  // 疾病相关
  '睡眠时無呼吸症候群', 'OSA', 'OSAS', '無呼吸', 'イビキ', 'いびき',
  '上顎前突', '下顎後退', '開咬', '叢生', '反対咬合', '過蓋咬合',
  'Class II', 'Class III', 'Class I',
  
  // 解剖学相关
  '上顎', '下顎', '顎骨', '頸椎', '気道', '舌骨', 'PAS', 'MAS',
  '鼻咽腔', '口蓋', '舌', '扁桃腺', '咽頭', '喉頭',
  
  // 計測値相关
  'SNA', 'SNB', 'ANB', 'SN-MP', 'FMA', 'IMPA', 'FMIA',
  'Go-Gn', 'Co-Gn', 'N-Me', 'ANS-PNS', 'PNS-P',
  'U1-SN', 'L1-MP', 'Wits', 'ODI', 'APDI',
  
  // 治疗相关
  '矯正治療', '外科的治療', 'CPAP', 'OA', 'オーラルアプライアンス',
  '抜歯', '非抜歯', '拡大', '保定',
  
  // 年龄性别
  '歳', '才', '男性', '女性', '小児', '成人', '高齢者'
];

// 患者姓名模式（日本人名）
const NAME_PATTERNS = [
  /([田中|佐藤|鈴木|高橋|渡辺|伊藤|山本|中村|小林|加藤|吉田|山田|佐々木|山口|松本|井上|木村|林|清水|山崎|池田|橋本|阿部|石川|斎藤|前田][一-龯]{1,2})/g,
  /([あ-ん]{2,4}さん)/g,
  /([ア-ン]{2,4}さん)/g,
  /(患者[A-Z])/g,
  /(症例\d+)/g
];

// 年龄模式
const AGE_PATTERNS = [
  /(\d{1,2}歳)/g,
  /(\d{1,2}才)/g,
  /(年齢\s*:?\s*\d{1,2})/g
];

// 性别模式
const GENDER_PATTERNS = [
  /(男性|女性)/g,
  /(男|女)(?=の|性|、|。)/g
];

// 诊断模式
const DIAGNOSIS_PATTERNS = [
  /(Class\s*[IVX]+)/gi,
  /(上顎前突|下顎後退|反対咬合|開咬|叢生)/g,
  /(OSA|OSAS|睡眠時無呼吸症候群)/gi
];

/**
 * 从会话消息中提取关键信息
 */
export interface ExtractedKeywords {
  patientName?: string;
  age?: string;
  gender?: string;
  diagnosis?: string[];
  measurements?: string[];
  medicalTerms?: string[];
  primaryTopic?: string;
}

/**
 * 从消息内容中提取关键词
 */
export function extractKeywordsFromMessage(message: string): ExtractedKeywords {
  const keywords: ExtractedKeywords = {
    diagnosis: [],
    measurements: [],
    medicalTerms: []
  };

  // 提取患者姓名
  for (const pattern of NAME_PATTERNS) {
    const matches = message.match(pattern);
    if (matches && matches[0]) {
      keywords.patientName = matches[0].replace(/さん$/, '');
      break;
    }
  }

  // 提取年龄
  const ageMatch = message.match(AGE_PATTERNS[0]) || message.match(AGE_PATTERNS[1]) || message.match(AGE_PATTERNS[2]);
  if (ageMatch) {
    keywords.age = ageMatch[0];
  }

  // 提取性别
  const genderMatch = message.match(GENDER_PATTERNS[0]) || message.match(GENDER_PATTERNS[1]);
  if (genderMatch) {
    keywords.gender = genderMatch[0];
  }

  // 提取诊断
  for (const pattern of DIAGNOSIS_PATTERNS) {
    const matches = message.match(pattern);
    if (matches) {
      keywords.diagnosis?.push(...matches);
    }
  }

  // 提取医学术语
  const medicalTermsFound = MEDICAL_KEYWORDS.filter(term => 
    message.includes(term)
  );
  keywords.medicalTerms = [...new Set(medicalTermsFound)];

  // 提取测量值
  const measurementMatches = message.match(/[A-Z1-9-]+\s*[=:]\s*[0-9.-]+/g);
  if (measurementMatches) {
    keywords.measurements = measurementMatches.slice(0, 5); // 限制数量
  }

  return keywords;
}

/**
 * 从完整会话中提取关键词
 */
export function extractKeywordsFromConversation(messages: ChatMessage[]): ExtractedKeywords {
  const allKeywords: ExtractedKeywords = {
    diagnosis: [],
    measurements: [],
    medicalTerms: []
  };

  // 从所有消息中提取关键词
  messages.forEach(msg => {
    // 从用户消息和AI回复中提取
    const userKeywords = extractKeywordsFromMessage(msg.user_message);
    const aiKeywords = msg.ai_response ? extractKeywordsFromMessage(msg.ai_response) : {};

    // 合并关键词，优先使用第一个找到的患者信息
    if (!allKeywords.patientName && (userKeywords.patientName || aiKeywords.patientName)) {
      allKeywords.patientName = userKeywords.patientName || aiKeywords.patientName;
    }
    if (!allKeywords.age && (userKeywords.age || aiKeywords.age)) {
      allKeywords.age = userKeywords.age || aiKeywords.age;
    }
    if (!allKeywords.gender && (userKeywords.gender || aiKeywords.gender)) {
      allKeywords.gender = userKeywords.gender || aiKeywords.gender;
    }

    // 累积诊断、测量值和医学术语
    if (userKeywords.diagnosis) allKeywords.diagnosis?.push(...userKeywords.diagnosis);
    if (aiKeywords.diagnosis) allKeywords.diagnosis?.push(...aiKeywords.diagnosis);
    if (userKeywords.measurements) allKeywords.measurements?.push(...userKeywords.measurements);
    if (aiKeywords.measurements) allKeywords.measurements?.push(...aiKeywords.measurements);
    if (userKeywords.medicalTerms) allKeywords.medicalTerms?.push(...userKeywords.medicalTerms);
    if (aiKeywords.medicalTerms) allKeywords.medicalTerms?.push(...aiKeywords.medicalTerms);
  });

  // 去重
  allKeywords.diagnosis = [...new Set(allKeywords.diagnosis)];
  allKeywords.measurements = [...new Set(allKeywords.measurements)];
  allKeywords.medicalTerms = [...new Set(allKeywords.medicalTerms)];

  return allKeywords;
}

/**
 * 从患者数据中提取关键词
 */
export function extractKeywordsFromPatientData(patientData: PatientData): ExtractedKeywords {
  const keywords: ExtractedKeywords = {
    diagnosis: [],
    measurements: [],
    medicalTerms: []
  };

  if (patientData.name) {
    keywords.patientName = patientData.name;
  }

  if (patientData.age) {
    keywords.age = `${patientData.age}歳`;
  }

  if (patientData.gender) {
    keywords.gender = patientData.gender === 'male' ? '男性' : '女性';
  }

  // 从测量值中提取
  if (patientData.measurements) {
    keywords.measurements = Object.entries(patientData.measurements)
      .map(([key, value]) => `${key}=${value}`)
      .slice(0, 5);
  }

  // 从临床意义中提取诊断信息
  if (patientData.clinical_significance) {
    const clinicalText = Object.values(patientData.clinical_significance).join(' ');
    const extractedKeywords = extractKeywordsFromMessage(clinicalText);
    keywords.diagnosis = extractedKeywords.diagnosis || [];
    keywords.medicalTerms = extractedKeywords.medicalTerms || [];
  }

  return keywords;
}

/**
 * 生成基于关键词的会话标题
 */
export function generateConversationTitle(keywords: ExtractedKeywords, fallbackMessage?: string): string {
  // 如果有患者姓名，优先使用
  if (keywords.patientName) {
    const parts = [keywords.patientName];
    
    if (keywords.age) {
      parts.push(keywords.age);
    }
    if (keywords.gender) {
      parts.push(keywords.gender);
    }
    
    // 添加主要诊断
    if (keywords.diagnosis && keywords.diagnosis.length > 0) {
      parts.push(keywords.diagnosis[0]);
    } else if (keywords.medicalTerms && keywords.medicalTerms.length > 0) {
      parts.push(keywords.medicalTerms[0]);
    }
    
    return parts.join(' ');
  }

  // 如果没有患者姓名，但有诊断信息
  if (keywords.diagnosis && keywords.diagnosis.length > 0) {
    const parts = [];
    if (keywords.age) parts.push(keywords.age);
    if (keywords.gender) parts.push(keywords.gender);
    parts.push(keywords.diagnosis[0]);
    return parts.join(' ') + 'の症例';
  }

  // 如果有医学术语
  if (keywords.medicalTerms && keywords.medicalTerms.length > 0) {
    const parts = [];
    if (keywords.age) parts.push(keywords.age);
    if (keywords.gender) parts.push(keywords.gender);
    parts.push(keywords.medicalTerms[0]);
    return parts.join(' ') + 'の相談';
  }

  // 使用fallback消息的前30个字符
  if (fallbackMessage) {
    return fallbackMessage.length > 30 
      ? `${fallbackMessage.substring(0, 30)}...`
      : fallbackMessage;
  }

  // 默认标题
  return `分析 ${new Date().toLocaleDateString('ja-JP')}`;
}

/**
 * 生成会话预览文本
 */
export function generateConversationPreview(keywords: ExtractedKeywords, firstMessage?: string): string {
  const parts = [];
  
  if (keywords.diagnosis && keywords.diagnosis.length > 0) {
    parts.push(keywords.diagnosis.slice(0, 2).join(', '));
  }
  
  if (keywords.measurements && keywords.measurements.length > 0) {
    parts.push(keywords.measurements.slice(0, 2).join(', '));
  }
  
  if (parts.length > 0) {
    return parts.join(' | ');
  }
  
  // 使用第一条消息作为预览
  if (firstMessage) {
    return firstMessage.length > 50 
      ? `${firstMessage.substring(0, 50)}...`
      : firstMessage;
  }
  
  return '新しい会話';
}

/**
 * 增强ConversationSummary与关键词信息
 */
export interface EnhancedConversationSummary extends ConversationSummary {
  id: string; // 为了兼容现有sidebar代码
  keywords?: ExtractedKeywords;
  enhancedTitle?: string;
  enhancedPreview?: string;
}

/**
 * 将ConversationSummary转换为增强版本
 */
export function enhanceConversationSummary(
  conversation: ConversationSummary,
  messages?: ChatMessage[],
  patientData?: PatientData
): EnhancedConversationSummary {
  let keywords: ExtractedKeywords = {};
  
  // 从患者数据提取关键词
  if (patientData) {
    keywords = extractKeywordsFromPatientData(patientData);
  }
  
  // 从第一条用户消息提取关键词（优先使用这个方式，因为性能更好）
  if ((conversation as any).first_user_message) {
    const messageKeywords = extractKeywordsFromMessage((conversation as any).first_user_message);
    // 合并关键词，患者数据优先
    keywords = { ...messageKeywords, ...keywords };
  }
  // 如果没有第一条消息但有消息数组，则从消息中提取
  else if (messages && messages.length > 0) {
    const messageKeywords = extractKeywordsFromConversation(messages);
    // 合并关键词，患者数据优先
    keywords = { ...messageKeywords, ...keywords };
  }
  
  // 使用第一条用户消息作为fallback标题
  const fallbackMessage = (conversation as any).first_user_message || conversation.preview;
  const enhancedTitle = generateConversationTitle(keywords, fallbackMessage);
  const enhancedPreview = generateConversationPreview(keywords, fallbackMessage);
  
  return {
    ...conversation,
    id: conversation.session_id, // 为了兼容sidebar
    keywords,
    enhancedTitle,
    enhancedPreview
  };
}