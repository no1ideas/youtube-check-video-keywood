// api/youtube-comments.js (Code Đã Tối Ưu)

import { getYoutubeApiKey } from './utils/apiConfig'; 

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Lấy API Key đã được kiểm tra và xác thực từ module cấu hình
        const YOUTUBE_API_KEY = getYoutubeApiKey(); 
        
        const { videoId, maxResults, pageToken } = request.body;

        if (!videoId) {
            return response.status(400).json({ message: 'Missing videoId' });
        }

        let apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=${maxResults || 100}&order=relevance&key=${YOUTUBE_API_KEY}`;
        
        if (pageToken) {
            apiUrl += `&pageToken=${pageToken}`;
        }
        
        const apiResponse = await fetch(apiUrl);
        
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`YouTube Comment API failed: ${apiResponse.status} - ${errorText}`);
        }

        const data = await apiResponse.json();
        response.status(200).json(data);

    } catch (error) {
        console.error('Error in YouTube Comments API handler:', error.message);
        response.status(500).json({ message: 'Server error when fetching comments.', error: error.message });
    }
}