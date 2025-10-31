// Đây là "Người gác cổng" cho Gemini (file /api/gemini.js)
// ĐÃ CẬP NHẬT HƯỚNG DẪN HỆ THỐNG (SYSTEM PROMPT)

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
        const GEMINI_API_KEY = process.env.MY_GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
             throw new Error("Chưa cài đặt API Key cho Gemini");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

        // *** BẮT ĐẦU PHẦN CẬP NHẬT QUAN TRỌNG ***
        // Hướng dẫn hệ thống (systemPrompt) mới, mạnh mẽ hơn
        const systemPrompt = `You are a YouTube SEO expert.
Your task is to analyze video data (titles, descriptions, tags) and generate a new SEO set.

**CRITICAL LANGUAGE RULE:**
1.  Analyze the provided text to determine its primary language (e.g., English, Vietnamese, Spanish, etc.).
2.  You MUST generate ALL output (keywords, title, description) in that SAME detected language.

**SCHEMA INSTRUCTIONS:**
You must return a JSON object matching the schema.
The *keys* in the schema (like 'boTuKhoaChinh', 'tieuDeChuDe') are just identifiers. **DO NOT** let these Vietnamese keys influence your output language. The *language of your output* must match the *language of the input text*.
For example: If the input text is English, you MUST output English keywords, an English title, and an English description.
`;
        // *** KẾT THÚC PHẦN CẬP NHẬT ***

        const responseSchema = {
             "type": "OBJECT",
             "properties": {
                 "boTuKhoaChinh": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Main keywords for the topic" },
                 "tuKhoaBoTro": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Supplementary keywords" },
                 "tuKhoaLienQuan": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Related keywords" },
                 "tuKhoaThuongHieu": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Brand keywords (if any)" },
                 "hashtags": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "List of relevant hashtags" },
                 "tieuDeChuDe": { "type": "STRING", "description": "A compelling title for the topic/playlist" },
                 "moTaChuDe": { "type": "STRING", "description": "A detailed, keyword-rich description" }
             },
             "required": ["boTuKhoaChinh", "tuKhoaBoTro", "tuKhoaLienQuan", "tuKhoaThuongHieu", "hashtags", "tieuDeChuDe", "moTaChuDe"]
         };

        // Tạo userQuery
        const userQuery = `Here is the combined data from the videos:\n\n${prompt}\n\Analyze this data and generate the keyword set, title, and description for the common theme. Remember the critical language rule.`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
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

