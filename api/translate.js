// Vercel Serverless Function
// Tệp này PHẢI nằm ở /api/translate.js
// Chức năng: Nhận một mảng văn bản và trả về bản dịch tiếng Việt.
// Dùng API gtx (không chính thức) của Google, không cần key.

export default async function handler(request, response) {
    // Chỉ chấp nhận phương thức POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: true, message: 'Method Not Allowed' });
    }

    try {
        const { texts } = request.body;
        
        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return response.status(400).json({ error: true, message: 'Missing "texts" array in body' });
        }

        // API gtx (không chính thức) dùng để test
        // Chúng ta dùng một ký tự phân tách đặc biệt
        const SEP = '[[[§]]]'; 
        const q = encodeURIComponent(texts.join(`\n${SEP}\n`));
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${q}`;
        
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`Google Translate API (gtx) failed with status: ${res.status}`);
        }
        
        const arr = await res.json();
        
        // Phân tích phản hồi phức tạp của gtx
        const flat = (arr?.[0] || []).map(seg => seg?.[0] ?? '').join('');
        let parts = flat.split(`\n${SEP}\n`);
        
        // Xử lý trường hợp gtx gộp các chuỗi ngắn lại (phản hồi không khớp)
        if (parts.length !== texts.length) {
            console.warn('GTX translation mismatch. Returning single string or error.');
            const first = flat || '(Chưa dịch)';
            // Trả về mảng có cùng độ dài với mảng gốc
            parts = [first, ...Array(Math.max(0, texts.length - 1)).fill('(Chưa dịch)')];
        }

        // Trả về mảng các bản dịch thành công
        return response.status(200).json({ translations: parts });

    } catch (e) {
        console.error('Backend Error (translate.js):', e);
        return response.status(500).json({ error: true, message: e.message || 'Lỗi dịch thuật' });
    }
}

