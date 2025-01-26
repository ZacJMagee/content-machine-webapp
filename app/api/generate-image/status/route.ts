// app/api/generate-image/status/route.ts

import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

// Define the complete set of possible status values
type QueueStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

// Define the structure of a log message
interface LogMessage {
  message: string;
}

// Define the complete queue status response structure
interface QueueStatusResponse {
  status: QueueStatus;
  logs?: LogMessage[];
  output?: any;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Type assertion to tell TypeScript about the response structure
    const status = await fal.queue.status("fal-ai/flux-lora", {
      requestId,
      logs: true
    }) as QueueStatusResponse;

    // Calculate progress based on queue status
    let progress = 0;
    switch (status.status) {
      case 'IN_QUEUE':
        progress = 10;
        break;
      case 'IN_PROGRESS':
        progress = 50;
        break;
      case 'COMPLETED':
        progress = 100;
        break;
      case 'FAILED':
        throw new Error('Generation failed');
    }

    // If completed, fetch the full result
    if (status.status === 'COMPLETED') {
      const result = await fal.queue.result("fal-ai/flux-lora", {
        requestId,
      });

      return NextResponse.json({
        status: 'completed',
        result: result.data,
      });
    }

    // Prepare the response with proper typing
    const responseBody: {
      status: string;
      progress: number;
      logs?: string[];
    } = {
      status: status.status.toLowerCase(),
      progress,
    };

    // Safely handle logs with proper type checking
    if (status.logs && status.logs.length > 0) {
      responseBody.logs = status.logs.map(log => log.message);
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Error checking generation status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check generation status' },
      { status: 500 }
    );
  }
}
