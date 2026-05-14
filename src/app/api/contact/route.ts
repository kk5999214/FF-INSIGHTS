import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        // ==========================================
        // PAYLOAD 1: SEND TO YOUR PERSONAL GMAIL
        // ==========================================
        const adminResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY as string
            },
            body: JSON.stringify({
                sender: { email: 'support@bittu.me', name: 'FF INSIGHTS SYSTEM' },
                to: [{ email: 'snehasiskhan2000@gmail.com', name: 'Bittu Dev' }], 
                replyTo: { email: email, name: name }, // You can hit "Reply" to email the user directly
                subject: `New Transmission from ${name.toUpperCase()} via FF INSIGHTS`,
                htmlContent: `
                    <div style="font-family: sans-serif; padding: 20px; background-color: #050505; color: #ffffff; border-radius: 10px; border: 1px solid #333;">
                        <h2 style="color: #22d3ee; margin-top: 0;">New Neural Link Established 📡</h2>
                        <hr style="border-color: #333;" />
                        <p><strong>Designation:</strong> ${name}</p>
                        <p><strong>Secure Channel:</strong> ${email}</p>
                        <p><strong>Decrypted Message:</strong></p>
                        <div style="background-color: #111; padding: 15px; border-radius: 5px; border-left: 4px solid #8b5cf6;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">Transmission verified via FF INSIGHTS Engine.</p>
                    </div>
                `
            })
        });

        if (!adminResponse.ok) {
            throw new Error('Admin transmission failed');
        }

        // ==========================================
        // PAYLOAD 2: AUTO-RESPONDER TO THE USER
        // ==========================================
        const userResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY as string
            },
            body: JSON.stringify({
                sender: { email: 'support@bittu.me', name: 'FF INSIGHTS SUPPORT' },
                to: [{ email: email, name: name }], // Sends back to the user who filled the form
                subject: `Request Received - FF INSIGHTS`,
                htmlContent: `
                    <div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; padding: 30px;">
                        <h2 style="color: #000; margin-top: 0;">Request Received</h2>
                        <p>Dear ${name},</p>
                        <p>Thank you for contacting us.</p>
                        <p>We have received your message and appreciate you reaching out to us. Our team will review your inquiry and respond as soon as possible, usually within 24–48 hours.</p>
                        <p>Thank you for your patience and understanding.</p>
                        <br>
                        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="margin-bottom: 5px;">Best regards,</p>
                        <p style="margin-top: 0;"><strong>BITTU DEV</strong><br>
                        <span style="color: #666; font-size: 14px;">FF INSIGHTS</span></p>
                    </div>
                `
            })
        });

        if (!userResponse.ok) {
            console.error('Auto-responder failed to send to user');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transmission Error:", error);
        return NextResponse.json({ success: false, error: 'Transmission Failed' }, { status: 500 });
    }
}
