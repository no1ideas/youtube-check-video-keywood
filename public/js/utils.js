// File: public/js/utils.js (Đã cập nhật)

// ====================================
// --- HẰNG SỐ CHUNG CHO BIỂU ĐỒ VÀ PHÂN TÍCH ---
// ====================================

/**
 * Định nghĩa màu sắc cho các biểu đồ (dựa trên màu logo #3B82F6 và màu trạng thái)
 */
export const CHART_COLORS = {
    blue: 'rgba(59, 130, 246, 0.7)',  // Xanh lam (Blue-600)
    green: 'rgba(16, 185, 129, 0.7)', // Xanh lá cây (Emerald-500)
    yellow: 'rgba(234, 179, 8, 0.7)',  // Vàng (Yellow-500)
    red: 'rgba(239, 68, 68, 0.7)',    // Đỏ (Red-500)
};

/**
 * Nhãn cho biểu đồ Phân tích Giờ trong ngày.
 */
export const HOUR_LABELS = [
    '0h-2h', '2h-4h', '4h-6h', '6h-8h', 
    '8h-10h', '10h-12h', '12h-14h', '14h-16h', 
    '16h-18h', '18h-20h', '20h-22h', '22h-24h'
];

/**
 * Nhãn cho biểu đồ Phân tích Ngày trong tuần.
 */
export const WEEKDAY_NAMES = [
    'Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 
    'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'
];

/**
 * Nhãn cho biểu đồ Phân tích Nhịp độ (khoảng cách ngày).
 */
export const GAP_LABELS = [
    'Dưới 1 ngày', '1 ngày', '2 ngày', '3 ngày', 
    '4-6 ngày', '7-14 ngày', 'Trên 14 ngày'
];

// ====================================
// --- HÀM TIỆN ÍCH MỚI VÀ CŨ ---
// ====================================


/**
 * Tối ưu hóa việc tính toán khoảng cách ngày theo lịch (date-only comparison)
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {number} Số ngày chênh lệch (lịch) giữa hai ngày.
 */
export function calculateDayDifference(date1, date2) {
    // 1. Loại bỏ thông tin thời gian, chỉ giữ lại ngày tháng
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

    // 2. Tính toán chênh lệch theo millisecond
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    
    // 3. Chuyển đổi sang ngày
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays;
}

/**
 * Hiển thị thông báo trạng thái
 * @param {HTMLElement} element 
 * @param {string} message 
 * @param {string} type 'loading', 'success', 'error'
 */
export function showStatusMessage(element, message, type) {
    element.textContent = message;
    element.className = `status-message status-${type}`; // Giả định class đã được định nghĩa trong style.css
    element.style.display = 'block';
}

/**
 * Ẩn thông báo trạng thái
 * @param {HTMLElement} element 
 */
export function hideStatusMessage(element) {
    element.style.display = 'none';
    element.textContent = '';
}


/**
 * Trích xuất Video ID từ URL YouTube
 * @param {string} url - URL YouTube
 * @returns {string|null} Video ID hoặc null
 */
export function getYoutubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Cập nhật trạng thái loading cho nút
 * @param {HTMLButtonElement} button - Nút cần cập nhật
 * @param {boolean} isLoading - Trạng thái loading
 * @param {string} loadingText - Chữ hiển thị
 */
export function setLoading(button, isLoading, loadingText) {
    if (!button) return;

    if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML;
    }
    const originalContent = button.dataset.originalContent;

    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `
            <div class="loader"></div>
            <span>${loadingText}</span>
        `;
    } else {
        button.disabled = false;
        // Phục hồi nội dung gốc, nhưng cập nhật text (Giữ nguyên logic của bạn)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalContent;
        const span = tempDiv.querySelector('span');
        if (span) {
            span.textContent = loadingText;
        }
        button.innerHTML = tempDiv.innerHTML;
    }
}

/**
 * Hàm Copy to Clipboard (Tối ưu hóa: Dùng API Navigator.clipboard)
 * @param {string} text - Văn bản cần copy
 * @param {HTMLButtonElement} buttonElement - Nút đã nhấn
 */
export function copyToClipboard(text, buttonElement) {
    // Tối ưu hóa: Sử dụng Navigator.clipboard API hiện đại
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Đã chép!';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 2000);
        }).catch(err => {
            console.error('Không thể copy bằng Navigator API:', err);
            // Quay lại phương thức cũ nếu cần (Fallback execCommand)
            copyToClipboardFallback(text, buttonElement);
        });
    } else {
        // Fallback cho trình duyệt cũ
        copyToClipboardFallback(text, buttonElement);
    }
}

/**
 * Fallback cho hàm Copy to Clipboard (execCommand)
 * @param {string} text - Văn bản cần copy
 * @param {HTMLButtonElement} buttonElement - Nút đã nhấn
 */
function copyToClipboardFallback(text, buttonElement) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; 
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Đã chép!';
        buttonElement.disabled = true;
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }, 2000);
    } catch (err) {
        console.error('Không thể copy bằng execCommand:', err);
        buttonElement.textContent = 'Lỗi';
    }
    document.body.removeChild(textArea);
}