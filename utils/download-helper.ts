// utils/download-helper.ts

/**
 * Helper function to download an image from a URL
 * @param imageUrl The URL of the image to download
 * @param filename The desired filename for the download
 */
export async function downloadImage(imageUrl: string, filename: string) {
  try {
    // First, fetch the image data
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Network response was not ok');

    // Get the content type from the response headers
    const contentType = response.headers.get('content-type') || 'image/webp';

    // Convert the image data to a blob
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    // Programmatically click the link to trigger download
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the link and revoking the blob URL
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}
