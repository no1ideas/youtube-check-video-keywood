// --- CÁC HÀM DÙNG CHUNG CHO CẢ 2 CÔNG CỤ ---

/**
 * Trích xuất Video ID từ URL YouTube
 * @param {string} url - URL YouTube
 * @returns {string|null} Video ID hoặc null
 */
function getYoutubeId(url) {
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
function setLoading(button, isLoading, loadingText) {
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
        // Phục hồi nội dung gốc, nhưng cập nhật text
        // Cách này an toàn hơn là replace, vì nó giữ lại SVG
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
 * Hàm Copy to Clipboard (dùng execCommand cho an toàn)
 * @param {string} text - Văn bản cần copy
 * @param {HTMLButtonElement} buttonElement - Nút đã nhấn
 */
function copyToClipboard(text, buttonElement) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Ngăn cuộn trang
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
        console.error('Không thể copy:', err);
        buttonElement.textContent = 'Lỗi';
    }
    document.body.removeChild(textArea);
}
