// File: public/js/utils.js (KHÔI PHỤC CƠ CHẾ GLOBAL VÀ TỐI ƯU HÀM)

// --- HẰNG SỐ CHUNG CHO BIỂU ĐỒ VÀ PHÂN TÍCH ---

const CHART_COLORS = {
    blue: 'rgba(59, 130, 246, 0.7)',
    green: 'rgba(16, 185, 129, 0.7)',
    yellow: 'rgba(234, 179, 8, 0.7)',
    red: 'rgba(239, 68, 68, 0.7)',
};

const HOUR_LABELS = [
    '0h-2h', '2h-4h', '4h-6h', '6h-8h', 
    '8h-10h', '10h-12h', '12h-14h', '14h-16h', 
    '16h-18h', '18h-20h', '20h-22h', '22h-24h'
];

const WEEKDAY_NAMES = [
    'Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 
    'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'
];

const GAP_LABELS = [
    'Dưới 1 ngày', '1 ngày', '2 ngày', '3 ngày', 
    '4-6 ngày', '7-14 ngày', 'Trên 14 ngày'
];

window.CHART_COLORS = CHART_COLORS;
window.HOUR_LABELS = HOUR_LABELS;
window.WEEKDAY_NAMES = WEEKDAY_NAMES;
window.GAP_LABELS = GAP_LABELS;


// ====================================
// --- HÀM TIỆN ÍCH CŨ (Gắn vào window) ---
// ====================================

/**
 * Trích xuất Video ID từ URL YouTube
 */
window.getYoutubeId = function(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Cập nhật trạng thái loading cho nút
 */
window.setLoading = function(button, isLoading, loadingText) {
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
 * Hàm Copy to Clipboard (Sử dụng API Navigator.clipboard hiện đại)
 */
window.copyToClipboard = function(text, buttonElement) {
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
            copyToClipboardFallback(text, buttonElement);
        });
    } else {
        copyToClipboardFallback(text, buttonElement);
    }
}

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

/**
 * Tối ưu hóa việc tính toán khoảng cách ngày theo lịch
 */
window.calculateDayDifference = function(date1, date2) {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), d2.getDate());
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
}

/**
 * Hiển thị thông báo trạng thái
 */
window.showStatusMessage = function(element, message, type) {
    element.textContent = message;
    element.className = `status-message status-${type}`; 
    element.style.display = 'block';
}

/**
 * Ẩn thông báo trạng thái
 */
window.hideStatusMessage = function(element) {
    element.style.display = 'none';
    element.textContent = '';
}