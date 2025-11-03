// ==================================================================
// === SCRIPT CHO CÔNG CỤ COMMENT (Comments Tool) ===
// ==================================================================
function initCommentsTool() {
    // ===== Tham chiếu UI (Giao diện) =====
    const searchButton = document.getElementById('comment-search-button');
    const videoUrlInput = document.getElementById('comment-video-url');
    const resultsDiv = document.getElementById('comment-results');
    const statusDiv = document.getElementById('comment-status');
    const sortBar = document.getElementById('comment-sort-bar');
    const btnSortLike = document.getElementById('sort-like');
    const btnSortReplies = document.getElementById('sort-replies');
    const btnSortDate = document.getElementById('sort-date');
    const timeFilterSelect = document.getElementById('comment-time-filter');
    
    // ĐÃ XÓA orderFilterSelect

    // Kiểm tra xem các element có tồn tại không
    if (!searchButton) return;
    
    // --- GIỚI HẠN COMMENT (MỚI) ---
    const MAX_COMMENTS = 500;

    // ===== State (Trạng thái) =====
    let allThreads = []; // Nơi lưu trữ tất cả bình luận gốc
    let sortKey = 'like'; // Sắp xếp mặc định
    let sortDir = 'desc'; // 'asc' | 'desc'
    let timeFilter = 'all'; // State mới cho bộ lọc thời gian
    
    // ===== Sort handlers (Xử lý Sắp xếp) =====
    function attachSortHandlers() {
        function activate(btn) { [btnSortLike, btnSortReplies, btnSortDate].forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
        function toggleDir(btn, label) { sortDir = (sortDir === 'desc') ? 'asc' : 'desc'; btn.textContent = `${label} ${sortDir === 'desc' ? '↓' : '↑'}`; }

        if (btnSortLike.hasAttribute('data-inited')) return; // Đã gán rồi

        btnSortLike.addEventListener('click', () => {
            if (sortKey !== 'like') { sortKey = 'like'; sortDir = 'desc'; btnSortLike.textContent = 'Like ↓'; } 
            else toggleDir(btnSortLike, 'Like');
            activate(btnSortLike); renderThreads(); // Render lại khi sắp xếp
        });
        btnSortReplies.addEventListener('click', () => {
            if (sortKey !== 'replies') { sortKey = 'replies'; sortDir = 'desc'; btnSortReplies.textContent = 'Cmt cấp 2 ↓'; } 
            else toggleDir(btnSortReplies, 'Cmt cấp 2');
            activate(btnSortReplies); renderThreads(); // Render lại khi sắp xếp
        });
        btnSortDate.addEventListener('click', () => {
            if (sortKey !== 'date') { sortKey = 'date'; sortDir = 'desc'; btnSortDate.textContent = 'Ngày ↓'; } 
            else toggleDir(btnSortDate, 'Ngày');
            activate(btnSortDate); renderThreads(); // Render lại khi sắp xếp
        });
        
        btnSortLike.classList.add('active'); // Kích hoạt mặc định là LIKE
        btnSortLike.setAttribute('data-inited', '1');
    }

    // --- BỘ LỌC THỜI GIAN ---
    function populateTimeFilter() {
        // Trích xuất các năm duy nhất từ bình luận
        const years = new Set(
            allThreads
                .map(t => t.publishedDate ? t.publishedDate.getFullYear() : null)
                .filter(y => y !== null)
        );
        
        // Sắp xếp các năm giảm dần (mới nhất trước)
        const sortedYears = [...years].sort((a, b) => b - a);
        
        // Giữ lại các option cũ (Tất cả, Hôm nay,...)
        const baseOptions = timeFilterSelect.innerHTML;
        timeFilterSelect.innerHTML = baseOptions; // Reset về trạng thái cơ bản

        // Thêm các năm vào dropdown
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = `Năm ${year}`;
            timeFilterSelect.appendChild(option);
        });
    }

    // Gán sự kiện cho bộ lọc thời gian
    timeFilterSelect.addEventListener('change', () => {
        timeFilter = timeFilterSelect.value; // Cập nhật state
        renderThreads(); // Render lại danh sách
    });
    
    // ===== Search flow (Luồng tìm kiếm) =====
    if (searchButton) { 
        searchButton.addEventListener('click', async () => {
            const videoURL = videoUrlInput.value.trim();
            if (!videoURL) { alert('Vui lòng nhập link video YouTube.'); return; }
            const videoId = window.getYoutubeId(videoURL); // Dùng hàm từ utils.js
            if (!videoId) { alert('Link video không hợp lệ. Vui lòng kiểm tra lại.'); return; }

            // ĐÃ SỬA LỖI: Đặt currentMaxLimit ở đây
            const currentMaxLimit = MAX_COMMENTS;

            // Reset
            window.setLoading(searchButton, true, ""); // Dùng hàm từ utils.js
            resultsDiv.innerHTML = ''; statusDiv.textContent = 'Đang lấy dữ liệu, vui lòng chờ...';
            allThreads = [];
            sortBar.style.display = 'none';
            timeFilter = 'all'; // Reset bộ lọc
            // Xóa các option năm cũ
            timeFilterSelect.innerHTML = `
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="90days">90 ngày qua</option>
            `;


            try {
                // 1. Lấy tất cả bình luận (gửi kèm 'order' và 'maxComments')
                // GỌI HÀM VỚI 'relevance' ĐƯỢC HARD-CODE
                // ĐÃ SỬA LỖI: Truyền currentMaxLimit vào
                await fetchAllComments(videoId, 'relevance', null, currentMaxLimit); 
                
                if (allThreads.length === 0) {
                    statusDiv.textContent = 'Không tìm thấy bình luận nào hoặc video đã tắt bình luận.';
                    window.setLoading(searchButton, false, "Tìm kiếm"); 
                    return;
                }
                
                // 2. TẠO BỘ LỌC THỜI GIAN
                populateTimeFilter();

                // 3. Hiển thị
                attachSortHandlers();
                sortBar.style.display = 'flex';
                renderThreads(); // Render lần đầu (đã bao gồm lọc)
                
            } catch (e) {
                console.error('Lỗi:', e);
                statusDiv.textContent = `Đã xảy ra lỗi: ${e.message}`;
            } finally {
                window.setLoading(searchButton, false, "Tìm kiếm"); 
            }
        });
    }

    // ===== Fetch comments (paginate) =====
    async function fetchAllComments(videoId, order, pageToken = '', maxLimit) {
        statusDiv.textContent = `Đang tải bình luận... (đã tải ${allThreads.length} luồng)`;
        
        // Gọi backend /api/youtube-comments
        const response = await fetch('/api/youtube-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                videoId: videoId, 
                pageToken: pageToken,
                order: order // Gửi 'order' (relevance) lên backend
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Lỗi fetchAllComments:", errText);
            let errMessage = 'Lỗi không xác định';
            try {
                const errJson = JSON.parse(errText);
                errMessage = errJson.message || errText;
            } catch(e) {
                errMessage = errText;
            }
            throw new Error(errMessage);
        }

        const data = await response.json();
        
        // --- LOGIC MỚI (video < giới hạn) ---
        // Lấy tổng số comment cấp 1 từ API (chỉ ở lần gọi đầu tiên)
        const totalTopLevelComments = data.videoTotalComments || null;

        if (data.items) {
            // ĐÃ SỬA LỖI: Truyền maxLimit vào
            collectThreads(data.items, maxLimit); 
        }
        
        // --- LOGIC DỪNG MỚI (ĐÃ SỬA LỖI) ---
        
        // 1. Kiểm tra xem đã đạt giới hạn chưa
        if (allThreads.length >= maxLimit) {
            console.log(`Đã đạt giới hạn ${maxLimit} comment, dừng quét.`);
            return; // Dừng đệ quy
        }

        // 2. Kiểm tra xem video có ít comment hơn giới hạn VÀ đã hết trang
        if (totalTopLevelComments && totalTopLevelComments <= maxLimit && !data.nextPageToken) {
             console.log(`Video có ${totalTopLevelComments} comment (ít hơn ${maxLimit}), đã quét hết.`);
            return; // Dừng đt
        }

        // 3. Đệ quy nếu có trang tiếp theo
        if (data.nextPageToken) {
            // Kiểm tra lại lần nữa TRƯỚC KHI gọi
            if (allThreads.length < maxLimit) {
                await fetchAllComments(videoId, order, data.nextPageToken, maxLimit);
            } else {
                 console.log(`Đã đạt giới hạn ${maxLimit} comment TRƯỚC KHI gọi trang tiếp theo, dừng.`);
            }
        }
    }

    // ĐÃ SỬA LỖI: Nhận maxLimit
    function collectThreads(items, maxLimit) {
        items.forEach(item => {
            // Kiểm tra giới hạn TRƯỚC KHI THÊM
            if (allThreads.length >= maxLimit) return;

            const top = item.snippet.topLevelComment?.snippet || {};
            const likeCount = Number(top.likeCount || 0);
            const totalReplies = Number(item.snippet.totalReplyCount || 0);
            const publishedAtISO = top.publishedAt || null;
            const publishedDate = publishedAtISO ? new Date(publishedAtISO) : null;
            
            const threadObj = {
                raw: item,
                likeCount, totalReplies,
                publishedAtISO, publishedDate
            };
            allThreads.push(threadObj);
        });
    }

    // ===== Render (ĐÃ CẬP NHẬT VỚI LOGIC LỌC) =====
    function renderThreads() {
        let arr = [...allThreads]; // Bắt đầu với tất cả

        // --- BƯỚC 1: LỌC ---
        if (timeFilter !== 'all') {
            const now = new Date();
            // Đặt giờ về 00:00:00 để so sánh ngày
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            
            const last30 = new Date(today);
            last30.setDate(today.getDate() - 30);
            
            const last90 = new Date(today);
            last90.setDate(today.getDate() - 90);

            arr = arr.filter(t => {
                if (!t.publishedDate) return false; // Loại bỏ nếu không có ngày
                
                switch (timeFilter) {
                    case 'today':
                        return t.publishedDate >= today;
                    case 'yesterday':
                        return t.publishedDate >= yesterday && t.publishedDate < today;
                    case '30days':
                        return t.publishedDate >= last30;
                    case '90days':
                        return t.publishedDate >= last90;
                    default:
                        // Mặc định là lọc theo NĂM (vd: '2024')
                        if (!isNaN(parseInt(timeFilter))) {
                            return t.publishedDate.getFullYear() == timeFilter;
                        }
                        return true;
                }
            });
        }

        // --- BƯỚC 2: SẮP XẾP (Dùng mảng đã lọc) ---
        arr.sort((a, b) => {
            let va, vb;
            if (sortKey === 'like') { va = a.likeCount; vb = b.likeCount; } 
            else if (sortKey === 'replies') { va = a.totalReplies; vb = b.totalReplies; } 
            else {
                va = a.publishedDate ? a.publishedDate.getTime() : 0;
                vb = b.publishedDate ? b.publishedDate.getTime() : 0;
            }
            return (sortDir === 'desc') ? (vb - va) : (va - vb);
        });

        // --- BƯỚC 3: RENDER (Dùng mảng đã lọc và sắp xếp) ---
        resultsDiv.innerHTML = ''; // Xóa kết quả cũ
        if (arr.length === 0) {
            resultsDiv.innerHTML = '<p class="text-center text-gray-500 my-4">Không tìm thấy bình luận nào khớp với bộ lọc.</p>';
        } else {
            for (const obj of arr) {
                resultsDiv.appendChild(createThreadDOM(obj));
            }
        }
        
        // Cập nhật status
        let totalFetched = allThreads.length;
        // ĐÃ SỬA LỖI: Dùng hằng số MAX_COMMENTS
        const currentMaxLimit = MAX_COMMENTS; 
        
        let statusText = `Hiển thị ${arr.length} / ${totalFetched} luồng bình luận.`;
        if (totalFetched >= currentMaxLimit) {
             statusText = `Hiển thị ${arr.length} / ${totalFetched} bình luận (đã đạt giới hạn ${currentMaxLimit}).`;
        }
        statusDiv.textContent = statusText;
    }

    // ===== DOM builders (Đã sửa lỗi hiển thị ngày giờ) =====
    function createThreadDOM(threadObj) {
        const { raw, likeCount, totalReplies, publishedAtISO, publishedDate } = threadObj;
        const top = raw.snippet.topLevelComment.snippet;

        const threadDiv = document.createElement('div'); threadDiv.className = 'comment-thread';
        const rowDiv = document.createElement('div'); rowDiv.className = 'thread-row';

        // Trái: 1 cột (Nguyên bản)
        const colOriginal = document.createElement('div'); colOriginal.className = 'left-col';
        colOriginal.innerHTML = `<h3>Nguyên bản</h3>`;
        colOriginal.appendChild(createCommentElement(top, false, null)); 
        if (raw.replies) {
            const rep = document.createElement('div'); rep.className = 'replies-container';
            raw.replies.comments.forEach(r => rep.appendChild(createCommentElement(r.snippet, true, null)) );
            colOriginal.appendChild(rep);
        }

        // Phải: 3 chỉ số
        const rightDiv = document.createElement('div'); rightDiv.className = 'thread-right';
        const metrics = document.createElement('div'); metrics.className = 'metrics-grid';

        const likeBox = document.createElement('div'); likeBox.className = 'metric';
        likeBox.innerHTML = `<div class="metric-label">Like (cấp 1)</div><div class="metric-value">${likeCount.toLocaleString('vi-VN')}</div>`;
        const replyBox = document.createElement('div'); replyBox.className = 'metric';
        replyBox.innerHTML = `<div class="metric-label">Cmt cấp 2</div><div class="metric-value">${totalReplies.toLocaleString('vi-VN')}</div>`;
        const dateBox = document.createElement('div'); dateBox.className = 'metric';
        
        let dateText = '—';
        if (publishedDate) {
            // Định dạng Giờ:Phút
            const time = publishedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            // Định dạng Ngày/Tháng/Năm
            const date = publishedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            // Gộp lại với thẻ <br>
            dateText = `${time}<br><span style="font-size: 13px; font-weight: 500;">${date}</span>`;
        }
        
        dateBox.innerHTML = `<div class="metric-label">Ngày</div><div class="metric-value" title="${publishedAtISO || ''}">${dateText}</div>`;

        metrics.appendChild(likeBox); metrics.appendChild(replyBox); metrics.appendChild(dateBox);
        rightDiv.appendChild(metrics); // Sửa lỗi hiển thị metrics
        
        rowDiv.appendChild(colOriginal);
        rowDiv.appendChild(rightDiv); // Sửa lỗi 'S is not defined'
        
        threadDiv.appendChild(rowDiv);
        return threadDiv;
    }

    function createCommentElement(snippet, isReply = false) { 
        const wrap = document.createElement('div'); wrap.className = isReply ? 'comment reply' : 'comment';
        const avatar = document.createElement('img');
        avatar.className = 'comment-author-img'; 
        avatar.src = snippet.authorProfileImageUrl; 
        avatar.alt = 'Avatar';
        avatar.onerror = () => { avatar.src = 'https://placehold.co/40x40/eee/ccc?text=?'; }; 
        
        const content = document.createElement('div'); content.className = 'comment-content';
        const author = document.createElement('div'); author.className = 'comment-author';
        author.textContent = snippet.authorDisplayName || '(Không rõ)';
        
        const text = document.createElement('div');
        text.style.whiteSpace = 'pre-wrap'; 
        text.style.wordBreak = 'break-word'; 
        
        text.innerHTML = snippet.textDisplay || snippet.textOriginal; 

        content.appendChild(author); content.appendChild(text);
        wrap.appendChild(avatar); wrap.appendChild(content);
        return wrap;
    }

} // Kết thúc initCommentsTool()

