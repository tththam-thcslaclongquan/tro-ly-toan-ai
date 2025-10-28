import { TAG_MIN_GRADE, KEYWORDS_TO_TAGS, formulaHints } from '../constants';
import type { ComplianceResult, Grade } from '../types';

export const roughDetectTags = (text: string): string[] => {
  const tags = new Set<string>();
  if (!text) return [];
  const lowerText = text.toLowerCase();
  
  for (const k of KEYWORDS_TO_TAGS) {
    if (k.re.test(lowerText)) {
      tags.add(k.tag);
      if (tags.size >= 3) break; // Limit to 3 tags for performance
    }
  }
  return Array.from(tags);
};

export const checkCompliance = (grade: Grade, tags: string[]): ComplianceResult => {
  const currentGradeNum = parseInt(grade);
  
  const hits: string[] = [];
  const potentialGrades = new Set<number>();

  for (const t of tags) {
    const minGrade = TAG_MIN_GRADE[t];
    if (minGrade && currentGradeNum < minGrade) {
      hits.push(t);
      potentialGrades.add(minGrade);
    }
  }

  if (hits.length) {
    const uniqueGrades = [...potentialGrades]
      .sort((a, b) => a - b)
      .map(String)
      .filter(g => ['6', '7', '8', '9'].includes(g)) as Grade[];
    
    return { 
      ok: false, 
      reason: `${hits.join(", ")}`,
      suggestedGrades: uniqueGrades.length > 0 ? uniqueGrades : undefined
    };
  }
  
  return { ok: true, reason: "" };
};

const WANT_FORMULA_REGEX = /(công thức|tính|diện tích|chu vi|thể tích|bán kính|bề mặt)/i;

export const detectFormulaIntent = (userInput: string): string | null => {
  const text = userInput.toLowerCase();
  
  if (!WANT_FORMULA_REGEX.test(text)) {
    return null;
  }

  let detectedShape: keyof typeof formulaHints | null = null;
  for (const [shape, data] of Object.entries(formulaHints)) {
    if (data.labels.some(label => text.includes(label))) {
      detectedShape = shape as keyof typeof formulaHints;
      break;
    }
  }

  if (detectedShape) {
    const formulas = formulaHints[detectedShape];
    const formulaEntries = Object.values(formulas).filter((val): val is { latex: string; condition: string; pitfall?: string } => typeof val === 'object' && val !== null && 'latex' in val);
    
    if(formulaEntries.length > 0) {
        const lines = formulaEntries.map(f => `• $${f.latex}$ — Dùng khi biết ${f.condition}${f.pitfall ? `. (Lưu ý: ${f.pitfall})` : ''}`);
        return [
        `📘 Gợi ý các công thức liên quan (không thay số):`,
        ...lines.slice(0, 4) // Limit number of formulas to avoid overwhelming
        ].join("\n");
    }
  }

  return null;
};
