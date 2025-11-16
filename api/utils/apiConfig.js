// api/utils/apiConfig.js

/**
 * Lấy và kiểm tra khóa API YouTube.
 * @returns {string} Khóa API đã được xác thực.
 * @throws {Error} Nếu khóa API bị thiếu.
 */
export function getYoutubeApiKey() {
    // Tên biến môi trường cần khớp với tên bạn đã đặt trong Vercel (ví dụ: YOUTUBE_API_KEY)
    const key = process.env.YOUTUBE_API_KEY; 
    
    if (!key) {
        // [CẢNH BÁO LỖI] Đảm bảo tên biến hiển thị chính xác để dễ debug
        throw new Error("Lỗi cấu hình: Khóa API YouTube (YOUTUBE_API_KEY) chưa được thiết lập.");
    }
    return key;
}

/**
 * Lấy và kiểm tra khóa API Gemini.
 * @returns {string} Khóa API đã được xác thực.
 * @throws {Error} Nếu khóa API bị thiếu.
 */
export function getGeminiApiKey() {
    // Tên biến môi trường cần khớp với tên bạn đã đặt trong Vercel
    const key = process.env.GEMINI_API_KEY; 
    
    if (!key) {
        throw new Error("Lỗi cấu hình: Khóa API Gemini (GEMINI_API_KEY) chưa được thiết lập.");
    }
    return key;
}

/**
 * Lấy tên mô hình Gemini.
 * @returns {string} Tên mô hình (mặc định là 'gemini-2.5-flash').
 */
export function getGeminiModelName() {
    // Sử dụng biến môi trường GEMINI_MODEL_NAME nếu có, nếu không thì dùng mặc định ổn định
    return process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
}