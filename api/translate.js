// --- CHỨC NĂNG BACKEND: /api/translate ---
// API này nhận một danh sách văn bản và một ngôn ngữ mục tiêu (targetLang),
// sau đó gọi đến API dịch (không chính thức) của Google.
// PHIÊN BẢN 4.0: Sửa lỗi dịch, chuyển sang GET và chia lô (batching)

export default async function handler(request, response) {
    // Chỉ chấp nhận phương thức POST (vì frontend gửi POST)
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
        const originalToTranslated = new Map();
        // Chỉ dịch các văn bản không rỗng và duy nhất
        const uniqueNonEmptyTexts = [...new Set(texts.filter(t => t && t.trim().length > 0))];

        if (uniqueNonEmptyTexts.length > 0) {
            
            // 4. CHIA LÔ (BATCHING)
            // URL GET có giới hạn. Chúng ta sẽ giới hạn mỗi URL khoảng 4000 ký tự.
            const batches = [];
            let currentBatch = [];
            let currentLength = 0;
            const baseURL = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`;

            for (const text of uniqueNonEmptyTexts) {
                // + 3 cho '&q='
                const textLength = encodeURIComponent(text).length + 3; 
                
                // Nếu thêm text này vào sẽ vượt quá 4000,
                // hoặc nếu lô hiện tại đã có 25 bình luận (một giới hạn an toàn khác)
                if ((currentLength + textLength > 4000 && currentBatch.length > 0) || currentBatch.length >= 25) {
                    batches.push(currentBatch); // Đẩy lô cũ vào
                    currentBatch = [text];     // Bắt đầu lô mới
                    currentLength = textLength;
                } else {
                    currentBatch.push(text);
                    currentLength += textLength;
                }
            }
            batches.push(currentBatch); // Đẩy lô cuối cùng

            const allTranslatedSegments = [];

            // 5. Gọi API cho từng lô
            for (const batch of batches) {
                if (batch.length === 0) continue;

                // Xây dựng URL cho lô này
                const queryParams = batch.map(text => `q=${encodeURIComponent(text)}`).join('&');
                const url = `${baseURL}&${queryParams}`;

                const transResponse = await fetch(url, { method: 'GET' }); // Dùng GET

                if (!transResponse.ok) {
                    throw new Error(`Google Translate API error! Status: ${transResponse.status}`);
                }

                const transData = await transResponse.json();
                
                // Xử lý phản hồi (Logic của v3.0, nhưng cho GET)
                if (transData && transData[0]) {
                    // Khi gửi nhiều 'q' qua GET, transData[0] là một mảng các kết quả
                    const batchTranslations = transData[0].map(segment => 
                        (segment && segment[0]) ? segment[0] : ''
                    );
                    allTranslatedSegments.push(...batchTranslations);
                } else {
                    // Nếu lô thất bại, thêm chuỗi rỗng
                    allTranslatedSegments.push(...batch.map(() => ''));
                }
            }
            
            // 6. Ánh xạ (map) bản dịch về văn bản gốc
            if (allTranslatedSegments.length === uniqueNonEmptyTexts.length) {
                uniqueNonEmptyTexts.forEach((original, index) => {
                    originalToTranslated.set(original, allTranslatedSegments[index]);
                });
            } else {
                // Fallback phòng trường hợp API trả về không như mong đợi
                console.warn(`Translation mismatch: input ${uniqueNonEmptyTexts.length}, output ${allTranslatedSegments.length}`);
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

