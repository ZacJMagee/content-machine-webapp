// app/api/generate-video/route.ts
import { NextResponse } from 'next/server';

// Handle GET requests for video downloads
export async function GET(req: Request) {
    try {
        // Get file ID from query params
        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json(
                { error: 'File ID is required' },
                { status: 400 }
            );
        }

        // Construct the video URL with all necessary parameters
        const baseUrl = 'https://public-cdn-video-data-algeng.oss-cn-wulanchabu.aliyuncs.com/inference_output/video/2025-01-25';
        const videoUrl = `${baseUrl}/${fileId}/output.mp4`;
        
        // Add the query parameters from the original URL
        const queryParams = new URLSearchParams({
            Expires: '1737848589',
            OSSAccessKeyId: 'LTAI5tAmwsjSaaZVA6cEFAUu',
            Signature: 'gUETVtn2i1EKHZ2kFSMfJ5FnaKQ='
        });

        const fullUrl = `${videoUrl}?${queryParams.toString()}`;
        
        console.log('Fetching video from:', fullUrl);
        
        // Fetch the video
        const videoResponse = await fetch(fullUrl);

        if (!videoResponse.ok) {
            console.error('Failed to fetch video:', {
                status: videoResponse.status,
                statusText: videoResponse.statusText
            });
            return NextResponse.json(
                { error: `Failed to fetch video: ${videoResponse.statusText}` },
                { status: videoResponse.status }
            );
        }

        // Get video data and content type
        const videoData = await videoResponse.arrayBuffer();
        const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `test-video-${timestamp}.mp4`;

        // Return video data with appropriate headers
        return new NextResponse(videoData, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Video download error:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Failed to download video',
                details: error
            },
            { status: 500 }
        );
    }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
