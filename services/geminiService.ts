import { GoogleGenAI, Type, Content, Part, GenerateContentResponse } from "@google/genai";
// Fix: Import the 'Mode' type to resolve 'Cannot find name' error.
import type { GuidanceParams, Grade, FeedbackStatus, Mode } from '../types';

const getGenAI = () => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    // This is a fallback for development, but in a real environment, the key should be set.
    console.warn("API_KEY environment variable not set. The application might not work correctly.");
    // In a production environment, you might want to throw an error.
    // throw new Error("API_KEY environment variable not set.");
  }
  // The API key is injected by the environment, so we pass it here.
  return new GoogleGenAI({ apiKey: API_KEY });
};

const getModelForTask = (params: { problemImageCount: number; studentImageCount: number }): string => {
    if (params.problemImageCount > 0 || params.studentImageCount > 0) {
        // Use a more powerful model for multi-modal inputs
        return "gemini-2.5-pro";
    }
    // Use a faster model for text-only inputs
    return "gemini-2.5-flash";
};

const withRetry = async <T,>(apiCall: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await apiCall();
        } catch (e: any) {
            if (i === retries - 1) throw e;
            const errorMessage = e.message ? String(e.message).toLowerCase() : '';
            if (errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                console.warn(`API call failed, retrying in ${delay * (i + 1)}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, delay * (i + 1)));
            } else {
                throw e; // Non-retriable error
            }
        }
    }
    throw new Error("Retry logic failed");
};

const buildSystemPrompt = (grade: Grade, mode: Mode, feedback?: FeedbackStatus): string => {
  let prompt = `
Bạn là "Trợ lý Toán tư duy THCS" tuân thủ nghiêm ngặt CT GDPT 2018.
QUY TẮC TỐI CAO:
- **XƯNG HÔ:** Luôn xưng là "cô" và gọi học sinh là "em".
- **KHÔNG GIẢI HỘ:** Tuyệt đối không thay số, không tính ra số cuối cùng, không đưa đáp án. Nếu học sinh năn nỉ xin đáp án, hãy hỏi lại dữ kiện và tiếp tục gợi mở.
- **CHỈ GỢI MỞ:** Bạn chỉ được phép: (1) nhắc lại định nghĩa/điều kiện áp dụng; (2) gợi công thức tổng quát (dạng chữ, không số); (3) gợi ý bước kế tiếp thông qua câu hỏi.
- **ƯU TIÊN CÔNG THỨC:** Nếu bài toán chỉ đơn giản là áp dụng công thức (ví dụ: tính diện tích hình vuông khi biết cạnh), hãy cung cấp công thức tổng quát ngay lập tức, sau đó mới hỏi gợi mở để học sinh tự áp dụng.
- **XỬ LÝ ĐỀ KHÔNG HỢP LỆ:** Nếu đề bài rõ ràng không phải là một bài toán (ảnh phong cảnh, văn bản vô nghĩa), BẠN PHẢI DỪNG LẠI và yêu cầu học sinh cung cấp đề bài hợp lệ.
- **XỬ LÝ VƯỢT CẤP:** Nếu user prompt có flag "⚠️ Phát hiện dấu hiệu vượt chuẩn lớp", BẠN PHẢI DỪNG LẠI và giải thích ngắn gọn tại sao đề không phù hợp, đề nghị học sinh "chọn lại khối lớp".
- **PHƯƠP PHÁP SOCRATIC:** Luôn gợi ý từng bước thông qua các câu hỏi gợi mở để học sinh tự suy luận.
- **NGÔN NGỮ:** Tiếng Việt ngắn gọn, thân thiện, dễ hiểu.
- **PHONG CÁCH:** Luôn tích cực, động viên. Nếu học sinh làm đúng, hãy khen. Nếu sai, hãy nói "Không sao cả, em thử xem lại...".

Bối cảnh lớp: ${grade}.
`;
  if (mode === "similar") {
      prompt += "\nNHIỆM VỤ: Tạo 2–3 bài toán tương tự cùng dạng, tăng dần độ khó, không kèm đáp số.";
  } else if (mode === "check") {
      prompt += "\nNHIỆM VỤ: Nhận xét bước làm của học sinh (đúng/thiếu/sai) và đưa ra 2–3 gợi ý để chỉnh sửa. Luôn giữ thái độ động viên.";
  } else {
      prompt += `
NHIỆM VỤ: Đề xuất BƯỚC TIẾP THEO để giải bài toán. Bắt đầu bằng icon 💡 và một câu hỏi khơi gợi, sau đó đặt thêm 1-2 câu hỏi gợi mở khác.`;
  }
  
  if (feedback === 'needs_more') {
    prompt += "\nLƯU Ý: Học sinh vừa phản hồi 'cần thêm gợi ý'. Hãy đưa ra một gợi ý khác, chi tiết hơn hoặc tiếp cận theo hướng khác.";
  } else if (feedback === 'too_hard') {
    prompt += "\nLƯU Ý: Học sinh vừa phản hồi 'khó quá'. Hãy chia nhỏ vấn đề, dùng ngôn ngữ đơn giản nhất, hoặc quay lại một khái niệm gốc rễ hơn.";
  }

  return prompt;
};

const buildUserPrompt = (params: GuidanceParams): string => {
  let p = `Khối lớp: ${params.grade}\n`;
  
  if (!params.compliance.ok) {
    p += `⚠️ Phát hiện dấu hiệu vượt chuẩn lớp: ${params.compliance.reason}. Hãy tuân thủ quy tắc TỐI CAO.\n`;
  }

  p += `Đề toán:\n${params.problem || `(đính kèm ${params.image.length} ảnh)`}\n`;
  
  if (params.studentStep || params.studentImages.length > 0) {
      p += `\nPhản hồi/câu trả lời của học sinh:\n${params.studentStep || `(đính kèm ${params.studentImages.length} ảnh bài làm)`}\n`;
  }

  // Logic to guide the model when student doesn't know the formula
  if (params.studentStep && /(không biết|quên|công thức)/i.test(params.studentStep)) {
      p += `\nCHỈ THỊ ĐẶC BIỆT: Học sinh có vẻ không nhớ công thức. Hãy cung cấp công thức tổng quát liên quan đến bài toán ngay lập tức và hướng dẫn em ấy áp dụng.\n`
  }

  return p;
};

const sanitizeAndParseJson = (text: string): any => {
    // Remove markdown code block fences
    const sanitizedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(sanitizedText);
};


export const classifyProblem = async (problemText: string, imagesBase64: string[], mimeTypes: string[]): Promise<string[]> => {
    const ai = getGenAI();
    const modelName = getModelForTask({ problemImageCount: imagesBase64.length, studentImageCount: 0 });
    const prompt = `Gắn tối đa 3 nhãn dạng bài cho đề Toán THCS sau. Chỉ trả về JSON theo schema.\nĐề: ${problemText || '(xem ảnh)'}`;
    
    const parts: Part[] = [{ text: prompt }];

    imagesBase64.forEach((img, index) => {
        parts.push({
            inlineData: { data: img, mimeType: mimeTypes[index] }
        });
    });

    const contents: Content[] = [{ parts }];

    try {
        const apiCall = () => ai.models.generateContent({
            model: modelName,
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } }
                }
            }
        });
        // Fix: Explicitly type 'response' to avoid TypeScript inferring it as 'unknown'.
        const response: GenerateContentResponse = await withRetry(apiCall);
        const result = sanitizeAndParseJson(response.text);
        return Array.isArray(result.tags) ? result.tags.slice(0, 3) : [];
    } catch (e) {
        console.error("Gemini classification failed:", e);
        // Fallback to empty array on failure
        return [];
    }
};

const replaceNumericalAnswers = (text: string): string => {
    // This regex looks for an equals or approximately equals sign, followed by optional whitespace,
    // an optional negative sign, and then a number (integer or decimal).
    // It replaces the found number with a pedagogical hint.
    return text.replace(/(=|≈)\s*-?\d+([.,]\d+)?/g, " = (em tự thay số nhé)");
};

export const getGuidance = async (params: GuidanceParams): Promise<string> => {
    const ai = getGenAI();
    const modelName = getModelForTask({ problemImageCount: params.image.length, studentImageCount: params.studentImages.length });
    const systemInstruction = buildSystemPrompt(params.grade, params.mode, params.feedback);
    const userPrompt = buildUserPrompt(params);

    const parts: Part[] = [{ text: userPrompt }];

    params.image.forEach((img, index) => {
        parts.push({
            inlineData: { data: img, mimeType: params.imageMimeType[index] },
        });
    });

    params.studentImages.forEach((img, index) => {
        parts.push({
            inlineData: { data: img, mimeType: params.studentImageMimeTypes[index] },
        });
    });
    
    const contents: Content[] = [{ role: 'user', parts }];

    try {
        const apiCall = () => ai.models.generateContent({
            model: modelName,
            contents,
            config: { systemInstruction },
        });
        // Fix: Explicitly type 'response' to avoid TypeScript inferring it as 'unknown'.
        const response: GenerateContentResponse = await withRetry(apiCall);
        // Sanitize the response to remove any accidental numerical answers.
        return replaceNumericalAnswers(response.text);
    } catch (e) {
        console.error("Gemini guidance generation failed:", e);
        throw e;
    }
};