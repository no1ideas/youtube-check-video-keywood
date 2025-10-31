// Đây là "Người gác cổng" cho Gemini (file /api/gemini.js)

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Chỉ chấp nhận POST' });
    }

    try {
        const { prompt } = request.body;
        if (!prompt) {
            return response.status(400).json({ message: 'Thiếu prompt' });
        }

        // 1. LẤY API KEY GEMINI BÍ MẬT
        // (Chúng ta sẽ cài đặt biến này trên Vercel sau)
        // LƯU Ý: Đây là key Gemini bạn tự tạo, không phải key trong Canvas.
        const GEMINI_API_KEY = process.env.MY_GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
             throw new Error("Chưa cài đặt API Key cho Gemini");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

        // Lấy lại system prompt và schema từ code gốc của bạn
        const systemPrompt = `You are a YouTube SEO expert... (v.v... toàn bộ system prompt của bạn)`;
        const responseSchema = {
             "type": "OBJECT",
             "properties": {
                 "boTuKhoaChinh": { "type": "ARRAY", "items": { "type": "STRING" } },
                 "tuKhoaBoTro": { "type": "ARRAY", "items": { "type": "STRING" } },
                 "tuKhoaLienQuan": { "type": "ARRAY", "items": { "type": "STRING" } },
                 "tuKhoaThuongHieu": { "type": "ARRAY", "items": { "type": "STRING" } },
                 "hashtags": { "type": "ARRAY", "items": { "type": "STRING" } },
                 "tieuDeChuDe": { "type": "STRING" },
                 "moTaChuDe": { "type": "STRING" }
             },
             "required": ["boTuKhoaChinh", "tuKhoaBoTro", "tuKhoaLienQuan", "tuKhoaThuongHieu", "hashtags", "tieuDeChuDe", "moTaChuDe"]
         };

        const payload = {
            contents: [{ parts: [{ text: `Here is the combined data from the videos:\n\n${prompt}\n\Analyze this data...` }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
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
            const errorData = await geminiResponse.json();
            console.error("Lỗi từ Gemini API:", errorData);
            throw new Error(`Gemini API Error: ${errorData.error?.message || geminiResponse.statusText}`);
        }

        const result = await geminiResponse.json();

        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
            const jsonText = result.candidates[0].content.parts[0].text;
            // 2. Trả về JSON đã parse cho Frontend
            return response.status(200).json(JSON.parse(jsonText));
        } else {
            throw new Error("Không thể trích xuất dữ liệu JSON từ Gemini.");
        }

    } catch (error) {
        console.error("Lỗi trong /api/gemini:", error.message);
        return response.status(500).json({ message: error.message || 'Lỗi máy chủ không xác định' });
    }
}
