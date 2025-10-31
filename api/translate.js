// --- CHỨC NĂNG BACKEND: /api/translate ---
// API này nhận một danh sách văn bản và một ngôn ngữ mục tiêu (targetLang),
// sau đó gọi đến API dịch (không chính thức) của Google.
// PHIÊN BẢN 6.1: Quay lại gọi tuần tự (sequential) và ẨN LỖI
// Thay vì báo (Lỗi dịch), ta trả về văn bản gốc nếu dịch thất bại.

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
        const originalToTranslated = new Map();
        const uniqueNonEmptyTexts = [...new Set(texts.filter(t => t && t.trim().length > 0))];

        if (uniqueNonEmptyTexts.length > 0) {
            
            // 4. CHIA LÔ (BATCHING) - Logic v4.1 (An toàn)
            const MAX_URL_LENGTH = 2000;
            const MAX_BATCH_ITEMS = 20;
            
            const batches = [];
            let currentBatch = [];
            let currentParamsLength = 0;
            const baseURL = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`;
            const baseLength = baseURL.length;

            for (const text of uniqueNonEmptyTexts) {
                const textParamLength = encodeURIComponent(text).length + 3; // +3 cho '&q='
                
                if (
                    (baseLength + currentParamsLength + textParamLength > MAX_URL_LENGTH && currentBatch.length > 0) || 
                    currentBatch.length >= MAX_BATCH_ITEMS
                ) {
                    batches.push(currentBatch); 
                    currentBatch = [text];     
                    currentParamsLength = textParamLength;
                } else {
                    currentBatch.push(text);
                    currentParamsLength += textParamLength;
                }
            }
            if (currentBatch.length > 0) {
                batches.push(currentBatch); 
            }

            // 5. GỌI API TUẦN TỰ (Sequential)
            // Lặp qua từng lô một để tránh bị rate-limit
            for (const batch of batches) {
                if (batch.length === 0) continue;

                const queryParams = batch.map(text => `q=${encodeURIComponent(text)}`).join('&');
                const url = `${baseURL}&${queryParams}`;
                
                let batchTranslations = [];
                try {
                    const transResponse = await fetch(url, { method: 'GET' });
                    
                    if (!transResponse.ok) {
                        console.warn(`Lỗi 1 lô dịch (status ${transResponse.status}), batch:`, batch[0]);
                        // Gán mảng rỗng, sẽ bị xử lý là (Lỗi dịch) ở bước 7
                        batchTranslations = batch.map(() => undefined); 
                    } else {
                        const transData = await transResponse.json();
                        if (transData && transData[0]) {
                            batchTranslations = transData[0].map(segment => (segment && segment[0]) ? segment[0] : '');
                        } else {
                            // Dữ liệu trả về không hợp lệ
                            batchTranslations = batch.map(() => undefined);
                        }
                    }
                } catch (err) {
                    console.warn(`Lỗi fetch 1 lô dịch: ${err.message}`);
                    batchTranslations = batch.map(() => undefined);
                }
                
                // 6. Ánh xạ (map) bản dịch về văn bản gốc
                batchTranslations.forEach((translatedText, i) => {
                    const originalText = batch[i];
                    originalToTranslated.set(originalText, translatedText);
                });
                
                // Thêm một khoảng dừng nhỏ (100ms) giữa các lô để tránh bị chặn
                await new Promise(resolve => setTimeout(resolve, 100)); 
            }
        }

        // 7. Xây dựng mảng kết quả cuối cùng theo đúng thứ tự của 'texts'
        // --- LOGIC V6.1 (ẨN LỖI) ---
        const finalTranslations = texts.map(originalText => {
            if (!originalText || originalText.trim().length === 0) return '';
            const translation = originalToTranslated.get(originalText.trim());
            
            // Nếu dịch thành công VÀ CÓ NỘI DUNG (translation !== '') thì dùng.
            // Nếu dịch thất bại (undefined) HOẶC dịch ra chuỗi rỗng (''),
            // thì trả về chính văn bản GỐC.
            return (translation) ? translation : originalText;
        });
        // --- KẾT THÚC LOGIC V6.1 ---

        // Trả về kết quả thành công
        return response.status(200).json({ translations: finalTranslations });

    } catch (error) {
        console.error("Lỗi nghiêm trọng trong /api/translate:", error);
        return response.status(500).json({ message: error.message || 'Lỗi máy chủ không xác định' });
    }
}

