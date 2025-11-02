// ==================================================================
// === SCRIPT CHO CÔNG CỤ COMMENT (Comments Tool) ===
// ==================================================================
function initCommentsTool() {
    // ===== UI refs =====
    const searchButton = document.getElementById('comment-search-button');
    const videoUrlInput = document.getElementById('comment-video-url');
    const resultsDiv = document.getElementById('comment-results');
    const statusDiv = document.getElementById('comment-status');
    const sortBar = document.getElementById('comment-sort-bar');
    const btnSortLike = document.getElementById('sort-like');
    const btnSortReplies = document.getElementById('sort-replies');
    const btnSortDate = document.getElementById('sort-date');

    // Kiểm tra xem các element có tồn tại không
    if (!searchButton) return;
    
    // ===== State =====
    let allThreads = [];
    let sortKey = 'date'; // 'like' | 'replies' | 'date'
    let sortDir = 'desc'; // 'asc' | 'desc'

    // ===== Sort handlers =====
    function attachSortHandlers() {
        function activate(btn) { [btnSortLike, btnSortReplies, btnSortDate].forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
        function toggleDir(btn, label) { sortDir = (sortDir === 'desc') ? 'asc' : 'desc'; btn.textContent = `${label} ${sortDir === 'desc' ? '↓' : '↑'}`; }

        if (btnSortLike.hasAttribute('data-inited')) return; // Đã gán rồi

        btnSortLike.addEventListener('click', () => {
            if (sortKey !== 'like') { sortKey = 'like'; sortDir = 'desc'; btnSortLike.textContent = 'Like ↓'; } 
            else toggleDir(btnSortLike, 'Like');
            activate(btnSortLike); renderThreads();
        });
        btnSortReplies.addEventListener('click', () => {
            if (sortKey !== 'replies') { sortKey = 'replies'; sortDir = 'desc'; btnSortReplies.textContent = 'Cmt cấp 2 ↓'; } 
            else toggleDir(btnSortReplies, 'Cmt cấp 2');
            activate(btnSortReplies); renderThreads();
        });
        btnSortDate.addEventListener('click', () => {
            if (sortKey !== 'date') { sortKey = 'date'; sortDir = 'desc'; btnSortDate.textContent = 'Ngày ↓'; } 
            else toggleDir(btnSortDate, 'Ngày');
            activate(btnSortDate); renderThreads();
        });
        
        btnSortDate.classList.add('active'); // Kích hoạt mặc định
        btnSortLike.setAttribute('data-inited', '1');
    }

    // ===== Search flow =====
    if (searchButton) { // Chỉ gán sự kiện nếu nút tồn tại
        searchButton.addEventListener('click', async () => {
            const videoURL = videoUrlInput.value.trim();
            if (!videoURL) { alert('Vui lòng nhập link video YouTube.'); return; }
            const videoId = getYoutubeId(videoURL); // Dùng hàm từ utils.js
            if (!videoId) { alert('Link video không hợp lệ. Vui lòng kiểm tra lại.'); return; }

            // Reset
            setLoading(searchButton, true, ""); // Dùng hàm từ utils.js, text rỗng cho loader
            resultsDiv.innerHTML = ''; statusDiv.textContent = 'Đang lấy dữ liệu, vui lòng chờ...';
            allThreads = [];
            sortBar.style.display = 'none';

            try {
                // 1. Lấy tất cả bình luận
                await fetchAllComments(videoId);
                
                if (allThreads.length === 0) {
                    statusDiv.textContent = 'Không tìm thấy bình luận nào hoặc video đã tắt bình luận.';
                    setLoading(searchButton, false, "Tìm kiếm"); // Dùng hàm từ utils.js
                    return;
                }
                
                // 2. Hiển thị
                statusDiv.textContent = `Đã tải xong ${allThreads.length} luồng bình luận!`;
                attachSortHandlers();
                sortBar.style.display = 'flex';
                renderThreads(); // Render lần đầu (không cần dịch)
                
            } catch (e) {
                console.error('Lỗi:', e);
                statusDiv.textContent = `Đã xảy ra lỗi: ${e.message}`;
            } finally {
                setLoading(searchButton, false, "Tìm kiếm"); // Dùng hàm từ utils.js
            }
        });
    }

    // ===== Fetch comments (paginate) =====
    async function fetchAllComments(videoId, pageToken = '') {
        statusDiv.textContent = `Đang tải bình luận... (đã tải ${allThreads.length} luồng)`;
        
        // Gọi backend /api/youtube-comments
        const response = await fetch('/api/youtube-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: videoId, pageToken: pageToken })
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
        
        if (data.items) {
            collectThreads(data.items);
        }
        
        // Đệ quy nếu có trang tiếp theo
        if (data.nextPageToken) {
            await fetchAllComments(videoId, data.nextPageToken);
        }
    }

    function collectThreads(items) {
        items.forEach(item => {
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

    // ===== Render (chỉ sắp xếp và hiển thị) =====
    function renderThreads() {
        // Sắp xếp
        const arr = [...allThreads];
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

        // Render
        resultsDiv.innerHTML = ''; // Xóa kết quả cũ
        for (const obj of arr) {
            resultsDiv.appendChild(createThreadDOM(obj));
        }
    }

    // ===== DOM builders (ĐÃ XÓA CỘT DỊCH) =====
    function createThreadDOM(threadObj) {
        const { raw, likeCount, totalReplies, publishedAtISO, publishedDate } = threadObj;
        const top = raw.snippet.topLevelComment.snippet;

        const threadDiv = document.createElement('div'); threadDiv.className = 'comment-thread';
        const rowDiv = document.createElement('div'); rowDiv.className = 'thread-row';

        // Trái: 1 cột (Nguyên bản)
        const colOriginal = document.createElement('div'); colOriginal.className = 'left-col';
        colOriginal.innerHTML = `<h3>Nguyên bản</h3>`;
        colOriginal.appendChild(createCommentElement(top, false, null)); // textDisplay gốc
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
        
        // ĐỊNH DẠNG LẠI NGÀY GIỜ CHO ĐẸP
        let dateText = '—';
        if (publishedDate) {
            const time = publishedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const date = publishedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            // Hiển thị Giờ ở trên, Ngày ở dưới
            dateText = `${time}<br><span style="font-size: 13px; font-weight: 500;">${date}</span>`;
        }
        
        dateBox.innerHTML = `<div class="metric-label">Ngày</div><div class="metric-value" title="${publishedAtISO || ''}">${dateText}</div>`;

        metrics.appendChild(likeBox); metrics.appendChild(replyBox); metrics.appendChild(dateBox);
        
        // DÒNG SỬA LỖI ĐÃ THIẾU
        rightDiv.appendChild(metrics); 

        rowDiv.appendChild(colOriginal);
        // DÒNG SỬA LỖI TỪ "S is not defined"
        rowDiv.appendChild(rightDiv);
        
        threadDiv.appendChild(rowDiv);
        return threadDiv;
    }

    function createCommentElement(snippet, isReply = false) { // Đã xóa overrideText
        const wrap = document.createElement('div'); wrap.className = isReply ? 'comment reply' : 'comment';
        const avatar = document.createElement('img');
        avatar.className = 'comment-author-img'; 
        avatar.src = snippet.authorProfileImageUrl; 
        avatar.alt = 'Avatar';
        avatar.onerror = () => { avatar.src = 'https://placehold.co/40x40/eee/ccc?text=?'; }; // Ảnh placeholder nếu lỗi
        
        const content = document.createElement('div'); content.className = 'comment-content';
        const author = document.createElement('div'); author.className = 'comment-author';
        author.textContent = snippet.authorDisplayName || '(Không rõ)';
        
        const text = document.createElement('div');
        text.style.whiteSpace = 'pre-wrap'; // Giữ xuống dòng
        text.style.wordBreak = 'break-word'; // Ngắt từ
        
        // Luôn hiển thị HTML gốc
        text.innerHTML = snippet.textDisplay || snippet.textOriginal; 

        content.appendChild(author); content.appendChild(text);
        wrap.appendChild(avatar); wrap.appendChild(content);
        return wrap;
    }
} // Kết thúc initCommentsTool()
