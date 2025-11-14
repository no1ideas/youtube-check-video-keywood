// File: /api/contact.js
import { Resend } from 'resend';

// Khởi tạo Resend với API Key đã lưu trong Vercel
const resend = new Resend(process.env.RESEND_API_KEY);

// Hàm xử lý chính
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 'email' ở đây là email của NGƯỜI DÙNG (ví dụ: tranmaily.2312@gmail.com)
        const { email, subject, message } = request.body;

        if (!email || !subject || !message) {
            return response.status(400).json({ message: 'Vui lòng nhập đủ thông tin.' });
        }
        
        // [QUAN TRỌNG] Gửi từ tên miền phụ đã xác minh
        const fromAddress = 'ChannelPulse Form <form@form.channelpulse.me>';
        
        // [QUAN TRỌNG] Gửi đến hòm thư Zoho của bạn
        const adminInbox = 'contact@channelpulse.me'; 

        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: adminInbox,
            subject: `Phản hồi mới từ ChannelPulse: [${subject}]`,
            html: `
                <p>Bạn nhận được một phản hồi mới từ <strong>${email}</strong>.</p>
                <p><strong>Chủ đề:</strong> ${subject}</p>
                <hr>
                <p><strong>Nội dung:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
            reply_to: email 
        });

        if (error) {
            console.error('Lỗi Resend:', error);
            return response.status(400).json({ message: 'Lỗi khi gửi email.', error: error.message });
        }

        return response.status(200).json({ message: 'Cảm ơn! Phản hồi của bạn đã được gửi.' });

    } catch (error) {
        console.error('Lỗi máy chủ:', error);
        return response.status(500).json({ message: 'Lỗi máy chủ nội bộ.', error: error.message });
    }
}