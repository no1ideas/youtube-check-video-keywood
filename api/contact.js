// File: /api/contact.js
import { Resend } from 'resend';

// Khởi tạo Resend với API Key đã lưu trong Vercel
const resend = new Resend(process.env.RESEND_API_KEY);

// Hàm xử lý chính
export default async function handler(request, response) {
    // 1. Chỉ chấp nhận phương thức POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 2. Lấy dữ liệu từ form
        const { email, subject, message } = request.body;

        // 3. Gửi email bằng Resend
        const { data, error } = await resend.emails.send({
            // Giữ nguyên, Resend yêu cầu
            from: 'ChannelPulse Form <form@channelpulse.me>', 
            
            // [SỬA] Đổi thành email CÁ NHÂN của bạn (Admin)
            // Đây là nơi bạn sẽ nhận thông báo.
            to: 'contact.no1ideas@gmail.com', 
            
            subject: `Phản hồi mới từ ChannelPulse: [${subject}]`, 
            
            // ... (code html giữ nguyên) ...
            
            // Giữ nguyên: Đây là email của NGƯỜI DÙNG (đến từ form)
            reply_to: email 
        });

        // 4. Xử lý lỗi từ Resend
        if (error) {
            console.error('Lỗi Resend:', error);
            return response.status(400).json({ message: 'Lỗi khi gửi email.', error: error.message });
        }

        // 5. Gửi phản hồi thành công về cho frontend
        return response.status(200).json({ message: 'Cảm ơn! Phản hồi của bạn đã được gửi.' });

    } catch (error) {
        // Xử lý các lỗi máy chủ khác
        console.error('Lỗi máy chủ:', error);
        return response.status(500).json({ message: 'Lỗi máy chủ nội bộ.', error: error.message });
    }
}