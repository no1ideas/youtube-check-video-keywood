// File: api/utils/youtube-comments.js

/**
 * Hàm hỗ trợ lấy bình luận (từng trang) từ một video YouTube
 */
import { getYoutubeApiKey } from './apiConfig.js';
import fetch from 'node-fetch';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = getYoutubeApiKey();

export async function fetchVideoComments(videoId, pageToken = null, order = 'relevance') {
    let url = `${YOUTUBE_API_URL}/commentThreads?key=${API_KEY}&videoId=${videoId}&part=snippet,replies&maxResults=50&order=${order}`;
    
    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
        let errorMessage = 'Lỗi API YouTube không xác định.';
        if (data.error) {
            errorMessage = data.error.errors[0]?.reason || data.error.message || errorMessage;
        }
        throw new Error(`Lỗi YouTube API: ${errorMessage}`);
    }
    
    // Thêm tổng số comment nếu có
    const totalResults = data.pageInfo?.totalResults || null;

    return {
        items: data.items,
        nextPageToken: data.nextPageToken || null,
        videoTotalComments: totalResults
    };
}