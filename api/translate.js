// --- CHỨC NĂNG BACKEND: /api/translate ---
// API này nhận một danh sách văn bản và một ngôn ngữ mục tiêu (targetLang),
// sau đó gọi đến API dịch (không chính thức) của Google.
// PHIÊN BẢN 4.1: Sửa lỗi dịch, siết chặt logic chia lô (batching)

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
            
            // 4. CHIA LÔ (BATCHING) - Logic v4.1 (An toàn hơn)
            // URL GET có giới hạn. Giới hạn 2000 ký tự và 20 bình luận/lô cho an toàn.
            const MAX_URL_LENGTH = 2000;
            const MAX_BATCH_ITEMS = 20;
            
            const batches = [];
            let currentBatch = [];
            let currentParamsLength = 0;
            const baseURL = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`;
            const baseLength = baseURL.length;

            for (const text of uniqueNonEmptyTexts) {
                // + 3 cho '&q='
                const textParamLength = encodeURIComponent(text).length + 3; 
                
                // Kiểm tra xem việc thêm text này có vượt giới hạn không
                if (
                    (baseLength + currentParamsLength + textParamLength > MAX_URL_LENGTH && currentBatch.length > 0) || 
                    currentBatch.length >= MAX_BATCH_ITEMS
                ) {
                    batches.push(currentBatch); // Đẩy lô cũ vào
                    currentBatch = [text];     // Bắt đầu lô mới
                    currentParamsLength = textParamLength;
                } else {
                    currentBatch.push(text);
                    currentParamsLength += textParamLength;
                }
            }
            // Đẩy lô cuối cùng vào nếu nó không rỗng
            if (currentBatch.length > 0) {
                batches.push(currentBatch); 
            }

            const allTranslatedSegments = [];

            // 5. Gọi API cho từng lô
            for (const batch of batches) {
                if (batch.length === 0) continue;

                // Xây dựng URL cho lô này
                const queryParams = batch.map(text => `q=${encodeURIComponent(text)}`).join('&');
                const url = `${baseURL}&${queryParams}`;

                const transResponse = await fetch(url, { method: 'GET' }); // Dùng GET

                if (!transResponse.ok) {
                    // Nếu lô này lỗi, ghi lại và thêm kết quả rỗng
                    console.warn(`Google Translate API error! Status: ${transResponse.status} for batch:`, batch[0]);
                    allTranslatedSegments.push(...batch.map(() => '')); // Thêm chuỗi rỗng
                    continue; // Bỏ qua lô này và tiếp tục lô tiếp theo
                }

                const transData = await transResponse.json();
                
                // Xử lý phản hồi
                if (transData && transData[0]) {
                    const batchTranslations = transData[0].map(segment => 
                        (segment && segment[0]) ? segment[0] : ''
                    );
                    allTranslatedSegments.push(...batchTranslations);
                } else {
                    // Nếu lô thất bại (dữ liệu rỗng), thêm chuỗi rỗng
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
            // Lấy bản dịch, nếu nó là chuỗi rỗng (do lỗi) thì trả về (Lỗi dịch)
            const translation = originalToTranslated.get(originalText.trim());
            return translation || '(Lỗi dịch)';
        });

        // Trả về kết quả thành công
        return response.status(200).json({ translations: finalTranslations });

    } catch (error) {
        console.error("Lỗi trong /api/translate:", error);
        return response.status(500).json({ message: error.message || 'Lỗi máy chủ không xác định' });
    }
}

