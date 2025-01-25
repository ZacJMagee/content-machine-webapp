// app/api/generate-video/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        // Get url from query params
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json(
                { error: 'Video URL is required' },
                { status: 400 }
            );
        }

        // Log request for debugging
        console.log('Processing video download:', {
            url,
            timestamp: new Date().toISOString()
        });

        // Fetch video directly
        const videoResponse = await fetch(url);

        if (!videoResponse.ok) {
            console.error('Video download failed:', {
                status: videoResponse.status,
                statusText: videoResponse.statusText,
                url
            });
            
            return NextResponse.json(
                { error: `Failed to fetch video: ${videoResponse.statusText}` },
                { status: videoResponse.status }
            );
        }

        // Get video data and content type
        const videoData = await videoResponse.arrayBuffer();
        const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

        // Return video data with appropriate headers
        return new NextResponse(videoData, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': 'attachment; filename="video.mp4"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Error processing video download:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
                details: error
            },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
