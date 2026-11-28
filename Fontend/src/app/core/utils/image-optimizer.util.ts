/**
 * Smart Client-Side Image Optimizer and Resizer
 * Automatically compresses large camera and high-res phone photos (e.g. 10MB-25MB)
 * down to crisp, optimized photos (~200KB-600KB, max 1200px) before uploading.
 */

export interface ImageOptimizationOptions {
  maxDimension?: number; // Maximum width or height in pixels (default: 1200)
  quality?: number;      // JPEG quality between 0.1 and 1.0 (default: 0.82)
  targetMaxKB?: number;  // Desired maximum file size in KB (default: 1024 KB = 1MB)
}

export async function compressAndResizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  // If not an image, return original file without modification
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // If SVG or GIF, preserve vector / animation
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const maxDimension = options.maxDimension ?? 1200;
  let quality = options.quality ?? 0.82;
  const targetMaxKB = options.targetMaxKB ?? 1024;

  return new Promise<File>((resolve) => {
    const reader = new FileReader();

    reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
      const dataUrl = readerEvent.target?.result as string;
      if (!dataUrl) {
        resolve(file);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Apply high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Standardize output to high-grade JPEG
        const outputMime = 'image/jpeg';

        const generateBlob = (q: number): Promise<Blob | null> => {
          return new Promise<Blob | null>((blobResolve) => {
            canvas.toBlob(blobResolve, outputMime, q);
          });
        };

        generateBlob(quality).then(async (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If blob is still larger than targetMaxKB and quality > 0.5, perform a secondary compression
          let finalBlob = blob;
          if (finalBlob.size > targetMaxKB * 1024 && quality > 0.6) {
            const secondBlob = await generateBlob(0.65);
            if (secondBlob) finalBlob = secondBlob;
          }

          // Build clean output file name with .jpg
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const cleanFileName = `${baseName}_optimized.jpg`;

          const optimizedFile = new File([finalBlob], cleanFileName, {
            type: outputMime,
            lastModified: Date.now()
          });

          resolve(optimizedFile);
        });
      };

      img.onerror = () => resolve(file);
      img.src = dataUrl;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
