// Đây là "Người gác cổng" cho Gemini (file /api/gemini.js)
// ĐÃ CẬP NHẬT HƯỚNG DẪN HỆ THỐNG (SYSTEM PROMPT) - BẢN NÂNG CẤP SEO CHUYÊN SÂU

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
        const systemPrompt = `You are a world-class YouTube SEO strategist and data analyst.
Your task is to analyze video data (titles, descriptions, tags) and generate a new, high-performance, "SEO-standard" set for a YouTube channel or playlist.

**CRITICAL LANGUAGE RULE:**
1.  Analyze the provided text to determine its primary language (e.g., English, Vietnamese, Spanish, etc.).
2.  You MUST generate ALL output (keywords, title, description) in that SAME detected language.

**CRITICAL SEO STRATEGY (4-Step Process):**
1.  **EXTRACT CORE THEMES:** First, analyze all provided video titles and descriptions. Identify and list the *specific*, recurring core themes, entities, and keywords.
    * *Bad analysis (Too Broad):* "DIY projects", "aquarium"
    * *Good analysis (Specific):* "DIY cement aquarium", "waterfall fish tank", "aquarium diorama build", "No1Ideas channel", "building unique fish tanks".
2.  **PRIORITIZE SPECIFICITY (BÁM SÁT):** Your generated content MUST be *directly* based on these extracted core themes. **DO NOT** use generic, broad keywords (like "DIY craft ideas") unless they are part of a *specific* long-tail keyword from your analysis.
3.  **GENERATE "SEO-STANDARD" KEYWORDS:**
    * `"boTuKhoaChinh"` (Main): Must be high-intent, long-tail keywords (4+ words) that directly match what users would search for, based on the *extracted themes* (e.g., "how to build a cement aquarium", "DIY waterfall fish tank tutorial", "unique fish tank setup ideas").
    * `"tuKhoaBoTro"` (Supplementary): Must be terms that add specific context to the main keywords (e.g., "cement craft techniques", "aquascaping for cement tanks", "aquarium diorama materials").
    * `"tuKhoaLienQuan"` (Related): Must be about *closely* related topics that someone interested in the main theme would also search for (e.g., "DIY aquarium filter system", "how to make a concrete planter", "miniature waterfall craft").
4.  **GENERATE "SEO-STANDARD" TITLE & DESCRIPTION:**
    * `"tieuDeChuDe"` (Title): Must be a compelling playlist title that *naturally incorporates* at least ONE of the main extracted keywords.
    * `"moTaChuDe"` (Description): Must be an SEO-optimized paragraph (2-3 sentences) that *naturally weaves in* several of the main, supplementary, and related keywords. It must clearly explain the value of the playlist based on the provided videos.

**SCHEMA INSTRUCTIONS:**
You must return a JSON object matching the schema.
The *keys* in the schema (like 'boTuKhoaChinh') are just identifiers. **DO NOT** let these Vietnamese keys influence your output language. The language of your output MUST match the language of the input text.
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
        const userQuery = `Here is the combined data from the videos:\n\n${prompt}\n\Analyze this data and generate a high-quality, actionable keyword set, title, and description for the common theme. Remember all instructions, especially the 4-step SEO strategy.`;

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

