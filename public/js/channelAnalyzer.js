// ==================================================================
// === SCRIPT CHO CÔNG CỤ PHÂN TÍCH KÊNH (Analyzer Tool) ===
// ==================================================================
function initChannelAnalyzer() {
    // === KHAI BÁO BIẾN ===
    
    // DOM Elements (với tiền tố "analyzer-")
    const urlInput = document.getElementById('analyzer-urlInput');
    const searchButton = document.getElementById('analyzer-searchButton');
    const resultsContainer = document.getElementById('analyzer-results');
    const errorContainer = document.getElementById('analyzer-error');
    const statusContainer = document.getElementById('analyzer-status');
    const statusText = document.getElementById('analyzer-statusText');
    const filterContainerWrapper = document.getElementById('analyzer-filterContainerWrapper');
    const yearFilter = document.getElementById('analyzer-yearFilter');
    const viewsFilter = document.getElementById('analyzer-viewsFilter');
    const videoTypeFilter = document.getElementById('analyzer-videoTypeFilter');
    const timezoneFilter = document.getElementById('analyzer-timezoneFilter');
    const toggleKeywordsButton = document.getElementById('analyzer-toggleKeywordsButton');
    const copySuccessMessage = document.getElementById('analyzer-copySuccess');
    
    // Nút Phân Tích (Sửa lại)
    const analysisButtonContainer = document.getElementById('analyzer-analysisButtonContainer');
    const analysisButton = document.getElementById('analyzer-analysisButton'); // Nút phân tích KÊNH
    const analysisResults = document.getElementById('analyzer-analysisResults');
    const analysisTitle = document.getElementById('analyzer-analysisTitle');
    const hideAnalysisButton = document.getElementById('analyzer-hideAnalysisButton'); // Nút ẩn mới

    // --- BIẾN & DOM MỚI CHO "GIỎ VIDEO" ---
    const savedCountSpan = document.getElementById('analyzer-saved-count'); // Bây giờ là span bên trong nút
    const showSavedListBtn = document.getElementById('analyzer-show-saved-list'); // Nút mới
    const savedListModal = document.getElementById('analyzer-saved-list-modal');
    const modalCloseBtn = document.getElementById('analyzer-modal-close-btn');
    const modalBody = document.getElementById('analyzer-modal-body');
    const modalTitle = document.getElementById('analyzer-modal-title');
    const modalClearBtn = document.getElementById('analyzer-modal-clear-btn');
    const modalAnalyzeBtn = document.getElementById('analyzer-modal-analyze-btn'); // Nút phân tích GIỎ HÀNG
    // ------------------------------------

    // Kiểm tra xem có ở đúng trang không
    if (!searchButton) return;

    // Biến toàn cục (chỉ cho công cụ này)
    let allFetchedVideos = []; // Lưu kết quả TÌM KIẾM hiện tại
    let savedVideos = [];      // Lưu GIỎ HÀNG
    let showKeywords = false;
    let copyTimeout = null;
    let chartInstances = {}; // Để lưu trữ các biểu đồ
    let activeHourFilter = null; 
    let activeDayFilter = null;  

    // Mảng màu (Sử dụng CSS Variables đã định nghĩa trong <style>)
    const CHART_COLORS = {
        blue: 'rgba(24, 144, 255, 0.7)', // var(--primary-blue-light)
        green: 'rgba(16, 185, 129, 0.7)', // Màu xanh lá (giữ nguyên cho biểu đồ này)
        yellow: 'rgba(245, 159, 11, 0.7)', // Màu vàng (giữ nguyên cho biểu đồ này)
    };
    
    const WEEKDAY_NAMES = [ 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7' ];
    const EN_WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Nhãn cho biểu đồ chi tiết
    const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
        const h1 = String(i).padStart(2, '0');
        const h2 = String(i + 1).padStart(2, '0');
        return `${h1}:00 - ${h2 === '24' ? '00' : h2}:00`;
    });
    
    const GAP_LABELS = [
        "0 ngày (Cùng ngày)", "1 ngày", "2 ngày", "3 ngày", "4 ngày", "5 ngày", "6 ngày",
        "7 ngày (1 Tuần)", "8-14 ngày", "15-29 ngày", "30+ ngày (1 Tháng+)"
    ];

    // === GẮN SỰ KIỆN ===
    searchButton.addEventListener('click', handleSearch);
    
    yearFilter.addEventListener('change', updateDashboard);
    viewsFilter.addEventListener('change', updateDashboard);
    videoTypeFilter.addEventListener('change', updateDashboard);
    timezoneFilter.addEventListener('change', updateDashboard);

    toggleKeywordsButton.addEventListener('click', handleToggleKeywords);
    
    analysisButton.addEventListener('click', handleAnalyzeChannel); // Phân tích KÊNH
    hideAnalysisButton.addEventListener('click', hideAnalysis); // Nút ẩn
    
    urlInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());
    
    resultsContainer.addEventListener('click', handleCardClick); // Uỷ quyền sự kiện
    showSavedListBtn.addEventListener('click', showSavedListModal); // Nút này giờ chỉ mở modal
    modalCloseBtn.addEventListener('click', hideSavedListModal);
    modalClearBtn.addEventListener('click', handleClearSavedList);
    modalAnalyzeBtn.addEventListener('click', handleAnalyzeSavedList); // Nút trong modal
    modalBody.addEventListener('click', handleRemoveFromSaved); // Uỷ quyền sự kiện
    
    savedListModal.addEventListener('click', (e) => {
        if (e.target === savedListModal) {
            hideSavedListModal();
        }
    });

    /**
     * [HÀM MỚI] Quản lý trạng thái active của 2 nút tab
     * @param {'channel' | 'cart' | 'none'} activeState 
     */
    function setActiveTab(activeState) {
        // Các lớp (class) cho trạng thái KHÔNG HOẠT ĐỘNG (xám)
        const inactiveClasses = ['bg-gray-200', 'text-gray-700', 'hover:bg-gray-300'];
        // Code ĐÃ ĐIỀU CHỈNH trong channelAnalyzer.js
// Sử dụng các lớp tiện ích CSS đã được định nghĩa trong style.css
const activeClasses = ['bg-primary-dark', 'text-white', 'hover:bg-primary-dark'];

        // 1. Nút Phân Tích Kênh
        if (analysisButton) {
            analysisButton.classList.remove(...activeClasses, ...inactiveClasses);
            if (activeState === 'channel') {
                analysisButton.classList.add(...activeClasses);
            } else {
                analysisButton.classList.add(...inactiveClasses);
            }
        }
        
        // 2. Nút Giỏ Hàng
        if (showSavedListBtn) {
            showSavedListBtn.classList.remove(...activeClasses, ...inactiveClasses);
            if (activeState === 'cart') {
                showSavedListBtn.classList.add(...activeClasses);
            } else {
                showSavedListBtn.classList.add(...inactiveClasses);
            }
        }
    }
    
    // === CÁC HÀM CHÍNH ===

    function updateDashboard() {
        const year = parseInt(yearFilter.value, 10);
        
        // 1. Lấy danh sách video lọc chính
        const mainFilteredVideos = getFilteredVideos();

        // 2. Tạo các danh sách video phụ để tính toán biểu đồ
        const selectedTz = (timezoneFilter.value === 'local') ? undefined : timezoneFilter.value;

        const videosForHourChart = mainFilteredVideos.filter(v => 
            !activeDayFilter || videoMatchesDay(v, activeDayFilter, selectedTz)
        );
        const videosForDayChart = mainFilteredVideos.filter(v => 
            !activeHourFilter || videoMatchesHour(v, activeHourFilter, selectedTz)
        );
        const videosForListAndGap = mainFilteredVideos.filter(v => 
            (!activeDayFilter || videoMatchesDay(v, activeDayFilter, selectedTz)) &&
            (!activeHourFilter || videoMatchesHour(v, activeHourFilter, selectedTz))
        );

        // 3. Render danh sách video
        renderVideoList(videosForListAndGap);

        // 4. Render lại biểu đồ (nếu đang bật)
        if (!analysisResults.classList.contains('hidden')) {
            // Kiểm tra xem đang phân tích KÊNH hay GIỎ HÀNG
            if (analysisTitle.dataset.isSavedListAnalysis === 'true') {
                // Nếu đang phân tích giỏ hàng, không làm gì cả (vì bộ lọc không ảnh hưởng)
            } else {
                // Nếu đang phân tích kênh, cập nhật theo bộ lọc
                runAnalysis(videosForHourChart, videosForDayChart, videosForListAndGap, false);
            }
        }
        
        // 5. Cập nhật số đếm của bộ lọc LOẠI VIDEO
        let videosForTypeCount = [...allFetchedVideos];
        if (year !== 0) {
            videosForTypeCount = videosForTypeCount.filter(v => v.publishedDate.getFullYear() === year);
        }
        updateTypeFilterCounts(videosForTypeCount); 
    }

    // --- CÁC HÀM LOGIC (KHÔNG THAY ĐỔI) ---
    function getHourKey(date, tz) {
        let hourString = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: tz }).format(date);
        let hour = parseInt(hourString, 10);
        if (hour === 24) hour = 0;
        return HOUR_LABELS[hour];
    }
    function getDayKey(date, tz) {
        const weekdayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: tz }).format(date);
        const dayIndex = EN_WEEKDAY_NAMES.indexOf(weekdayName);
        return (dayIndex !== -1) ? WEEKDAY_NAMES[dayIndex] : null;
    }
    function videoMatchesHour(video, hourKey, tz) {
        return getHourKey(video.publishedDate, tz) === hourKey;
    }
    function videoMatchesDay(video, dayKey, tz) {
        return getDayKey(video.publishedDate, tz) === dayKey;
    }
    function setHourFilter(hourKey) {
        activeHourFilter = hourKey;
        updateDashboard();
    }
    function setDayFilter(dayKey) {
        activeDayFilter = dayKey;
        updateDashboard();
    }
    window.setHourFilter = setHourFilter;
    window.setDayFilter = setDayFilter;
    function parseISODuration(durationString) { 
        if (!durationString) return 0; const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/; const matches = durationString.match(regex); if (!matches) return 0; const hours = parseInt(matches[1] || 0, 10); const minutes = parseInt(matches[2] || 0, 10); const seconds = parseInt(matches[3] || 0, 10); return (hours * 3600) + (minutes * 60) + seconds;
    }
    function formatFullDate(date, timezone) { 
        const tz = (timezone === 'local') ? undefined : timezone; const h = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz, hour12: false }).format(date); const wd_long = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: tz }).format(date); const d = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: tz }).format(date); const finalTime = h.startsWith("24:") ? h.replace("24:", "00:") : h; return `${finalTime}, ${wd_long}, ${d}`;
    }
    // ----------------------------------------

    async function handleSearch() {
        const url = urlInput.value.trim();
        if (!url) { showError('Vui lòng nhập URL kênh YouTube.'); return; }

        clearResults();
        showStatus('Đang tìm kiếm Channel ID...');

        try {
            const channelId = await getChannelId_backend(url);
            if (!channelId) return;
            
            showStatus('Đã tìm thấy kênh! Đang lấy danh sách video... (có thể mất vài phút)');
            const uploadsPlaylistId = channelId.replace('UC', 'UU');
            const videos = await getVideosFromPlaylist_backend(uploadsPlaylistId);
            if (videos.length === 0) { showError('Kênh này không có video công khai nào.'); hideStatus(); return; }
            
            showStatus(`Đã tải ${videos.length} video. Đang lấy lượt xem và từ khóa...`);
            const videoDetailsMap = await getVideoDetails_backend(videos);

            allFetchedVideos = videos.map(video => {
                const videoId = video.snippet.resourceId.videoId;
                const details = videoDetailsMap.get(videoId) || { viewCount: 0, tags: [], duration: 'PT0S', liveBroadcastContent: 'none' };
                const duration = details.duration || 'PT0S';
                const liveContent = details.liveBroadcastContent || 'none';
                let videoType = 'long';
                const seconds = parseISODuration(duration);
                if (liveContent === 'live' || liveContent === 'upcoming') videoType = 'live';
                else if (seconds > 0 && seconds <= 60) videoType = 'short';
                
                return {
                    id: videoId, 
                    snippet: video.snippet,
                    publishedDate: new Date(video.snippet.publishedAt),
                    viewCount: parseInt(details.viewCount || 0, 10), 
                    tags: details.tags, 
                    videoType: videoType
                };
            });

            populateYearOptions(allFetchedVideos); 
            updateDashboard(); 
            
            filterContainerWrapper.classList.remove('hidden');
            analysisButtonContainer.classList.remove('hidden'); // Hiện 2 nút tab
            hideStatus();
        } catch (error) { console.error('Lỗi trong handleSearch:', error); showError(`Đã xảy ra lỗi: ${error.message}. Kiểm tra Console (F12).`); hideStatus(); }
    }

    // [BACKEND] GỌI /api/channel-analyzer
    async function getChannelId_backend(url) {
        showStatus('Đang phân giải URL tùy chỉnh...');
        try {
            const response = await fetch('/api/channel-analyzer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getChannelId', url: url })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi không xác định từ backend');
            }
            return data.channelId; 
        } catch (error) {
            console.error('Lỗi tìm Channel ID:', error);
            showError(`Lỗi khi phân giải URL: ${error.message}`);
            hideStatus();
            return null;
        }
    }
    
    // [BACKEND] GỌI /api/channel-analyzer
    async function getVideosFromPlaylist_backend(playlistId) {
        let allVideos = [];
        let nextPageToken = null;
        let page = 1;
        try {
            do {
                statusText.textContent = `Đang tải trang video thứ ${page}... (Tổng: ${allVideos.length} video)`;
                const response = await fetch('/api/channel-analyzer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'getVideosFromPlaylist', 
                        playlistId: playlistId,
                        pageToken: nextPageToken
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Lỗi API: ${response.statusText}`);
                }
                
                const data = await response.json();
                if (data.items) allVideos = allVideos.concat(data.items);
                nextPageToken = data.nextPageToken;
                page++;
            } while (nextPageToken);
            return allVideos;
        } catch (error) {
            console.error('Lỗi khi lấy video từ playlist:', error);
            showError(`Lỗi khi tải danh sách video: ${error.message}`);
            return allVideos;
        }
    }

    // [BACKEND] GỌI /api/channel-analyzer
    async function getVideoDetails_backend(playlistItems) {
        const detailsMap = new Map();
        const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId);
        
        for (let i = 0; i < videoIds.length; i += 50) {
            const idBatch = videoIds.slice(i, i + 50);
            
            try {
                const response = await fetch('/api/channel-analyzer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'getVideoDetails', 
                        videoIds: idBatch
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Lỗi API khi lấy chi tiết video.`);
                }
                
                const data = await response.json(); 
                
                if (data.items) {
                    data.items.forEach(video => {
                        const stats = video.statistics || {};
                        const snippet = video.snippet || {};
                        const contentDetails = video.contentDetails || {};
                        detailsMap.set(video.id, {
                            viewCount: stats.viewCount || 0,
                            tags: snippet.tags || [],
                            duration: contentDetails.duration || 'PT0S',
                            liveBroadcastContent: snippet.liveBroadcastContent || 'none'
                        });
                    });
                }
            } catch (error) {
                console.error('Lỗi khi lấy chi tiết video (batch):', error);
                showError(error.message);
            }
        }
        return detailsMap;
    }

    function populateYearOptions(videos) { 
        const total = videos.length; const yearCounts = {}; videos.forEach(video => { const year = video.publishedDate.getFullYear(); yearCounts[year] = (yearCounts[year] || 0) + 1; }); while (yearFilter.options.length > 1) { yearFilter.remove(1); } yearFilter.options[0].textContent = `Tất cả năm (${total})`; const sortedYears = Object.keys(yearCounts).sort((a, b) => b - a); sortedYears.forEach(year => { const option = document.createElement('option'); option.value = year; option.textContent = `${year} (${yearCounts[year]})`; yearFilter.appendChild(option); });
    }
    function updateTypeFilterCounts(videos) { 
        const total = videos.length; const typeCounts = { long: 0, short: 0, live: 0 }; videos.forEach(video => { if (video.videoType) typeCounts[video.videoType]++; }); videoTypeFilter.options[0].textContent = `Tất cả (${total})`; videoTypeFilter.options[1].textContent = `Video dài (${typeCounts.long})`; videoTypeFilter.options[2].textContent = `Video ngắn (${typeCounts.short})`; videoTypeFilter.options[3].textContent = `Phát trực tiếp (${typeCounts.live})`;
    }
    function getFilteredVideos() { 
        const year = parseInt(yearFilter.value, 10); const topN = parseInt(viewsFilter.value, 10); const videoType = videoTypeFilter.value; let filteredVideos = [...allFetchedVideos]; if (year !== 0) { filteredVideos = filteredVideos.filter(video => video.publishedDate.getFullYear() === year); } if (videoType !== 'all') { filteredVideos = filteredVideos.filter(v => v.videoType === videoType); } if (topN !== 0) { filteredVideos.sort((a, b) => b.viewCount - a.viewCount); filteredVideos = filteredVideos.slice(0, topN); } return filteredVideos;
    }

    function renderVideoList(filteredVideos) {
        let videosToDisplay = [...filteredVideos];
        const topN = parseInt(viewsFilter.value, 10);
        if (topN === 0) {
             videosToDisplay.sort((a, b) => b.publishedDate - a.publishedDate);
        }
        displayVideos(videosToDisplay);
    }

    function displayVideos(videos) {
        resultsContainer.innerHTML = '';
        if (videos.length === 0) { resultsContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center">Không tìm thấy video nào phù hợp.</p>'; return; }
        
        const selectedTz = timezoneFilter.value; 

        videos.forEach(video => {
            const videoId = video.id; 
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const title = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.medium ? video.snippet.thumbnails.medium.url : 'https://placehold.co/320x180';
            
            const formattedDate = formatFullDate(video.publishedDate, selectedTz); 
            const formattedViews = video.viewCount.toLocaleString('vi-VN');
            const tags = video.tags || [];
            const tagsSlice = tags.slice(0, 5); 
            
            let tagsHtml = '';
            if (showKeywords) {
                if (tags.length > 0) {
                    tagsHtml = `<div class="mt-2 pt-2 border-t border-gray-200"><h4 class="text-sm font-semibold text-gray-600 mb-1">Từ khóa:</h4><div class="flex flex-wrap gap-1">${tagsSlice.map(tag => `<span class="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">${tag}</span>`).join('')}</div></div>`;
                } else {
                    tagsHtml = `<div class="mt-2 pt-2 border-t border-gray-200"><p class="text-sm text-gray-500 italic">(Không có từ khóa)</p></div>`;
                }
            }
            
            let copyTagsButtonHtml = '';
            if (showKeywords && tags.length > 0) { 
                copyTagsButtonHtml = `<button class="copy-tags-btn text-xs px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" data-tags="${tags.join(', ')}">Copy Từ khóa</button>`; 
            }
            
            const isSaved = savedVideos.some(v => v.id === videoId);
            const saveBtnText = isSaved ? '✓ Đã Lưu' : '➕ Lưu Video';
            const saveBtnDisabled = isSaved ? 'disabled' : '';

            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl';
            card.innerHTML = `
                <div class="relative">
                    <img src="${thumbnailUrl}" alt="${title}" class="w-full h-40 object-cover" onerror="this.src='https://placehold.co/320x180'">
                </div>
                <div class="p-4 flex-grow flex flex-col">
                    <h3 class="text-base font-semibold text-gray-800 leading-snug mb-2 h-16 overflow-hidden">
                        <a href="${videoUrl}" target="_blank" class="hover:text-[var(--primary-blue-light)] line-clamp-2">${title}</a>
                    </h3>
                    <div class="text-sm text-gray-500 mt-auto">
                        <p class="mb-1">Thời gian đăng: ${formattedDate}</p>
                        <p>Lượt xem: ${formattedViews}</p>
                    </div>
                    ${tagsHtml}
                    <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button class="copy-link-btn text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200" data-link="${videoUrl}">
                            Copy Link
                        </button>
                        ${copyTagsButtonHtml}
                        <button class="save-video-btn" data-video-id="${videoId}" ${saveBtnDisabled}>
                            ${saveBtnText}
                        </button>
                    </div>
                </div>`;
            resultsContainer.appendChild(card);
        });
    }
    
    function handleToggleKeywords() {
        showKeywords = !showKeywords;
        if (showKeywords) { toggleKeywordsButton.textContent = 'Ẩn Từ khóa'; toggleKeywordsButton.classList.replace('bg-green-600', 'bg-red-600'); }
        else { toggleKeywordsButton.textContent = 'Hiện Từ khóa'; toggleKeywordsButton.classList.replace('bg-red-600', 'bg-green-600'); }
        renderVideoList(getFilteredVideos());
    }
    
    // --- CÁC HÀM PHÂN TÍCH (SỬA LẠI) ---
    
    // Nút "Phân tích Kênh (Kênh Hiện Tại)"
    function handleAnalyzeChannel() {
        analysisResults.classList.remove('hidden');
        setActiveTab('channel'); // [ĐÃ SỬA]
        
        const mainFilteredVideos = getFilteredVideos();
        const selectedTz = (timezoneFilter.value === 'local') ? undefined : timezoneFilter.value;
        const videosForHourChart = mainFilteredVideos.filter(v => !activeDayFilter || videoMatchesDay(v, activeDayFilter, selectedTz));
        const videosForDayChart = mainFilteredVideos.filter(v => !activeHourFilter || videoMatchesHour(v, activeHourFilter, selectedTz));
        const videosForListAndGap = mainFilteredVideos.filter(v => 
            (!activeDayFilter || videoMatchesDay(v, activeDayFilter, selectedTz)) &&
            (!activeHourFilter || videoMatchesHour(v, activeHourFilter, selectedTz))
        );
        
        runAnalysis(videosForHourChart, videosForDayChart, videosForListAndGap, false); // false = không phải giỏ hàng
    }

    // Nút "Ẩn Phân Tích" (MỚI)
    function hideAnalysis() {
        analysisResults.classList.add('hidden');
        setActiveTab('none'); // [ĐÃ SỬA]
        
        activeHourFilter = null;
        activeDayFilter = null;
        updateDashboard(); 
    }
    
    function runAnalysis(videosForHour, videosForDay, videosForGap, isSavedListAnalysis = false) {
        destroyCharts();
        
        if (analysisTitle) {
            const totalVideosInList = videosForGap.length; 
            
            if (isSavedListAnalysis) {
                analysisTitle.textContent = `Phân Tích Dựa Trên Giỏ Hàng (${totalVideosInList} video đã lưu)`;
                analysisTitle.dataset.isSavedListAnalysis = 'true'; 
            } else if (yearFilter.value == "0" && videoTypeFilter.value == "all" && viewsFilter.value == "0" && !activeHourFilter && !activeDayFilter) {
                analysisTitle.textContent = `Phân Tích Thói Quen Đăng Video (Toàn bộ ${totalVideosInList} video)`;
                analysisTitle.dataset.isSavedListAnalysis = 'false'; 
            } else {
                analysisTitle.textContent = `Phân Tích Dựa Trên Bộ Lọc (${totalVideosInList} video phù hợp)`;
                analysisTitle.dataset.isSavedListAnalysis = 'false'; 
            }
        }

        const selectedTz = (timezoneFilter.value === 'local') ? undefined : timezoneFilter.value;

        // 1. Phân tích Giờ
        const hourData = {}; HOUR_LABELS.forEach(label => hourData[label] = 0); 
        videosForHour.forEach(video => {
            const hourKey = getHourKey(video.publishedDate, selectedTz);
            if (hourKey) hourData[hourKey]++;
        });

        // 2. Phân tích Thứ
        const dayOfWeekData = {}; WEEKDAY_NAMES.forEach(label => dayOfWeekData[label] = 0); 
        videosForDay.forEach(video => {
            const dayKey = getDayKey(video.publishedDate, selectedTz);
            if(dayKey) { dayOfWeekData[dayKey]++; }
        });

        // 3. Phân tích Nhịp độ
        const sortedVideos = [...videosForGap].sort((a, b) => a.publishedDate - b.publishedDate);
        const gapData = {}; GAP_LABELS.forEach(label => gapData[label] = 0);
        let totalGaps = 0;
        for (let i = 1; i < sortedVideos.length; i++) {
            const dateA_str = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: selectedTz }).format(sortedVideos[i].publishedDate);
            const dateB_str = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: selectedTz }).format(sortedVideos[i-1].publishedDate);
            const dateA = new Date(dateA_str); const dateB = new Date(dateB_str);
            const diffTime = dateA.getTime() - dateB.getTime(); const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            totalGaps++;
            if (diffDays === 0) gapData["0 ngày (Cùng ngày)"]++;
            else if (diffDays === 1) gapData["1 ngày"]++; else if (diffDays === 2) gapData["2 ngày"]++; else if (diffDays === 3) gapData["3 ngày"]++; else if (diffDays === 4) gapData["4 ngày"]++; else if (diffDays === 5) gapData["5 ngày"]++; else if (diffDays === 6) gapData["6 ngày"]++; else if (diffDays === 7) gapData["7 ngày (1 Tuần)"]++; else if (diffDays >= 8 && diffDays <= 14) gapData["8-14 ngày"]++; else if (diffDays >= 15 && diffDays <= 29) gapData["15-29 ngày"]++; else if (diffDays >= 30) gapData["30+ ngày (1 Tháng+)"]++;
        }

        const hourSorted = getSortedData(hourData);
        const daySorted = getSortedData(dayOfWeekData);
        const gapSorted = getSortedData(gapData);

        const hourMeaning = getAnalysisMeaning(hourData, videosForHour.length, 'khung giờ');
        const hourRec = getAnalysisRecommendation(hourSorted, videosForHour.length, 'khung giờ', 'setHourFilter', activeHourFilter, isSavedListAnalysis);
        createBarChart('analyzer-chartHour', hourData, hourMeaning, hourRec, CHART_COLORS.blue);
        
        const dayOfWeekMeaning = getAnalysisMeaning(dayOfWeekData, videosForDay.length, 'ngày');
        const dayOfWeekRec = getAnalysisRecommendation(daySorted, videosForDay.length, 'ngày', 'setDayFilter', activeDayFilter, isSavedListAnalysis);
        createBarChart('analyzer-chartDayOfWeek', dayOfWeekData, dayOfWeekMeaning, dayOfWeekRec, CHART_COLORS.green);

        const gapMeaning = getAnalysisMeaning(gapData, totalGaps, 'nhịp độ');
        const gapRec = getAnalysisRecommendation(gapSorted, totalGaps, 'nhịp độ', '', null, isSavedListAnalysis);
        createBarChart('analyzer-chartDayOfMonth', gapData, gapMeaning, gapRec, CHART_COLORS.yellow);
    }
    
    function getSortedData(data) {
        return Object.entries(data)
            .map(([key, value]) => ({ key, value }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }

    function getAnalysisMeaning(data, total, unit) { 
        if (total <= 0) return '<p>Không có dữ liệu cho mục này.</p>'; let maxKey = ''; let maxVal = -1; for (const [key, value] of Object.entries(data)) { if (value > maxVal) { maxVal = value; maxKey = key; } } if (maxVal <= 0) return `<p>Không có dữ liệu cho mục này.</p>`; const percentage = ((maxVal / total) * 100).toFixed(1); return `<p>Phân tích cho thấy <strong>${maxKey}</strong> là ${unit} phổ biến nhất, với <strong>${maxVal} lần</strong> (chiếm ${percentage}%).</p>`;
    }
    
    function getAnalysisRecommendation(sortedData, total, unit, filterFunction = '', activeFilter = null, isSavedListAnalysis = false) {
        if (total <= 0) { return '<h4 class="font-semibold text-gray-800 mb-2">Đề xuất Top 3:</h4><p class="text-sm">Không có đề xuất nào.</p>'; }
        if (sortedData.length === 0) { return '<h4 class="font-semibold text-gray-800 mb-2">Đề xuất Top 3:</h4><p class="text-sm">Không có đề xuất nào.</p>'; }
        
        let resetButton = '';
        if (filterFunction && !isSavedListAnalysis) { 
            if (activeFilter) {
                resetButton = `<button onclick="${filterFunction}(null)" class="text-xs font-medium text-blue-600 hover:underline">[Xóa lọc]</button>`;
            } else {
                const buttonText = (unit === 'khung giờ') ? 'Lọc thời gian' : 'Lọc ngày';
                resetButton = `<span class="text-xs font-medium text-gray-400">${buttonText}</span>`;
            }
        }
        
        const top3 = sortedData.slice(0, 3);
        let html = `<h4 class="font-semibold text-gray-800 mb-2 flex justify-between items-center"><span>Đề xuất Top 3 ${unit}:</span>${resetButton}</h4>`;
        html += '<ul class="list-none space-y-1">';
        
        top3.forEach((item, index) => { 
            const percentage = ((item.value / total) * 100).toFixed(1);
            let itemClass = "flex justify-between items-center text-sm p-1 rounded-md transition-all";
            let onclick = '';
            
            if (filterFunction && !isSavedListAnalysis) { 
                if (item.key === activeFilter) {
                    itemClass += " bg-blue-100 text-blue-700 font-bold";
                } else {
                    itemClass += " cursor-pointer hover:bg-gray-100";
                    onclick = `onclick="${filterFunction}('${item.key}')"`;
                }
            }

            html += `<li class="relative ${itemClass}" ${onclick}>
                        <span class="truncate pr-2"><strong>${index + 1}. ${item.key}</strong></span>
                        <span class="font-medium flex-shrink-0">${item.value} (${percentage}%)</span>
                     </li>`; 
        });
        html += '</ul>';
        return html;
    }

    function createBarChart(canvasId, data, meaningText, recommendationText, color) { 
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.error(`Không tìm thấy canvas với ID: ${canvasId}`);
            return;
        }
        const labels = Object.keys(data); 
        const values = Object.values(data); 
        const chart = new Chart(ctx.getContext('2d'), { 
            type: 'bar', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Số video/Số lần', 
                    data: values, 
                    backgroundColor: color, 
                    borderColor: color.replace('0.7', '1'), 
                    borderWidth: 1 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    x: { ticks: { display: true }, grid: { display: false } }, 
                    y: { beginAtZero: true, ticks: { precision: 0 } } 
                }, 
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}` } } 
                } 
            } 
        }); 
        chartInstances[canvasId] = chart; 
        const meaningEl = document.getElementById(canvasId + 'Meaning'); 
        if (meaningEl) meaningEl.innerHTML = meaningText; 
        const recEl = document.getElementById(canvasId + 'Recommendation'); 
        if (recEl) recEl.innerHTML = recommendationText;
    }

    // === CÁC HÀM TIỆN ÍCH (Copy, Thông báo, Dọn dẹp) ===
    
    function handleCardClick(event) {
        let textToCopy = null; 
        let buttonElement = null;

        if (event.target.classList.contains('copy-link-btn')) { 
            textToCopy = event.target.dataset.link; 
            buttonElement = event.target;
        } 
        else if (event.target.classList.contains('copy-tags-btn')) { 
            textToCopy = event.target.dataset.tags; 
            buttonElement = event.target;
        } 
        else if (event.target.classList.contains('save-video-btn')) {
            handleSaveVideoClick(event.target);
            return; 
        }
        
        if (textToCopy && buttonElement) {
             window.copyToClipboard(textToCopy, buttonElement);
             showCopySuccess();
        }
    }

    // --- CÁC HÀM MỚI CHO "GIỎ VIDEO" ---

    function handleSaveVideoClick(saveButton) {
        const videoId = saveButton.dataset.videoId;
        
        const isAlreadySaved = savedVideos.some(v => v.id === videoId);
        if (isAlreadySaved) return;

        const videoToSave = allFetchedVideos.find(v => v.id === videoId);
        if (!videoToSave) {
            console.error("Không tìm thấy video để lưu?", videoId);
            return;
        }

        savedVideos.push(videoToSave);

        saveButton.textContent = '✓ Đã Lưu';
        saveButton.disabled = true;
        updateSavedListBar();
    }

    // [ĐÃ SỬA]
    function updateSavedListBar() {
        const count = savedVideos.length;
        if (savedCountSpan) {
            savedCountSpan.textContent = count; 
        }
    }

    function showSavedListModal() {
        modalBody.innerHTML = ''; 
        const count = savedVideos.length;
        modalTitle.textContent = `Giỏ Video Đã Lưu (${count} video)`;

        if (count === 0) {
            modalBody.innerHTML = '<p class="text-gray-500 text-center">Bạn chưa lưu video nào.</p>';
        } else {
            savedVideos.forEach(video => {
                const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
                const thumbnailUrl = video.snippet.thumbnails.medium ? video.snippet.thumbnails.medium.url : 'https://placehold.co/320x180';
                
                const itemEl = document.createElement('div');
                itemEl.className = 'modal-list-item';
                itemEl.innerHTML = `
                    <img src="${thumbnailUrl}" alt="${video.snippet.title}" class="modal-list-img">
                    <div class="modal-list-title">
                        <a href="${videoUrl}" target="_blank" class="hover:text-[var(--primary-blue-light)] font-medium">${video.snippet.title}</a>
                        <p class="text-xs text-gray-500">${video.snippet.channelTitle}</p>
                    </div>
                    <button class="modal-list-remove-btn" data-video-id="${video.id}">Xóa</button>
                `;
                modalBody.appendChild(itemEl);
            });
        }
        
        savedListModal.classList.remove('hidden');
    }
    
    function hideSavedListModal() {
        savedListModal.classList.add('hidden');
    }

    function handleRemoveFromSaved(event) {
        if (!event.target.classList.contains('modal-list-remove-btn')) return;
        
        const videoId = event.target.dataset.videoId;
        
        savedVideos = savedVideos.filter(v => v.id !== videoId);
        showSavedListModal();
        updateSavedListBar();

        const correspondingSaveBtn = resultsContainer.querySelector(`.save-video-btn[data-video-id="${videoId}"]`);
        if (correspondingSaveBtn) {
            correspondingSaveBtn.textContent = '➕ Lưu Video';
            correspondingSaveBtn.disabled = false;
        }
    }

    function handleClearSavedList() {
        if (savedVideos.length === 0) return;
        
        if (confirm(`Bạn có chắc muốn xóa tất cả ${savedVideos.length} video đã lưu?`)) {
            savedVideos = [];
            showSavedListModal(); 
            updateSavedListBar(); 
            
            resultsContainer.querySelectorAll('.save-video-btn:disabled').forEach(btn => {
                btn.textContent = '➕ Lưu Video';
                btn.disabled = false;
            });
        }
    }

    // Nút "Phân Tích Toàn Bộ Giỏ Hàng"
    function handleAnalyzeSavedList() {
        if (savedVideos.length === 0) {
            alert("Bạn chưa có video nào trong giỏ hàng để phân tích.");
            return;
        }

        hideSavedListModal();
        runAnalysis(savedVideos, savedVideos, savedVideos, true); // true = cờ phân tích giỏ hàng
        analysisResults.classList.remove('hidden');
        setActiveTab('cart'); // [ĐÃ SỬA]
        
        analysisResults.scrollIntoView({ behavior: 'smooth' });
    }

    // ------------------------------------
    
    function showStatus(message) { 
        statusText.textContent = message; statusContainer.classList.remove('hidden');
    }
    function hideStatus() { 
        statusContainer.classList.add('hidden');
    }
    function showError(message) { 
        errorContainer.textContent = message; errorContainer.classList.remove('hidden');
    }
    function clearError() { 
        errorContainer.classList.add('hidden'); errorContainer.textContent = '';
    }
    function showCopySuccess() { 
        if (copyTimeout) clearTimeout(copyTimeout); 
        copySuccessMessage.classList.remove('hidden', 'opacity-0'); 
        copyTimeout = setTimeout(() => { 
            copySuccessMessage.classList.add('opacity-0'); 
            setTimeout(() => copySuccessMessage.classList.add('hidden'), 300); 
        }, 2000);
    }
    function destroyCharts() { 
        for (const id in chartInstances) { 
            if (chartInstances[id]) { 
                chartInstances[id].destroy(); 
                delete chartInstances[id]; 
            } 
        }
    }

    function clearResults() {
        resultsContainer.innerHTML = '';
        clearError();
        filterContainerWrapper.classList.add('hidden');
        analysisButtonContainer.classList.add('hidden');
        analysisResults.classList.add('hidden');
        setActiveTab('none'); // [ĐÃ SỬA]
        
        if (analysisTitle) { 
            analysisTitle.textContent = 'Phân Tích Thói Quen Đăng Video'; 
            analysisTitle.dataset.isSavedListAnalysis = 'false'; 
        }
        destroyCharts();
        
        while (yearFilter.options.length > 1) {
            yearFilter.remove(1);
        }
        yearFilter.value = "0";
        yearFilter.options[0].textContent = 'Tất cả năm'; 
        
        viewsFilter.value = "0";
        
        videoTypeFilter.value = 'all';
        updateTypeFilterCounts([]); 

        timezoneFilter.value = 'local';
        
        showKeywords = false;
        toggleKeywordsButton.textContent = 'Hiện Từ khóa';
        toggleKeywordsButton.classList.replace('bg-red-600', 'bg-green-600');
        allFetchedVideos = [];

        activeHourFilter = null;
        activeDayFilter = null;
        
        updateSavedListBar();
    }
}