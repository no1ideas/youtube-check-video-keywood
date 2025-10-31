// Vercel Serverless Function
// Tệp này PHẢI nằm ở /api/gemini.js

// Hàm này xử lý các yêu cầu đến máy chủ
export default async function handler(request, response) {
    // Chỉ chấp nhận phương thức POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { prompt } = request.body;
        if (!prompt) {
            return response.status(400).json({ message: 'Missing prompt' });
        }

        // Lấy API Key của Gemini từ BIẾN MÔI TRƯỜNG (an toàn)
        const GEMINI_API_KEY = process.env.MY_GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("API key của Gemini chưa được cấu hình trên Vercel.");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

        // --- Đây là "Bộ não" AI đã được nâng cấp SEO chuyên sâu ---
        const systemPrompt = `Bạn là một chuyên gia SEO YouTube và chuyên gia tiếp thị nội dung.
Nhiệm vụ của bạn là phân tích dữ liệu (tiêu đề, mô tả, tags) từ một loạt video YouTube và tạo ra một bộ dữ liệu SEO hoàn chỉnh, chuẩn SEO cho một chủ đề chung (ví dụ: một danh sách phát).

QUY TRÌNH BẮT BUỘC:
1.  **PHÂN TÍCH & TRÍCH XUẤT:** Đọc kỹ toàn bộ tiêu đề, mô tả, tags được cung cấp. Xác định các chủ đề cốt lõi và các thực thể (ví dụ: tên kênh, vật liệu cụ thể như "hồ cá xi măng", kỹ thuật cụ thể như "làm thác nước").
2.  **TẠO TỪ KHÓA CHUẨN SEO (LOGIC MỚI):**
    * **Từ Khoá Chính (boTuKhoaChinh):** Tạo các "từ khóa gốc" (seed/head keywords) ngắn gọn (1-3 từ), đây là chủ đề cốt lõi nhất. (Ví dụ: "hồ cá xi măng", "DIY aquarium").
    * **Từ Khoá Bổ Trợ (tuKhoaBoTro):** Tạo các "từ khóa đuôi dài" (long-tail, 3-6 từ) có ý định tìm kiếm cao (how-to, tutorial, best), bám sát vào các từ khóa gốc. (Ví dụ: "cách xây hồ cá xi măng", "hướng dẫn làm hồ cá thác nước").
    * **Từ Khoá Liên Quan (tuKhoaLienQuan):** Các từ khóa mở rộng chủ đề, trả lời các câu hỏi liên quan (ví dụ: "cách nuôi cá", "làm bộ lọc hồ cá", "trang trí hồ cá").
    * **Từ Khoá Thương Hiệu (tuKhoaThuongHieu):** Chỉ trích xuất tên kênh hoặc thương hiệu cụ thể được lặp lại (ví dụ: "No1Ideas"). Nếu không có, trả về mảng rỗng [].
3.  **TẠO NỘI DUNG CHUẨN SEO:**
    * Tạo "Tiêu Đề Chủ Đề" (tieuDeChuDe) hấp dẫn, chứa từ khóa chính.
    * Tạo "Mô Tả Chủ Đề" (moTaChuDe) chuẩn SEO, tích hợp tự nhiên các từ khóa chính và từ khóa bổ trợ, và bao gồm các hashtags ở cuối.
4.  **NGÔN NGỮ (RẤT QUAN TRỌNG):**
    * TỰ ĐỘNG PHÁT HIỆN ngôn ngữ chính của văn bản đầu vào (ví dụ: Tiếng Việt, Tiếng Anh).
    * BẮT BUỘC trả lời (toàn bộ tiêu đề, mô tả, và tất cả từ khóa) BẰNG CHÍNH NGÔN NGỮ ĐÓ.
    * Bỏ qua tên các trường JSON (như 'boTuKhoaChinh') khi quyết định ngôn ngữ. Chỉ tập trung vào nội dung video.

Trả về kết quả CHÍNH XÁC theo JSON schema đã yêu cầu.`;

        const userQuery = `Đây là dữ liệu tổng hợp từ các video. Hãy phân tích và tạo bộ dữ liệu SEO chuẩn cho chủ đề chung:\n\n${prompt}`;

        // Định nghĩa JSON Schema cho kết quả
        const responseSchema = {
            "type": "OBJECT",
            "properties": {
                "boTuKhoaChinh": {
                    "type": "ARRAY",
                    "items": { "type": "STRING" },
                    "description": "Từ khóa chính đuôi dài, chuẩn SEO"
                },
                "tuKhoaBoTro": {
                    "type": "ARRAY",
                    "items": { "type": "STRING" },
                    "description": "Từ khóa bổ trợ và biến thể"
                },
                "tuKhoaLienQuan": {
                    "type": "ARRAY",
                    "items": { "type": "STRING" },
                    "description": "Từ khóa liên quan và mở rộng chủ đề"
                },
                "tuKhoaThuongHieu": {
                    "type": "ARRAY",
                    "items": { "type": "STRING" },
                    "description": "Từ khóa thương hiệu (nếu có)"
                },
                "hashtags": {
                    "type": "ARRAY",
                    "items": { "type": "STRING" },
                    "description": "Danh sách hashtags (ví dụ: #keyword)"
                },
                "tieuDeChuDe": {
                    "type": "STRING",
                    "description": "Tiêu đề chuẩn SEO cho chủ đề/danh sách phát"
                },
                "moTaChuDe": {
                    "type": "STRING",
                    "description": "Mô tả chuẩn SEO cho chủ đề/danh sách phát"
                }
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
            // Nếu gọi API thất bại, trả về lỗi JSON
            const errorData = await geminiResponse.json();
            throw new Error(`Gemini API Error: ${errorData.error?.message || geminiResponse.statusText}`);
        }

        const result = await geminiResponse.json();

        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
            const jsonText = result.candidates[0].content.parts[0].text;
            // Trả về JSON đã parse cho frontend
            return response.status(200).json(JSON.parse(jsonText));
        } else {
            throw new Error("Không thể trích xuất dữ liệu JSON từ phản hồi của Gemini.");
        }

    } catch (error) {
        // BẮT LỖI MÁY CHỦ: Bất kỳ lỗi nào xảy ra (lỗi cú pháp, lỗi API) sẽ bị bắt ở đây
        // Trả về lỗi dưới dạng JSON để frontend có thể đọc được
        console.error("Lỗi nghiêm trọng trên backend /api/gemini:", error);
        return response.status(500).json({ 
            message: `Lỗi máy chủ nội bộ: ${error.message}` 
        });
    }
}

