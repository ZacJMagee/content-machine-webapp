import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Initialize fal client with API key from environment
const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
    console.error("FAL_KEY environment variable is not set.");
    throw new Error('FAL_KEY environment variable is not set');
} else if (typeof FAL_KEY !== 'string' || FAL_KEY.trim() === '') {
    console.error('FAL_KEY environment variable is invalid');
    throw new Error('FAL_KEY environment variable is invalid');
} else {
    console.log("FAL_KEY environment variable loaded successfully");
}

// Configure the FAL client with our API key
fal.config({
    credentials: FAL_KEY
});

// Define the structure of the queue response for type safety
interface QueueResponse {
    request_id: string;
}

interface GenerationInput {
  prompt: string;
  image_size?: 'landscape_4_3' | 'square' | 'portrait_3_4';
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  enable_safety_checker?: boolean;
  output_format?: 'jpeg' | 'png' | 'webp';
}


export async function POST(request: Request): Promise<NextResponse> {
  try {
        let generationInput: GenerationInput;
        try {
            generationInput = await request.json() as GenerationInput;
        } catch (jsonError) {
            console.error('JSON Parsing Error:', jsonError);
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        if (!generationInput.prompt || typeof generationInput.prompt !== 'string' || generationInput.prompt.trim() === '') {
            return NextResponse.json(
                { error: 'Prompt is required and must be a non-empty string' },
                { status: 400 }
            );
        }

        const normalizedInput: any = {
            ...generationInput,
            image_size: generationInput.image_size || 'landscape_4_3',
            num_inference_steps: generationInput.num_inference_steps ?? 28,
            guidance_scale: generationInput.guidance_scale ?? 3.5,
            num_images: generationInput.num_images ?? 1,
            enable_safety_checker: generationInput.enable_safety_checker ?? true,
            output_format: generationInput.output_format || 'jpeg'
        };

        console.log("Normalized Input:", normalizedInput);

        const maxRetries = 3;
        let retryCount = 0;
        let queueResponse;

        while (retryCount < maxRetries) {
            try {
                queueResponse = await fal.queue.submit(
                    "fal-ai/flux-lora",
                    {
                        input: normalizedInput
                    }
                );
                break; // If successful, break the retry loop
            } catch (apiError: any) {
                console.error(`FAL.ai API error on retry ${retryCount + 1}:`, apiError);
                retryCount++;
                if (retryCount === maxRetries) {
                    console.error('Full API Error object:', apiError);
                    // If max retries reached, re-throw the error
                    let errorMessage = 'Failed to submit generation request to FAL.ai';
                    if (apiError instanceof Error) {
                        errorMessage = apiError.message;
                    } else if (apiError?.response?.data?.detail) {
                        errorMessage = apiError.response.data.detail;
                    } else if (apiError?.response?.data?.message) {
                        errorMessage = apiError.response.data.message;
                    }
                    return NextResponse.json(
                        { error: errorMessage },
                        { status: 502 }
                    );
                }

                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            }
        }

        const { request_id } = queueResponse as { request_id: string };
        if (!request_id || typeof request_id !== 'string' || request_id.trim() === '') {
            console.error('Invalid request ID received from FAL.ai:', queueResponse);
            throw new Error('Invalid or missing request ID from FAL.ai');
        }

        const response: QueueResponse = { request_id };
        return NextResponse.json(response);

  } catch (error) {
        console.error('Unexpected Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        const statusCode = error instanceof SyntaxError ? 400 : 500;
        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}
