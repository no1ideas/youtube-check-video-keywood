// ==================================================================
// === SCRIPT CHÍNH (main.js) ===
// === Điều khiển chuyển trang và khởi động các công cụ ===
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    
    /**
     * Hàm ẩn tất cả các trang và hiển thị trang được yêu cầu
     * @param {string} pageId - ID của trang cần hiển thị (ví dụ: 'page-hub', 'page-keywords')
     */
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add('active');
            window.scrollTo(0, 0); // Cuộn lên đầu trang
        } else {
            console.error(`Không tìm thấy trang với ID: ${pageId}`);
            // Mặc định quay về trang chủ nếu không tìm thấy
            document.getElementById('page-hub').classList.add('active');
        }
    }

    // Gán sự kiện cho các nút quay lại
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            showPage(button.dataset.page);
        });
    });

    // Gán sự kiện cho các card ở trang chủ
    document.querySelectorAll('.hub-card').forEach(card => {
        card.addEventListener('click', () => {
            showPage(card.dataset.page);
        });
    });
    
    // --- KHỞI CHẠY CÁC SCRIPT CHO TỪNG CÔNG CỤ ---
    // Kiểm tra xem các hàm init có tồn tại không trước khi gọi
    
    if (typeof initKeywordsTool === 'function') {
        initKeywordsTool();
    } else {
        console.error('Không tìm thấy hàm initKeywordsTool()');
    }
    
    if (typeof initCommentsTool === 'function') {
        initCommentsTool();
    } else {
        console.error('Không tìm thấy hàm initCommentsTool()');
    }

    if (typeof initChannelAnalyzer === 'function') {
        initChannelAnalyzer();
    } else {
        console.error('Không tìm thấy hàm initChannelAnalyzer()');
    }
});

