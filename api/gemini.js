// api/gemini.js (Code Đã Tối Ưu và Linh Hoạt)

import { getGeminiApiKey, getGeminiModelName } from './utils/apiConfig'; 

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 1. Lấy API Key đã được kiểm tra
        const GEMINI_API_KEY = getGeminiApiKey(); 
        // 2. Lấy tên mô hình (đã có mặc định ổn định nếu thiếu)
        const MODEL_NAME = getGeminiModelName(); 

        const { prompt, context } = request.body;

        if (!prompt) {
            return response.status(400).json({ message: 'Missing prompt for Gemini AI.' });
        }

        // URL API sử dụng tên mô hình động
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

        // Phần còn lại của logic (System Prompt, JSON Schema) giữ nguyên
        // Chỉ thay đổi tên mô hình trong apiUrl

        const systemPrompt = `Bạn là một chuyên gia SEO YouTube và chuyên gia tiếp thị nội dung.
Nhiệm vụ của bạn là phân tích dữ liệu (tiêu đề, mô tả, tags) từ một loạt video YouTube và tạo ra một bộ dữ liệu SEO hoàn chỉnh, chuẩn SEO cho một chủ đề chung (ví dụ: một danh sách phát).

QUY TRÌNH BẮT BUỘC:
1.  **PHÂN TÍCH & TRÍCH XUẤT:** Đọc kỹ toàn bộ tiêu đề, mô tả, tags được cung cấp. Xác định các chủ đề cốt lõi và các thực thể.
2.  **TẠO TỪ KHÓA CHUẨN SEO (LOGIC MỚI):**
    * **Từ Khoá Chính (boTuKhoaChinh):** Tạo các "từ khóa gốc" ngắn gọn (1-3 từ).
    * **Từ Khoá Bổ Trợ (tuKhoaBoTro):** Tạo các "từ khóa đuôi dài" (long-tail, 3-6 từ) có ý định tìm kiếm cao (how-to, tutorial, best).
    * **Từ Khoá Liên Quan (tuKhoaLienQuan):** Các từ khóa mở rộng chủ đề, trả lời các câu hỏi liên quan.
    * **Từ Khoá Thương Hiệu (tuKhoaThuongHieu):** Chỉ trích xuất tên kênh hoặc thương hiệu cụ thể được lặp lại. Nếu không có, trả về mảng rỗng [].
3.  **TẠO NỘI DUNG CHUẨN SEO:**
    * Tạo "Tiêu Đề Chủ Đề" (tieuDeChuDe) hấp dẫn, chứa từ khóa chính.
    * Tạo "Mô Tả Chủ Đề" (moTaChuDe) chuẩn SEO, tích hợp tự nhiên các từ khóa chính và từ khóa bổ trợ, và bao gồm các hashtags ở cuối.
4.  **NGÔN NGỮ (RẤT QUAN TRỌNG):**
    * TỰ ĐỘNG PHÁT HIỆN ngôn ngữ chính của văn bản đầu vào (ví dụ: Tiếng Việt, Tiếng Anh).
    * BẮT BUỘC trả lời (toàn bộ tiêu đề, mô tả, và tất cả từ khóa) BẰNG CHÍNH NGÔN NGỮ ĐÓ.
    * Bỏ qua tên các trường JSON khi quyết định ngôn ngữ. Chỉ tập trung vào nội dung video.

Trả về kết quả CHÍNH XÁC theo JSON schema đã yêu cầu.`;

        const userQuery = `Đây là dữ liệu tổng hợp từ các video. Hãy phân tích và tạo bộ dữ liệu SEO chuẩn cho chủ đề chung:\n\n${prompt}`;

        // Định nghĩa JSON Schema cho kết quả
        const responseSchema = {
            "type": "OBJECT",
            "properties": {
                "boTuKhoaChinh": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Từ khóa chính đuôi dài, chuẩn SEO" },
                "tuKhoaBoTro": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Từ khóa bổ trợ và biến thể" },
                "tuKhoaLienQuan": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Từ khóa liên quan và mở rộng chủ đề" },
                "tuKhoaThuongHieu": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Từ khóa thương hiệu (nếu có)" },
                "hashtags": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Danh sách hashtags (ví dụ: #keyword)" },
                "tieuDeChuDe": { "type": "STRING", "description": "Tiêu đề chuẩn SEO cho chủ đề/danh sách phát" },
                "moTaChuDe": { "type": "STRING", "description": "Mô tả chuẩn SEO cho chủ đề/danh sách phát" }
            },
            "required": ["boTuKhoaChinh", "tuKhoaBoTro", "tuKhoaLienQuan", "tuKhoaThuongHieu", "hashtags", "tieuDeChuDe", "moTaChuDe"]
        };
        
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        };

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorText}`);
        }

        const result = await geminiResponse.json();

        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
            const jsonText = result.candidates[0].content.parts[0].text;
            return response.status(200).json(JSON.parse(jsonText));
        } else {
            throw new Error("Không thể trích xuất dữ liệu JSON từ phản hồi của Gemini.");
        }

    } catch (error) {
        console.error("Lỗi nghiêm trọng trên backend /api/gemini:", error);
        return response.status(500).json({ 
            message: `Lỗi máy chủ nội bộ: ${error.message}` 
        });
    }
}