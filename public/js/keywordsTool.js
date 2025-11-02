// ==================================================================
// === SCRIPT CHO CÔNG CỤ TỪ KHÓA (Keywords Tool) ===
// ==================================================================
function initKeywordsTool() {
    const videoInputsContainer = document.getElementById('keywords-video-inputs');
    const searchButton = document.getElementById('keywords-search-button');
    const generateKeywordsButton = document.getElementById('keywords-generate-button');
    const keywordResultsContainer = document.getElementById('keywords-results-container');

    // Kiểm tra xem các element có tồn tại không (nếu người dùng ở trang comment)
    if (!videoInputsContainer) return;

    const NUM_INPUTS = 15;
    let videoDataStore = new Array(NUM_INPUTS).fill(null);

    // --- KHỞI TẠO GIAO DIỆN ---
    function createInputRows() {
        for (let i = 0; i < NUM_INPUTS; i++) {
            const row = document.createElement('div');
            row.className = 'flex items-center space-x-2 relative';
            row.innerHTML = `
                <span class="font-semibold text-gray-500 w-6 text-right">${i + 1}.</span>
                <input type="text" data-index="${i}" class="video-url-input flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dán link YouTube...">
                <button data-index="${i}" class="info-btn w-28 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition duration-300 hover:bg-gray-400">
                    Thông tin
                </button>
                <!-- Popover -->
                <div class="popover bg-white border border-gray-300 rounded-lg shadow-xl p-4 right-0 top-10">
                    <p class="popover-placeholder text-gray-600">Chưa có dữ liệu. Vui lòng nhấn "Tìm kiếm".</p>
                    <div class="popover-content hidden space-y-3">
                        <!-- Tiêu đề -->
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <h4 class="font-bold text-base text-gray-900 popover-title flex-1 break-words"></h4>
                                <button class="popover-copy-btn" data-type="title">Copy</button>
                            </div>
                        </div>
                        <!-- Mô tả -->
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <h5 class="text-sm font-semibold text-gray-800">Mô tả:</h5>
                                <button class="popover-copy-btn" data-type="desc">Copy</button>
                            </div>
                            <p class="text-sm text-gray-700 popover-description">
                                <span class="desc-short"></span>
                                <span class="desc-full"></span>
                                <button class="toggle-desc hidden">Xem thêm</button>
                            </p>
                        </div>
                        <!-- Từ khóa -->
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <h5 class="text-sm font-semibold text-gray-800">Từ khoá:</h5>
                                <button class="popover-copy-btn" data-type="tags">Copy</button>
                            </div>
                            <div class="flex flex-wrap gap-1 popover-tags"></div>
                        </div>
                        <!-- Hashtag -->
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <h5 class="text-sm font-semibold text-gray-800">Hashtags:</h5>
                                <button class="popover-copy-btn" data-type="hashtags">Copy</button>
                            </div>
                            <div class="flex flex-wrap gap-1 popover-hashtags"></div>
                        </div>
                    </div>
                </div>`;
            videoInputsContainer.appendChild(row);
        }
    }

    // --- LOGIC XỬ LÝ SỰ KIỆN ---
    if (searchButton) { // Chỉ gán sự kiện nếu nút tồn tại
        searchButton.addEventListener('click', async () => {
            setLoading(searchButton, true, "Đang tìm kiếm...");
            const inputs = document.querySelectorAll('#page-keywords .video-url-input'); // Chỉ tìm trong trang này
            const infoButtons = document.querySelectorAll('#page-keywords .info-btn');
            const popovers = document.querySelectorAll('#page-keywords .popover');
            
            videoDataStore = new Array(NUM_INPUTS).fill(null); // Reset
            let fetchPromises = [];

            infoButtons.forEach((button, index) => {
                updateInfoButton(button, null);
                updatePopover(popovers[index], null);
            });

            inputs.forEach((input, index) => {
                const url = input.value.trim();
                const videoId = getYoutubeId(url); // Dùng hàm từ utils.js
                const button = infoButtons[index];
                const popover = popovers[index];
                
                if (videoId) {
                    fetchPromises.push(
                        fetchYouTubeVideoInfo(videoId)
                            .then(data => {
                                videoDataStore[index] = data;
                                updatePopover(popover, data);
                                updateInfoButton(button, true);
                            })
                            .catch(error => {
                                console.error(`Lỗi khi fetch video ${videoId}:`, error);
                                const errorData = { error: 'Không thể tải dữ liệu' };
                                videoDataStore[index] = errorData;
                                updatePopover(popover, errorData);
                                updateInfoButton(button, false);
                            })
                    );
                } else if (url !== "") { 
                    const errorData = { error: 'Link không hợp lệ' };
                    videoDataStore[index] = errorData;
                    updatePopover(popover, errorData);
                    updateInfoButton(button, false);
                }
            });
            await Promise.allSettled(fetchPromises);
            setLoading(searchButton, false, "Tìm kiếm Thông Tin Video"); // Dùng hàm từ utils.js
        });
    }

    if (generateKeywordsButton) { // Chỉ gán sự kiện nếu nút tồn tại
        generateKeywordsButton.addEventListener('click', async () => {
            setLoading(generateKeywordsButton, true, "Đang tạo..."); // Dùng hàm từ utils.js
            keywordResultsContainer.innerHTML = '<div class="flex justify-center items-center p-10"><div class="loader"></div><span class="ml-3">Đang liên hệ với Gemini...</span></div>';

            let combinedText = "";
            videoDataStore.forEach(data => {
                if (data && !data.error) {
                    combinedText += `Tiêu đề: ${data.title}\n`;
                    combinedText += `Mô tả: ${data.description}\n`;
                    if (data.tags && data.tags.length > 0) {
                        combinedText += `Tags: ${data.tags.join(', ')}\n`;
                    }
                    combinedText += "---\n";
                }
            });

            if (combinedText.trim() === "") {
                keywordResultsContainer.innerHTML = '<p class="text-red-500 text-center">Không có dữ liệu video để phân tích. Vui lòng "Tìm kiếm" video trước.</p>';
                setLoading(generateKeywordsButton, false, "Tạo Bộ Từ Khoá Của Chủ Đề"); // Dùng hàm từ utils.js
                return;
            }

            try {
                const result = await callGeminiApi(combinedText);
                displayKeywordResults(result);
            } catch (error) {
                console.error("Lỗi khi gọi Gemini API:", error);
                keywordResultsContainer.innerHTML = `<p class="text-red-500 text-center"><strong>Đã xảy ra lỗi:</strong> ${error.message}</p>`;
            } finally {
                setLoading(generateKeywordsButton, false, "Tạo Bộ Từ Khoá Của Chủ Đề"); // Dùng hàm từ utils.js
            }
        });
    }

    // --- HÀM HỖ TRỢ (Keywords Tool) ---

    async function fetchYouTubeVideoInfo(videoId) {
        const response = await fetch('/api/youtube', { // Gọi backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: videoId })
        });
        if (!response.ok) {
            let errorMessage = `Lỗi máy chủ: ${response.status}`;
            try { const errorData = await response.json(); errorMessage = errorData.message || JSON.stringify(errorData); } 
            catch (e) { errorMessage = await response.text(); }
            throw new Error(errorMessage);
        }
        return response.json();
    }

    function updateInfoButton(buttonElement, isSuccess) {
        buttonElement.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400', 'bg-indigo-500', 'text-white', 'hover:bg-indigo-600', 'result-btn', 'bg-red-500', 'hover:bg-red-600');
        if (isSuccess === true) {
            buttonElement.textContent = 'Kết quả';
            buttonElement.classList.add('bg-indigo-500', 'text-white', 'hover:bg-indigo-600', 'result-btn');
        } else if (isSuccess === false) {
            buttonElement.textContent = 'Lỗi';
            buttonElement.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
        } else {
            buttonElement.textContent = 'Thông tin';
            buttonElement.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        }
    }

    function updatePopover(popoverElement, data) {
        const placeholder = popoverElement.querySelector('.popover-placeholder');
        const contentDiv = popoverElement.querySelector('.popover-content');

        if (data && !data.error) {
            placeholder.classList.add('hidden');
            contentDiv.classList.remove('hidden');

            const { title, description, tags } = data;
            const hashtagRegex = /#[\w\d_]+/g;
            const foundHashtags = description.match(hashtagRegex) || [];

            // 1. Tiêu đề
            contentDiv.querySelector('.popover-title').textContent = title;
            contentDiv.querySelector('[data-type="title"]').dataset.copyText = title;

            // 2. Mô tả
            const descP = contentDiv.querySelector('.popover-description');
            const descShort = descP.querySelector('.desc-short');
            const descFull = descP.querySelector('.desc-full');
            const toggleBtn = descP.querySelector('.toggle-desc');
            contentDiv.querySelector('[data-type="desc"]').dataset.copyText = description;

            if (description.length > 120) {
                descShort.textContent = description.substring(0, 120) + '...';
                descFull.textContent = description;
                toggleBtn.classList.remove('hidden');
                descFull.style.display = 'none';
                toggleBtn.textContent = 'Xem thêm';
                toggleBtn.onclick = () => {
                    const isHidden = descFull.style.display === 'none';
                    descFull.style.display = isHidden ? 'inline' : 'none';
                    toggleBtn.textContent = isHidden ? 'Thu gọn' : 'Xem thêm';
                };
            } else {
                descShort.textContent = description;
                descFull.textContent = '';
                toggleBtn.classList.add('hidden');
            }

            // 3. Từ khóa (Tags)
            const tagsContainer = contentDiv.querySelector('.popover-tags');
            tagsContainer.innerHTML = '';
            contentDiv.querySelector('[data-type="tags"]').dataset.copyText = tags.join(', ');
            if (tags && tags.length > 0) {
                tags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs';
                    tagEl.textContent = tag;
                    tagsContainer.appendChild(tagEl);
                });
            } else {
                tagsContainer.innerHTML = '<i class="text-gray-500 text-xs">Không có tags</i>';
            }

            // 4. Hashtags
            const hashtagsContainer = contentDiv.querySelector('.popover-hashtags');
            hashtagsContainer.innerHTML = '';
            contentDiv.querySelector('[data-type="hashtags"]').dataset.copyText = foundHashtags.join(' ');
            if (foundHashtags.length > 0) {
                foundHashtags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs';
                    tagEl.textContent = tag;
                    hashtagsContainer.appendChild(tagEl);
                });
            } else {
                hashtagsContainer.innerHTML = '<i class="text-gray-500 text-xs">Không có hashtags</i>';
            }
            
            // Gán sự kiện cho các nút copy mới
            contentDiv.querySelectorAll('.popover-copy-btn').forEach(btn => {
                btn.onclick = () => copyToClipboard(btn.dataset.copyText, btn, true); // Dùng hàm từ utils.js
            });

        } else {
            placeholder.classList.remove('hidden');
            contentDiv.classList.add('hidden');
            if (data && data.error) {
                placeholder.textContent = data.error;
                placeholder.classList.add('text-red-500');
            } else {
                placeholder.textContent = 'Chưa có dữ liệu. Vui lòng nhấn "Tìm kiếm".';
                placeholder.classList.remove('text-red-500');
            }
        }
    }

    async function callGeminiApi(promptText) {
        const response = await fetch('/api/gemini', { // Gọi backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText })
        });
        if (!response.ok) {
            let errorMessage = `Lỗi máy chủ: ${response.status}`;
            try { const errorData = await response.json(); errorMessage = errorData.message || JSON.stringify(errorData); } 
            catch (e) { errorMessage = await response.text(); }
            throw new Error(errorMessage);
        }
        return await response.json();
    }

    function displayKeywordResults(data) {
        keywordResultsContainer.innerHTML = ''; // Xóa

        const createSection = (title, content, copyText) => {
            const section = document.createElement('div');
            section.className = 'border border-gray-200 rounded-lg p-4 bg-gray-50';
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-3';
            const titleEl = document.createElement('h3');
            titleEl.className = 'text-lg font-semibold text-gray-800';
            titleEl.textContent = title;
            header.appendChild(titleEl);
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.textContent = 'Copy';
            copyButton.dataset.copyText = copyText || ''; 
            copyButton.addEventListener('click', () => copyToClipboard(copyButton.dataset.copyText, copyButton)); // Dùng hàm từ utils.js
            header.appendChild(copyButton);
            section.appendChild(header);

            if (Array.isArray(content) && content.length > 0) {
                const list = document.createElement('div');
                list.className = 'flex flex-wrap gap-2';
                content.forEach(item => {
                    const itemEl = document.createElement('span');
                    itemEl.className = 'bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full';
                    itemEl.textContent = item;
                    list.appendChild(itemEl);
                });
                section.appendChild(list);
            } else if (typeof content === 'string' && content) {
                const contentEl = document.createElement('p');
                contentEl.className = 'text-gray-700 whitespace-pre-wrap';
                contentEl.textContent = content;
                section.appendChild(contentEl);
            } else {
                 const contentEl = document.createElement('p');
                contentEl.className = 'text-gray-500 italic';
                contentEl.textContent = (content && content.length === 0) ? 'Không có' : 'N/A';
                section.appendChild(contentEl);
            }
            keywordResultsContainer.appendChild(section);
        };

        createSection('Bộ Từ Khoá Chính', data.boTuKhoaChinh, data.boTuKhoaChinh.join(', '));
        createSection('Từ Khoá Bổ Trợ', data.tuKhoaBoTro, data.tuKhoaBoTro.join(', '));
        createSection('Từ Khoá Liên Quan', data.tuKhoaLienQuan, data.tuKhoaLienQuan.join(', '));
        createSection('Từ Khoá Thương Hiệu', data.tuKhoaThuongHieu, data.tuKhoaThuongHieu.join(', '));
        createSection('Hashtags', data.hashtags, data.hashtags.join(' '));
        createSection('Tiêu Đề Chủ Đề (Danh sách phát)', data.tieuDeChuDe, data.tieuDeChuDe);
        createSection('Mô Tả Chủ Đề (Danh sách phát)', data.moTaChuDe, data.moTaChuDe);
    }

    // KHỞI ĐỘNG
    createInputRows();
}
