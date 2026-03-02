import { encodeGrayscalePng } from './pngEncoder';

export async function convertImageToGrayscalePng(imageUrl: string, targetWidth: number, targetHeight: number): Promise<Uint8Array> {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.imageSmoothingEnabled = true;

    // Use full image dimensions
    const sourceW = bitmap.width;
    const sourceH = bitmap.height;
    const sourceX = 0;
    const sourceY = 0;

    ctx.drawImage(bitmap, sourceX, sourceY, sourceW, sourceH, 0, 0, targetWidth, targetHeight);

    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;
    const grayscaleData = new Uint8Array(targetWidth * targetHeight);

    for (let i = 0; i < targetWidth * targetHeight; i++) {
        const offset = i * 4;
        // Faster grayscale approximation
        grayscaleData[i] = (data[offset] * 77 + data[offset + 1] * 151 + data[offset + 2] * 28) >>> 8;
    }

    return encodeGrayscalePng(targetWidth, targetHeight, grayscaleData);
}
