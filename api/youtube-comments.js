// api/youtube-comments.js
// "Người gác cổng" (backend) để lấy comment YouTube một cách an toàn
// PHIÊN BẢN ĐƠN GIẢN: Luôn luôn lấy comment "Nổi bật nhất" (relevance)

export default async function handler(request, response) {
    // Chỉ chấp nhận phương thức POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Chỉ cần videoId và pageToken, vì 'order' đã được mặc định
        const { videoId, pageToken } = request.body; 
        
        if (!videoId) {
            return response.status(400).json({ message: 'Missing videoId' });
        }

        // Lấy API Key từ BIẾN MÔI TRƯỜNG (an toàn)
        const YOUTUBE_API_KEY = process.env.MY_YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) {
            throw new Error("API Key của YouTube chưa được cấu hình trên server.");
        }
        
        // --- LOGIC MỚI: LUÔN LUÔN DÙNG 'relevance' ---
        // Chúng ta không cần đọc 'order' từ body nữa
        const apiOrder = 'relevance';

        // Tạo URL API
        let apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${encodeURIComponent(videoId)}&key=${YOUTUBE_API_KEY}&maxResults=100&textFormat=plainText&order=${apiOrder}`;
        
        if (pageToken) {
            apiUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
        }

        // Gọi API YouTube
        const ytResponse = await fetch(apiUrl);
        if (!ytResponse.ok) {
            const errorData = await ytResponse.json();
            console.error('YouTube API Error:', errorData);
            throw new Error(errorData.error.message || `Lỗi YouTube API: ${ytResponse.status}`);
        }
        
        const data = await ytResponse.json();
        
        // --- LOGIC (Lấy tổng số comment) ---
        // Chỉ thêm thông tin này vào lần gọi đầu tiên (khi không có pageToken)
        let responsePayload = { ...data };
        if (!pageToken && data.pageInfo && data.pageInfo.totalResults) {
            // Gửi tổng số comment cấp 1 về cho frontend
            responsePayload.videoTotalComments = data.pageInfo.totalResults;
        }
        
        // Trả dữ liệu về cho frontend
        return response.status(200).json(responsePayload);

    } catch (error) {
        console.error('Lỗi trong /api/youtube-comments:', error);
        return response.status(500).json({ message: error.message || 'Lỗi không xác định' });
    }
}

