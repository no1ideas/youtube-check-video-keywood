// File: api/utils/apiConfig.js 

/**
 * Lấy và kiểm tra khóa API YouTube.
 * @returns {string} Khóa API đã được xác thực.
 * @throws {Error} Nếu khóa API bị thiếu.
 */
export function getYoutubeApiKey() {
    // Tên biến môi trường: MY_YOUTUBE_API_KEY
    const key = process.env.MY_YOUTUBE_API_KEY; 
    if (!key) {
        throw new Error("Lỗi cấu hình: Khóa API YouTube (MY_YOUTUBE_API_KEY) chưa được thiết lập.");
    }
    return key;
}

/**
 * Lấy và kiểm tra khóa API Gemini.
 * @returns {string} Khóa API đã được xác thực.
 * @throws {Error} Nếu khóa API bị thiếu.
 */
export function getGeminiApiKey() {
    // Tên biến môi trường: MY_GEMINI_API_KEY
    const key = process.env.MY_GEMINI_API_KEY; 
    if (!key) {
        throw new Error("Lỗi cấu hình: Khóa API Gemini (MY_GEMINI_API_KEY) chưa được thiết lập.");
    }
    return key;
}

/**
 * Lấy tên mô hình Gemini từ biến môi trường.
 * @returns {string} Tên mô hình (mặc định là 'gemini-2.5-flash').
 */
export function getGeminiModelName() {
    // Tên biến môi trường: GEMINI_MODEL_NAME
    return process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
}