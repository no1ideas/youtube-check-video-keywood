// File: public/js/main.js (Đã sửa lỗi trùng lặp)

// SỬ DỤNG IMPORT CHO CÁC HÀM TIỆN ÍCH
import { setLoading, getYoutubeId, copyToClipboard } from './utils.js';

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

    // Gán sự kiện cho các link trên Header (và Footer)
    document.querySelectorAll('.header-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Ngăn trình duyệt nhảy trang
            const pageId = link.dataset.page;

            if (pageId === 'page-contact') {
                // [NÂNG CẤP] Nếu là link "Liên hệ", gọi hàm mở Modal
                if (typeof window.showContactModal === 'function') {
                    window.showContactModal();
                } else {
                    console.error('Không tìm thấy hàm showContactModal()');
                }
            } else if (pageId) {
                // Giữ nguyên logic cũ cho các trang khác
                showPage(pageId);
            }
        });
    });
    
    // --- KHỞI CHẠY CÁC SCRIPT CHO TỪNG CÔNG CỤ ---
    
    // Khởi tạo các hàm từ các file khác (chúng sẽ được load trước main.js)
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

    if (!contactModal || !submitButton) return; // Thoát nếu không tìm thấy modal

    // --- Logic Mở/Đóng Modal ---
    const showModal = () => {
        contactModal.classList.remove('hidden');
    };

    const hideModal = () => {
        contactModal.classList.add('hidden');
        // Reset trạng thái form khi đóng
        statusEl.classList.add('hidden');
        statusEl.className = 'text-center mt-4';
    };

    // Đưa hàm showModal ra toàn cục để Header/Footer có thể gọi
    window.showContactModal = showModal;

    // Gán sự kiện đóng modal
    closeModalBtn.addEventListener('click', hideModal);
    contactModal.addEventListener('click', (e) => {
        // Chỉ đóng khi nhấn vào lớp phủ màu đen
        if (e.target === contactModal) {
            hideModal();
        }
    });

    // Gán sự kiện cho bộ đếm ký tự
    if (messageInput && charCounter) {
        messageInput.addEventListener('input', () => {
            const currentLength = messageInput.value.length;
            charCounter.textContent = `${currentLength}/3000`;
            
            if (currentLength >= 3000) {
                charCounter.classList.add('text-red-600', 'font-bold');
            } else {
                charCounter.classList.remove('text-red-600', 'font-bold');
            }
        });
    }

    // --- Logic Gửi Form ---
    submitButton.addEventListener('click', async () => {
        // 0. Validate (đơn giản)
        if (!emailInput.value || !messageInput.value) {
            statusEl.textContent = 'Vui lòng nhập email và nội dung tin nhắn.';
            statusEl.className = 'text-center mt-4 text-red-600';
            statusEl.classList.remove('hidden');
            return;
        }

        // 1. Hiển thị loading
        // SỬ DỤNG HÀM IMPORT
        setLoading(submitButton, true, 'Đang gửi...');
        statusEl.classList.add('hidden');

        try {
            // 2. Gửi dữ liệu đến API
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
                // 3. Hiển thị lỗi từ server
                throw new Error(result.message || 'Có lỗi xảy ra, vui lòng thử lại.');
            }

            // 4. Hiển thị thành công
            statusEl.textContent = result.message || 'Cảm ơn! Phản hồi của bạn đã được gửi.';
            statusEl.className = 'text-center mt-4 text-green-600';
            statusEl.classList.remove('hidden');
            
            // Xóa form VÀ reset bộ đếm
            emailInput.value = '';
            messageInput.value = '';
            subjectInput.value = 'Góp ý tính năng'; // Reset subject
            if (charCounter) {
                charCounter.textContent = '0/3000';
                charCounter.classList.remove('text-red-600', 'font-bold');
            }

            // Tự động đóng modal sau 2 giây
            setTimeout(() => {
                hideModal();
            }, 2000);

        } catch (error) {
            // 5. Hiển thị lỗi fetch hoặc lỗi server
            statusEl.textContent = error.message;
            statusEl.className = 'text-center mt-4 text-red-600';
            statusEl.classList.remove('hidden');
        } finally {
            // [TỐI ƯU FINALLY] Đảm bảo nút LOADING luôn được tắt
            // SỬ DỤNG HÀM IMPORT
            setLoading(submitButton, false, 'Gửi phản hồi');
        }
    });
}

// KHÔNG CÓ CÁC HÀM TIỆN ÍCH Ở ĐÂY NỮA
// KHÔNG CÓ getYoutubeId, setLoading, copyToClipboard