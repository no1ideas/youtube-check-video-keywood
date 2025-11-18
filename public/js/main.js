// File: public/js/main.js (ĐÃ SỬA LỖI CÚ PHÁP HOÀN TOÀN)

// KHÔNG CÓ IMPORT Ở ĐÂY NỮA

// ==================================================================
// === SCRIPT CHÍNH (main.js) ===
// === Điều khiển chuyển trang và khởi động các công cụ ===
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');
    
    /**
     * Hàm ẩn tất cả các trang và hiển thị trang được yêu cầu
     */
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add('active');
            window.scrollTo(0, 0); 
        } else {
            console.error(`Không tìm thấy trang với ID: ${pageId}`);
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

    // Gán sự kiện cho các link trên Header (và Footer)
    document.querySelectorAll('.header-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;

            if (pageId === 'page-contact') {
                if (typeof window.showContactModal === 'function') {
                    window.showContactModal();
                } else {
                    console.error('Không tìm thấy hàm showContactModal()');
                }
            } else if (pageId) {
                showPage(pageId);
            }
        });
    });
    
    // --- KHỞI CHẠY CÁC SCRIPT CHO TỪNG CÔNG CỤ ---
    
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

    if (typeof initContactForm === 'function') {
        initContactForm();
    } else {
        console.error('Không tìm thấy hàm initContactForm()');
    }
});

// ==================================================================
// === SCRIPT CHO FORM LIÊN HỆ ===
// ==================================================================
function initContactForm() {
    // Modal elements
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.getElementById('contact-modal-close-btn');
    
    // Form elements
    const submitButton = document.getElementById('contact-submit-button');
    const emailInput = document.getElementById('contact-email');
    const subjectInput = document.getElementById('contact-subject');
    const messageInput = document.getElementById('contact-message');
    const statusEl = document.getElementById('contact-status');
    
    // Bộ đếm ký tự
    const charCounter = document.getElementById('char-counter');

    if (!contactModal || !submitButton) return;

    // --- Logic Mở/Đóng Modal ---
    const showModal = () => {
        contactModal.classList.remove('hidden');
    };

    const hideModal = () => {
        contactModal.classList.add('hidden');
        statusEl.classList.add('hidden');
        statusEl.className = 'text-center mt-4';
    };

    window.showContactModal = showModal;

    closeModalBtn.addEventListener('click', hideModal);
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            hideModal();
        }
    });

    // Gán sự kiện cho bộ đếm ký tự
    if (messageInput && charCounter) { /* ... */ }

    // --- Logic Gửi Form (Sửa setLoading) ---
    submitButton.addEventListener('click', async () => {
        if (!emailInput.value || !messageInput.value) { /* ... */ return; }

        // SỬ DỤNG window.setLoading
        if (typeof window.setLoading === 'function') {
            window.setLoading(submitButton, true, 'Đang gửi...');
        }
        statusEl.classList.add('hidden');

        try {
            // ... (Logic fetch giữ nguyên)
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput.value,
                    subject: subjectInput.value,
                    message: messageInput.value
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Có lỗi xảy ra, vui lòng thử lại.');
            }

            // ... (Logic thành công giữ nguyên)
            statusEl.textContent = result.message || 'Cảm ơn! Phản hồi của bạn đã được gửi.';
            statusEl.className = 'text-center mt-4 text-green-600';
            statusEl.classList.remove('hidden');
            
            emailInput.value = '';
            messageInput.value = '';
            subjectInput.value = 'Góp ý tính năng'; 
            if (charCounter) { /* ... */ }

            setTimeout(() => { hideModal(); }, 2000);

        } catch (error) {
            // ... (Logic lỗi giữ nguyên)
            statusEl.textContent = error.message;
            statusEl.className = 'text-center mt-4 text-red-600';
            statusEl.classList.remove('hidden');
        } finally {
            // SỬ DỤNG window.setLoading
            if (typeof window.setLoading === 'function') {
                window.setLoading(submitButton, false, 'Gửi phản hồi');
            }
        }
    });
}