// api/youtube.js (Code Đã Tối Ưu)

import { getYoutubeApiKey } from './utils/apiConfig'; 

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Lấy API Key đã được kiểm tra và xác thực từ module cấu hình
        const YOUTUBE_API_KEY = getYoutubeApiKey(); 
        
        const { videoId } = request.body;
        
        if (!videoId) {
            return response.status(400).json({ message: 'Missing videoId' });
        }

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        
        const apiResponse = await fetch(apiUrl);
        
        if (!apiResponse.ok) {
            // Xử lý lỗi từ YouTube API
            const errorText = await apiResponse.text();
            throw new Error(`YouTube API failed: ${apiResponse.status} - ${errorText}`);
        }

        const data = await apiResponse.json();
        
        if (data.items.length === 0) {
            return response.status(404).json({ message: 'Video not found or is private/deleted.' });
        }

        response.status(200).json(data.items[0]);
    } catch (error) {
        console.error('Error in YouTube API handler:', error.message);
        // Trả về lỗi 500 với thông điệp chung (hoặc thông điệp cụ thể nếu là lỗi API Key)
        response.status(500).json({ message: 'Server error when fetching video details.', error: error.message });
    }
}