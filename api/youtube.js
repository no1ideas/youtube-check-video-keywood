// Đây là "Người gác cổng" cho YouTube (file /api/youtube.js)
// Nó sẽ chạy trên máy chủ, không phải trình duyệt.

export default async function handler(request, response) {
    // Chỉ chấp nhận phương thức POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Chỉ chấp nhận POST' });
    }

    try {
        const { videoId } = request.body;
        if (!videoId) {
            return response.status(400).json({ message: 'Thiếu videoId' });
        }

        // 1. LẤY API KEY BÍ MẬT (Từ Biến Môi Trường)
        // Chúng ta sẽ cài đặt biến này trên Vercel sau
        const YOUTUBE_API_KEY = process.env.MY_YOUTUBE_API_KEY;

        if (!YOUTUBE_API_KEY) {
             throw new Error("Chưa cài đặt API Key cho máy chủ");
        }

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`;
        
        const ytResponse = await fetch(apiUrl);
        
        if (!ytResponse.ok) {
            const errorData = await ytResponse.json();
            console.error("Lỗi từ YouTube API:", errorData);
            throw new Error(errorData.error?.message || `Lỗi API YouTube: ${ytResponse.status}`);
        }
        
        const data = await ytResponse.json();
        
        if (data.items && data.items.length > 0) {
            const snippet = data.items[0].snippet;
            const videoData = {
                title: snippet.title,
                description: snippet.description,
                tags: snippet.tags || []
            };
            // 2. Trả dữ liệu về cho Frontend
            return response.status(200).json(videoData);
        } else {
            throw new Error("Không tìm thấy video");
        }

    } catch (error) {
        console.error("Lỗi trong /api/youtube:", error.message);
        return response.status(500).json({ message: error.message || 'Lỗi máy chủ không xác định' });
    }
}
