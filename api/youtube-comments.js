// Vercel Serverless Function
// Tệp này PHẢI nằm ở /api/youtube-comments.js

export default async function handler(request, response) {
    // Chỉ chấp nhận phương thức POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: true, message: 'Method Not Allowed' });
    }

    try {
        const { videoId, pageToken = '' } = request.body;
        
        if (!videoId) {
            return response.status(400).json({ error: true, message: 'Missing videoId' });
        }

        // Lấy API Key YouTube từ Biến Môi Trường (an toàn)
        // Đây là key bạn đã cài đặt trên Vercel (MY_YOUTUBE_API_KEY)
        const YOUTUBE_API_KEY = process.env.MY_YOUTUBE_API_KEY;

        if (!YOUTUBE_API_KEY) {
            return response.status(500).json({ error: true, message: 'YouTube API key không được cấu hình trên máy chủ' });
        }
        
        // Xây dựng URL API
        let apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${encodeURIComponent(videoId)}&key=${YOUTUBE_API_KEY}&maxResults=100&textFormat=plain`;
        
        if (pageToken) {
            apiUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
        }

        // Gọi API YouTube từ backend
        const ytResponse = await fetch(apiUrl);

        if (!ytResponse.ok) {
            const errorData = await ytResponse.json();
            const errorMessage = errorData.error?.message || `YouTube API error: ${ytResponse.status}`;
            console.error('YouTube API Error:', errorMessage);
            return response.status(ytResponse.status).json({ error: true, message: errorMessage });
        }
        
        const data = await ytResponse.json();
        
        // Trả dữ liệu (items, nextPageToken) về cho frontend
        return response.status(200).json(data);

    } catch (error) {
        console.error('Backend Error (youtube-comments):', error);
        return response.status(500).json({ error: true, message: error.message || 'Lỗi không xác định' });
    }
}

