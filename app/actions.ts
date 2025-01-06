// app/actions.ts
"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Replicate from "replicate";
import { ImageSettings } from '@/constants/image-generation';

// Authentication Actions
export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// AI Generation Types and Actions
interface ImageGenerationParams {
  prompt: string;
  model?: string;
  goFast?: boolean;
  loraScale?: number;
  megapixels?: string;
  numOutputs?: number;
  aspectRatio?: string;
  outputFormat?: string;
  guidanceScale?: number;
  outputQuality?: number;
  promptStrength?: number;
  extraLoraScale?: number;
  numInferenceSteps?: number;
}

async function waitForPrediction(replicate: Replicate, prediction: any, maxAttempts = 60) {
  // We'll check every 2 seconds, up to maxAttempts times
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Checking prediction status (attempt ${attempt + 1})...`);

    // Get the current status of the prediction using the Replicate client
    const currentPrediction = await replicate.predictions.get(prediction.id);
    console.log(`Current status: ${currentPrediction.status}`);

    // If the prediction is completed, return it
    if (currentPrediction.status === 'succeeded') {
      return currentPrediction;
    }

    // If there was an error, throw it
    if (currentPrediction.status === 'failed') {
      throw new Error(`Prediction failed: ${currentPrediction.error}`);
    }

    // If we're still processing, wait for 2 seconds before checking again
    console.log('Still processing, waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Prediction timed out');
}

export async function generateImage(data: {
  prompt: string;
} & ImageSettings) {
  try {
    console.log('Starting image generation with data:', {
      prompt: data.prompt,
      settings: {
        go_fast: data.go_fast,
        aspect_ratio: data.aspect_ratio,
        output_format: data.output_format,
        guidance_scale: data.guidance_scale,
        output_quality: data.output_quality,
        prompt_strength: data.prompt_strength
      }
    });

    // Initialize Replicate
    console.log('Initializing Replicate...');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    });
    console.log('Replicate initialized successfully');

    // Create the prediction
    console.log('Creating prediction...');
    const prediction = await replicate.predictions.create({
      version: "3ef4fcf9b99f9aead7b341f010518a9f68383f9a24eea24dcabb2b29ac7b7da0",
      input: {
        prompt: data.prompt,
        model: "dev",
        go_fast: data.go_fast ?? false,
        lora_scale: 1,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: data.aspect_ratio ?? "1:1",
        output_format: data.output_format ?? "webp",
        guidance_scale: data.guidance_scale ?? 3,
        output_quality: data.output_quality ?? 80,
        prompt_strength: data.prompt_strength ?? 0.8,
        extra_lora_scale: 1,
        num_inference_steps: 28
      }
    });

    console.log('Prediction created:', prediction);

    // Wait for the prediction to complete
    console.log('Waiting for prediction to complete...');
    const finalPrediction = await waitForPrediction(replicate, prediction);
    console.log('Final prediction:', finalPrediction);

    // The output should now be an array of URLs
    if (!finalPrediction.output || !Array.isArray(finalPrediction.output)) {
      console.log('Invalid prediction output:', finalPrediction);
      throw new Error('Invalid prediction output format');
    }

    // Get the first URL from the output array
    const imageUrl = finalPrediction.output[0];
    console.log('Generated image URL:', imageUrl);

    if (typeof imageUrl !== 'string') {
      console.log('Invalid image URL type:', typeof imageUrl);
      throw new Error('Invalid image URL format');
    }

    return {
      success: true,
      output: imageUrl,
    };
  } catch (error) {
    console.error('Detailed error in generateImage:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

interface VideoGenerationParams {
  prompt: string;
  firstFrameImage: string; // base64 encoded image
}

export async function generateVideo(params: VideoGenerationParams) {
  try {
    const response = await fetch('https://api.minimaxi.chat/v1/video_generation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${process.env.MINIMAX_API_TOKEN}`
      },
      body: JSON.stringify({
        model: "video-01",
        prompt: params.prompt,
        first_frame_image: params.firstFrameImage
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.base_resp?.status_msg || 'Failed to generate video');
    }

    return { success: true, taskId: data.task_id };
  } catch (error) {
    console.error('Video generation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate video' 
    };
  }
}

export async function checkVideoStatus(taskId: string) {
  try {
    const response = await fetch(
      `https://api.minimaxi.chat/v1/query/video_generation?task_id=${taskId}`,
      {
        headers: {
          'authorization': `Bearer ${process.env.MINIMAX_API_TOKEN}`,
          'content-type': 'application/json',
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.base_resp?.status_msg || 'Failed to check video status');
    }

    return { success: true, status: data.status, fileId: data.file_id };
  } catch (error) {
    console.error('Video status check error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check video status' 
    };
  }
}

export async function getVideoDownloadUrl(fileId: string) {
  try {
    const response = await fetch(
      `https://api.minimaxi.chat/v1/files/retrieve?GroupId=${process.env.MINIMAX_GROUP_ID}&file_id=${fileId}`,
      {
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${process.env.MINIMAX_API_TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.base_resp?.status_msg || 'Failed to get video download URL');
    }

    return { success: true, downloadUrl: data.download_url };
  } catch (error) {
    console.error('Video download URL error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get video download URL' 
    };
  }
}
