import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const region = searchParams.get('region');

    if (!uid || !region) {
        return NextResponse.json({ error: "Missing UID or Region" }, { status: 400 });
    }

    try {
        // The Vercel Server makes the request to Heroku, completely bypassing Browser CORS
        const res = await fetch(`https://floating-savannah-82139-2308889ea31f.herokuapp.com/api/info?uid=${uid}&region=${region}`);
        
        // Safety check: Did Heroku return an HTML error page (like a 503 sleeping app)?
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            return NextResponse.json({ error: "Heroku API is waking up or offline. Please try again in 10 seconds." }, { status: 503 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Heroku Proxy Error:", error);
        return NextResponse.json({ error: "Failed to establish secure link to Heroku API." }, { status: 500 });
    }
}
