// api/channel-analyzer.js (Code Đã Tối Ưu)

import { getYoutubeApiKey } from './utils/apiConfig'; 
import { parseChannelUrl } from './channel-analyzer'; // Giữ nguyên hàm parser của bạn

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Lấy API Key đã được kiểm tra và xác thực từ module cấu hình
        const YOUTUBE_API_KEY = getYoutubeApiKey(); 
        
        const { url, maxResults, pageToken } = request.body;

        if (!url) {
            return response.status(400).json({ message: 'Missing channel URL' });
        }

        const parsedData = parseChannelUrl(url);
        if (!parsedData || !parsedData.searchType || !parsedData.searchTerm) {
            return response.status(400).json({ message: 'Invalid or unsupported channel URL format.' });
        }
        
        const { searchTerm, searchType } = parsedData;

        let channelId = null;

        // BƯỚC 1: TÌM CHANNEL ID NẾU ĐƯỢC TÌM KIẾM BẰNG userNames/Handles
        if (searchType !== 'id') {
            const searchPart = (searchType === 'forHandle' || searchType === 'forUsername') ? 'forUsername' : 'id';
            const searchApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&${searchPart}=${searchTerm}&key=${YOUTUBE_API_KEY}`;
            
            const searchResponse = await fetch(searchApiUrl);
            if (!searchResponse.ok) {
                const errorText = await searchResponse.text();
                throw new Error(`Channel Search API failed: ${searchResponse.status} - ${errorText}`);
            }

            const searchData = await searchResponse.json();
            if (searchData.items.length === 0) {
                return response.status(404).json({ message: 'Channel not found.' });
            }
            channelId = searchData.items[0].id;
        } else {
            channelId = searchTerm; // Đã là ID
        }

        // BƯỚC 2: LẤY DANH SÁCH VIDEO
        let videosApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults || 20}&order=date&type=video&key=${YOUTUBE_API_KEY}`;
        
        if (pageToken) {
            videosApiUrl += `&pageToken=${pageToken}`;
        }
        
        const videosResponse = await fetch(videosApiUrl);
        
        if (!videosResponse.ok) {
            const errorText = await videosResponse.text();
            throw new Error(`Video Search API failed: ${videosResponse.status} - ${errorText}`);
        }

        const videosData = await videosResponse.json();
        response.status(200).json(videosData);

    } catch (error) {
        console.error('Error in Channel Analyzer API handler:', error.message);
        response.status(500).json({ message: 'Server error when analyzing channel.', error: error.message });
    }
}