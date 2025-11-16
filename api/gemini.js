// api/gemini.js (Code Đã Tối Ưu)

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

        // Cấu trúc request cho Gemini API
        const requestBody = {
            contents: [{
                parts: [
                    { text: context || "Hãy hành động như một chuyên gia SEO YouTube." }, // Thêm ngữ cảnh
                    { text: prompt }
                ]
            }],
            config: {
                 // Đảm bảo kết quả luôn là JSON (nếu prompt yêu cầu JSON)
                responseMimeType: "application/json", 
                temperature: 0.7,
            }
        };

        // URL API sử dụng tên mô hình động
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`Gemini API failed: ${apiResponse.status} - ${errorText}`);
        }

        const data = await apiResponse.json();
        
        // Kiểm tra xem phản hồi có 'text' không (cần thiết cho mô hình Gemini)
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!responseText) {
            return response.status(500).json({ message: 'Gemini AI returned an empty response.' });
        }

        response.status(200).json({ content: responseText });
    } catch (error) {
        console.error('Error in Gemini API handler:', error.message);
        response.status(500).json({ message: 'Server error when communicating with Gemini AI.', error: error.message });
    }
}