import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY as string
            },
            body: JSON.stringify({
                sender: { email: 'support@bittu.me', name: 'FF INSIGHTS SUPPORT' },
                to: [{ email: 'support@bittu.me', name: 'Bittu Dev' }], // Sends the email TO you
                replyTo: { email: email, name: name }, // Allows you to hit "Reply" directly to the user
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

        if (!response.ok) {
            throw new Error('Brevo API rejected the transmission');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transmission Error:", error);
        return NextResponse.json({ success: false, error: 'Transmission Failed' }, { status: 500 });
    }
}
