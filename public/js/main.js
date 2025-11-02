
// SCRIPT CHUNG: QUẢN LÝ CHUYỂN TRANG
document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add('active');
            window.scrollTo(0, 0); // Cuộn lên đầu trang
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
    // (Các hàm này được định nghĩa trong các tệp JS riêng)
    try {
        initKeywordsTool();
    } catch (e) {
        console.error("Lỗi khởi chạy Công Cụ Từ Khoá:", e);
    }
    
    try {
        initCommentsTool();
    } catch (e) {
        console.error("Lỗi khởi chạy Công Cụ Comment:", e);
    }
});
