// --- CHỨC NĂNG BACKEND: /api/translate ---
// API này nhận một danh sách văn bản và một ngôn ngữ mục tiêu (targetLang),
// sau đó gọi đến API dịch (không chính thức) của Google.
// PHIÊN BẢN 2.0: Tối ưu hóa, dùng POST và xử lý lỗi tốt hơn.

export default async function handler(request, response) {
    // Chỉ chấp nhận phương thức POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { texts, targetLang } = request.body;

        // 1. Kiểm tra dữ liệu đầu vào
        if (!texts || !Array.isArray(texts)) {
            return response.status(400).json({ message: 'Missing or invalid "texts" array' });
        }
        
        // 2. Xác định ngôn ngữ đích (mặc định 'vi' nếu không có)
        const langCode = targetLang || 'vi'; 

        // 3. Chuẩn bị dữ liệu dịch
        // Chỉ dịch các văn bản không rỗng và duy nhất để tiết kiệm tài nguyên
        const originalToTranslated = new Map();
        const uniqueNonEmptyTexts = [...new Set(texts.filter(t => t && t.trim().length > 0))];

        // Nếu không có gì để dịch, trả về mảng rỗng
        if (uniqueNonEmptyTexts.length > 0) {
            
            // 4. Gọi API Dịch (dùng POST cho an toàn)
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`;
            
            // Dùng form-urlencoded cho POST
            const form = new URLSearchParams();
            // Nối các chuỗi bằng newline, API gtx có thể xử lý
            form.append('q', uniqueNonEmptyTexts.join('\n')); 

            const transResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: form.toString()
            });

            if (!transResponse.ok) {
                throw new Error(`Google Translate API error! Status: ${transResponse.status}`);
            }

            const transData = await transResponse.json();
            
            // 5. Xử lý phản hồi
            let translatedSegments = [];
            if (transData && transData[0]) {
                // gtx trả về các mảng lồng nhau, chúng ta lấy [0][0] của mỗi phần
                translatedSegments = transData[0].map(segment => segment[0]);
            }
            
            // Nối tất cả các đoạn dịch lại (vì gtx có thể tự ngắt câu)
            const combinedTranslated = translatedSegments.join('');
            // Tách lại bằng newline, khớp với đầu vào
            const splitTranslated = combinedTranslated.split('\n');

            // 6. Ánh xạ (map) bản dịch về văn bản gốc
            if (splitTranslated.length === uniqueNonEmptyTexts.length) {
                uniqueNonEmptyTexts.forEach((original, index) => {
                    originalToTranslated.set(original, splitTranslated[index]);
                });
            } else {
                // Fallback phòng trường hợp API gộp các câu
                console.warn(`Translation split mismatch: input ${uniqueNonEmptyTexts.length}, output ${splitTranslated.length}`);
                if (splitTranslated.length > 0) {
                     originalToTranslated.set(uniqueNonEmptyTexts[0], splitTranslated[0]);
                }
            }
        }

        // 7. Xây dựng mảng kết quả cuối cùng theo đúng thứ tự của 'texts'
        const finalTranslations = texts.map(originalText => {
            if (!originalText || originalText.trim().length === 0) return ''; // Trả về chuỗi rỗng nếu đầu vào là rỗng
            return originalToTranslated.get(originalText.trim()) || '(Lỗi dịch)';
        });

        // Trả về kết quả thành công
        return response.status(200).json({ translations: finalTranslations });

    } catch (error) {
        console.error("Lỗi trong /api/translate:", error);
        return response.status(500).json({ message: error.message || 'Lỗi máy chủ không xác định' });
    }
}

