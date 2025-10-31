// --- CHỨC NĂNG BACKEND: /api/translate ---
// API này nhận một danh sách văn bản và một ngôn ngữ mục tiêu (targetLang),
// sau đó gọi đến API dịch (không chính thức) của Google.
// PHIÊN BẢN 5.0: Sửa lỗi tốc độ, chạy song song (parallel) các lô

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

            // 5. GỌI API SONG SONG (Parallel)
            // Tạo một mảng các promise (lời hứa)
            const batchPromises = batches.map(batch => {
                if (batch.length === 0) return Promise.resolve(null); // Trả về promise rỗng
                
                const queryParams = batch.map(text => `q=${encodeURIComponent(text)}`).join('&');
                const url = `${baseURL}&${queryParams}`;
                
                return fetch(url, { method: 'GET' })
                    .then(res => {
                        if (!res.ok) {
                            // Nếu lỗi, ném lỗi để Promise.allSettled bắt
                            throw new Error(`API status ${res.status}`);
                        }
                        return res.json(); // Trả về dữ liệu json
                    })
                    .then(transData => {
                        // Xử lý dữ liệu json
                        if (transData && transData[0]) {
                            return transData[0].map(segment => (segment && segment[0]) ? segment[0] : '');
                        }
                        return batch.map(() => ''); // Trả về mảng rỗng nếu dữ liệu không hợp lệ
                    })
                    .catch(err => {
                        console.warn(`Lỗi 1 lô dịch: ${err.message}`);
                        return null; // Trả về null nếu lô bị lỗi
                    });
            });

            // Chờ tất cả các promise hoàn thành (kể cả lỗi)
            const results = await Promise.allSettled(batchPromises);

            // 6. Ánh xạ (map) bản dịch về văn bản gốc
            let textIndex = 0;
            results.forEach((result, batchIndex) => {
                if (result.status === 'fulfilled' && result.value) {
                    // Nếu lô thành công (result.value là mảng các bản dịch)
                    const batchTranslations = result.value;
                    const originalBatch = batches[batchIndex];
                    
                    batchTranslations.forEach((translatedText, i) => {
                        const originalText = originalBatch[i];
                        originalToTranslated.set(originalText, translatedText);
                    });
                } else {
                    // Nếu lô thất bại (status === 'rejected' hoặc value === null)
                    // Chúng ta không cần làm gì, vì map sẽ không có key
                    // và logic ở bước 7 sẽ tự động gán "(Lỗi dịch)"
                    console.warn(`Lô dịch thứ ${batchIndex} thất bại`);
                }
            });
        }

        // 7. Xây dựng mảng kết quả cuối cùng theo đúng thứ tự của 'texts'
        const finalTranslations = texts.map(originalText => {
            if (!originalText || originalText.trim().length === 0) return '';
            const translation = originalToTranslated.get(originalText.trim());
            // Nếu dịch thành công (kể cả ra chuỗi rỗng) thì dùng, nếu không (undefined) thì báo lỗi
            return (translation !== undefined) ? translation : '(Lỗi dịch)';
        });

        // Trả về kết quả thành công
        return response.status(200).json({ translations: finalTranslations });

    } catch (error) {
        console.error("Lỗi nghiêm trọng trong /api/translate:", error);
        return response.status(500).json({ message: error.message || 'Lỗi máy chủ không xác định' });
    }
}

