/* ============================================
   AI Module - Gemini Integration
   ============================================ */

const AI = (() => {
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const callGemini = async (input, systemInstruction) => {
        const key = API.getGeminiKey();
        if (!key) {
            showToast('Vui lòng nhập Gemini API Key trong Cài đặt', 'error');
            return null;
        }

        // Construct request body
        let contents = [];
        if (typeof input === 'string') {
            contents = [{ parts: [{ text: input }] }];
        } else if (Array.isArray(input)) {
            // Multimodal input: [{text: ...}, {inline_data: ...}]
            contents = [{ parts: input }];
        }

        const body = {
            contents: contents,
            generationConfig: { temperature: 0.8, maxOutputTokens: 4096 }
        };

        // Add system instruction if provided (Gemini 1.5 Pro/Flash supports this)
        // Note: For simple usage, we can prepend to prompt, but system_instruction is better if supported.
        // We'll prepend to the first text part for compatibility with standard generateContent endpoint if not using beta API features strictly.
        // Actually, let's prepend it to the text prompt to be safe.
        if (systemInstruction && contents[0]?.parts) {
            const textPartIndex = contents[0].parts.findIndex(p => p.text);
            if (textPartIndex !== -1) {
                contents[0].parts[textPartIndex].text = `[System Instruction: ${systemInstruction}]\n\n${contents[0].parts[textPartIndex].text}`;
            } else {
                contents[0].parts.unshift({ text: `[System Instruction: ${systemInstruction}]` });
            }
        }

        try {
            const response = await fetch(`${GEMINI_URL}?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                return data.candidates[0].content.parts[0].text;
            }
            console.error('Gemini API response error:', data);
            return null;
        } catch (err) {
            console.error('Gemini API Error:', err);
            showToast('Lỗi kết nối Gemini AI', 'error');
            return null;
        }
    };

    // ... (generateExercises unchanged) ...

    // Analyze image for grading
    const analyzeImage = async (base64Image, gradingContext) => {
        // gradingContext: { subject, class, studentName, additionalNotes, includeScore }

        const prompt = `Bạn là giáo viên tiểu học. Hãy chấm bài làm trong ảnh này.
        
Thông tin:
- Môn học: ${gradingContext.subject}
- Học sinh: ${gradingContext.studentName}
- Yêu cầu chấm: ${gradingContext.includeScore ? 'Có chấm điểm (thang 10)' : 'KHÔNG chấm điểm, chỉ nhận xét'}
${gradingContext.additionalNotes ? '- Ghi chú thêm: ' + gradingContext.additionalNotes : ''}

Nhiệm vụ:
1. Đọc nội dung bài làm trong ảnh.
2. Kiểm tra đúng/sai.
3. ${gradingContext.includeScore ? 'Đưa ra điểm số (số nguyên hoặc 0.5).' : 'Bỏ qua phần điểm số.'}
4. Viết nhận xét ngắn gọn, khích lệ (phù hợp học sinh tiểu học).
5. Đưa ra gợi ý sửa lỗi (nếu có).

Trả về JSON THUẦN (không markdown):
{
  ${gradingContext.includeScore ? '"diem": 8.5,' : '"diem": null,'}
  "nhanXet": "Lời nhận xét...",
  "goiY": ["Gợi ý 1", "Gợi ý 2"],
  "chiTiet": "Chi tiết lỗi sai (nếu cần)"
}`;

        // Prepare multimodal input
        // base64Image should be the pure base64 string (without "data:image/jpeg;base64,")
        const imagePart = {
            inline_data: {
                mime_type: "image/jpeg", // Assuming JPEG for simplicity, or detect from base64 header if passed
                data: base64Image
            }
        };
        const textPart = { text: prompt };

        const systemInstruction = localStorage.getItem('lms_ai_persona') || '';

        const result = await callGemini([textPart, imagePart], systemInstruction);
        if (!result) return null;

        try {
            let cleaned = result.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }
            return JSON.parse(cleaned);
        } catch (err) {
            console.error('Parse Grading AI error:', err);
            return null;
        }
    };

    return { generateExercises, analyzeStudent, analyzeImage, callGemini };
})();
