// app/api/generate-video/route.ts
import { NextResponse } from 'next/server';
import { VIDEO_REQUIREMENTS } from '@/constants/video-generation';
import { 
    VideoGenerationRequest,
    VideoGenerationResponse,
    VideoStatusResponse,
    VideoFileResponse 
} from '@/types/video-generation';

export async function POST(request: Request) {
    try {
        // Parse the incoming request body
        const body = await request.json();
        const { prompt, first_frame_image, prompt_optimizer } = body;

        // Input validation
        if (!prompt && !first_frame_image) {
            return NextResponse.json(
                { error: 'Either prompt or first_frame_image is required' },
                { status: 400 }
            );
        }

        // Validate prompt length if provided
        if (prompt && prompt.length > VIDEO_REQUIREMENTS.maxPromptLength) {
            return NextResponse.json(
                { error: `Prompt must be less than ${VIDEO_REQUIREMENTS.maxPromptLength} characters` },
                { status: 400 }
            );
        }

        // Step 1: Initiate video generation
        const generationResponse = await fetch('https://api.minimaxi.chat/v1/video_generation', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${process.env.MINIMAX_API_TOKEN}`
            },
            body: JSON.stringify({
                model: "video-01",
                prompt,
                prompt_optimizer,
                first_frame_image
            } as VideoGenerationRequest)
        });

        if (!generationResponse.ok) {
            const error = await generationResponse.json();
            return NextResponse.json(
                { error: error.base_resp?.status_msg || 'Failed to initiate video generation' },
                { status: generationResponse.status }
            );
        }

        const generationData: VideoGenerationResponse = await generationResponse.json();
        const taskId = generationData.task_id;

        // Step 2: Poll for completion (max 2 minutes)
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes with 2-second intervals
        let fileId: string | null = null;

        while (attempts < maxAttempts) {
            const statusResponse = await fetch(
                `https://api.minimaxi.chat/v1/query/video_generation?task_id=${taskId}`,
                {
                    headers: {
                        'authorization': `Bearer ${process.env.MINIMAX_API_TOKEN}`,
                        'content-type': 'application/json',
                    }
                }
            );

            if (!statusResponse.ok) {
                return NextResponse.json(
                    { error: 'Failed to check video status' },
                    { status: statusResponse.status }
                );
            }

            const status: VideoStatusResponse = await statusResponse.json();

            if (status.status === 'Success' && status.file_id) {
                fileId = status.file_id;
                break;
            }

            if (status.status === 'Failed') {
                return NextResponse.json(
                    { error: status.base_resp.status_msg || 'Video generation failed' },
                    { status: 400 }
                );
            }

            // Wait 2 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        }

        if (!fileId) {
            return NextResponse.json(
                { error: 'Video generation timed out' },
                { status: 408 }
            );
        }

        // Step 3: Get download URL
        const downloadResponse = await fetch(
            `https://api.minimaxi.chat/v1/files/retrieve?GroupId=${process.env.MINIMAX_GROUP_ID}&file_id=${fileId}`,
            {
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${process.env.MINIMAX_API_TOKEN}`
                }
            }
        );

        if (!downloadResponse.ok) {
            return NextResponse.json(
                { error: 'Failed to get video download URL' },
                { status: downloadResponse.status }
            );
        }

        const downloadData: VideoFileResponse = await downloadResponse.json();

        // Return success response with download URL
        return NextResponse.json({
            success: true,
            output: downloadData.download_url,
            taskId,
            fileId,
            filename: downloadData.filename
        });

    } catch (error) {
        console.error('Error in video generation:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
                success: false
            },
            { status: 500 }
        );
    }
}
