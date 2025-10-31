// --- CHỨC NĂNG BACKEND: /api/translate ---
// API này nhận một danh sách văn bản và một ngôn ngữ mục tiêu (targetLang),
// sau đó gọi đến API dịch (không chính thức) của Google.
// PHIÊN BẢN 3.0: Sửa lỗi dịch, gửi nhiều 'q' thay vì join('\n')

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
            // *** SỬA LỖI: Gửi từng 'q' riêng lẻ thay vì join('\n') ***
            // API này hỗ trợ nhiều tham số 'q'
            uniqueNonEmptyTexts.forEach(text => {
                form.append('q', text);
            });

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
            
            // 5. Xử lý phản hồi (Logic mới)
            let splitTranslated = [];
            if (transData && transData[0]) {
                // Khi gửi nhiều 'q', transData[0] là một mảng các kết quả
                // Mỗi kết quả là một mảng [[['dịch', 'gốc', ...]]]
                splitTranslated = transData[0].map(segment => 
                    (segment && segment[0] && segment[0][0]) ? segment[0][0] : ''
                );
            }
            
            // 6. Ánh xạ (map) bản dịch về văn bản gốc
            if (splitTranslated.length === uniqueNonEmptyTexts.length) {
                uniqueNonEmptyTexts.forEach((original, index) => {
                    originalToTranslated.set(original, splitTranslated[index]);
                });
            } else {
                // Fallback phòng trường hợp API trả về không như mong đợi
                console.warn(`Translation mismatch: input ${uniqueNonEmptyTexts.length}, output ${splitTranslated.length}`);
                if (splitTranslated.length > 0) {
                     originalToTranslated.set(uniqueNonEmptyTexts[0], splitTranslated[0]); // Chỉ dịch cái đầu tiên
                }
            }
        }

        // 7. Xây dựng mảng kết quả cuối cùng theo đúng thứ tự của 'texts'
        const finalTranslations = texts.map(originalText => {
            if (!originalText || originalText.trim().length === 0) return ''; // Trả về chuỗi rỗng nếu đầu vào là rỗng
            // Phải trim() văn bản gốc khi tìm kiếm trong Map
            return originalToTranslated.get(originalText.trim()) || '(Lỗi dịch)';
        });

        // Trả về kết quả thành công
        return response.status(200).json({ translations: finalTranslations });

    } catch (error) {
        console.error("Lỗi trong /api/translate:", error);
        return response.status(500).json({ message: error.message || 'Lỗi máy chủ không xác định' });
    }
}

