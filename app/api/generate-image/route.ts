// app/api/generate-image/route.ts
import Replicate from 'replicate';
import { NextResponse } from 'next/server';

// Initialize the Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    const { prompt, ...settings } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call Replicate API
    const output = await replicate.run(
      "zacjmagee/hazellora:3ef4fcf9b99f9aead7b341f010518a9f68383f9a24eea24dcabb2b29ac7b7da0",
      {
        input: {
          prompt,
          model: "dev",
          go_fast: settings.go_fast ?? false,
          lora_scale: 1,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: settings.aspect_ratio ?? "1:1",
          output_format: settings.output_format ?? "webp",
          guidance_scale: settings.guidance_scale ?? 3,
          output_quality: settings.output_quality ?? 80,
          prompt_strength: settings.prompt_strength ?? 0.8,
          extra_lora_scale: 1,
          num_inference_steps: 28
        }
      }
    );
    
    // Replicate returns an array of image URLs
    const imageUrl = Array.isArray(output) ? output[0] : output;

    return NextResponse.json({ success: true, output });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
