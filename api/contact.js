// File: /api/contact.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, subject, message } = request.body;

        if (!email || !subject || !message) {
            return response.status(400).json({ message: 'Vui lòng nhập đủ thông tin.' });
        }
        
        // Gửi từ địa chỉ đã được xác minh trên Resend
        const fromAddress = 'ChannelPulse Form <form@channelpulse.me>';
        
        // Gửi đến hòm thư Google Workspace (đã được kích hoạt MX)
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
            // Google Workspace sẽ tuân thủ 100% 'reply_to' này
            reply_to: email 
        });

        if (error) {
            return response.status(400).json({ message: 'Lỗi khi gửi email.', error: error.message });
        }

        return response.status(200).json({ message: 'Cảm ơn! Phản hồi của bạn đã được gửi.' });

    } catch (error) {
        return response.status(500).json({ message: 'Lỗi máy chủ nội bộ.', error: error.message });
    }
}