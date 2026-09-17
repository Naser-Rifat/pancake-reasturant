/**
 * Client-side validation and dimension inspection for dish and menu photos.
 * Ensures high storefront visual quality, optimal card aspect ratios,
 * and fast performance without bandwidth waste or blurry displays.
 */

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const RECOMMENDED_WIDTH = 1200;
export const RECOMMENDED_HEIGHT = 900;
export const MIN_IMAGE_WIDTH = 500;
export const MIN_IMAGE_HEIGHT = 400;
export const MIN_ASPECT_RATIO = 0.75; // Below this (e.g. 9:16 mobile story at 0.56, 2:3 vertical at 0.67) crops heavily across devices
export const MAX_ASPECT_RATIO = 2.10; // Above this is extreme panoramic strip

export interface DeviceCompatibilityReport {
  mobile: {
    compatible: boolean;
    rating: "Optimal" | "Good" | "Needs Crop";
    detail: string;
  };
  tablet: {
    compatible: boolean;
    rating: "Optimal" | "Good" | "Needs Crop";
    detail: string;
  };
  desktop: {
    compatible: boolean;
    rating: "Optimal" | "Good" | "Needs Crop";
    detail: string;
  };
  retinaScore: "Retina Crisp (2x/3x)" | "Standard HD" | "Low Resolution";
}

export function evaluateDeviceCompatibility(
  width: number,
  height: number,
  ratio: number
): DeviceCompatibilityReport {
  const isOptimalRatio = Math.abs(ratio - 1.333) <= 0.18 || Math.abs(ratio - 1.0) <= 0.12;
  const isRetina = width >= 1000 && height >= 750;
  const isStandardHD = width >= 600 && height >= 450;

  return {
    mobile: {
      compatible: ratio >= MIN_ASPECT_RATIO && ratio <= MAX_ASPECT_RATIO,
      rating: isOptimalRatio ? "Optimal" : ratio < 0.85 ? "Needs Crop" : "Good",
      detail: isOptimalRatio
        ? "Perfect plate framing on iPhone & Android screens (375–430px)"
        : ratio < 0.85
        ? "Slight vertical orientation; plate may show slight edge cropping on mobile"
        : "Fits cleanly in mobile card layout",
    },
    tablet: {
      compatible: ratio >= MIN_ASPECT_RATIO && ratio <= MAX_ASPECT_RATIO,
      rating: isOptimalRatio ? "Optimal" : "Good",
      detail: "Clean scaling in iPad 2-col and 3-col diner card grid (768–1024px)",
    },
    desktop: {
      compatible: ratio >= MIN_ASPECT_RATIO && ratio <= MAX_ASPECT_RATIO,
      rating: isOptimalRatio ? "Optimal" : "Good",
      detail: isRetina
        ? "Razor-sharp 2x/3x pixel density in 4-col boutique diner grid"
        : "Good presentation in desktop catalog",
    },
    retinaScore: isRetina
      ? "Retina Crisp (2x/3x)"
      : isStandardHD
      ? "Standard HD"
      : "Low Resolution",
  };
}

export interface ImageValidationResult {
  valid: boolean;
  width: number;
  height: number;
  ratio: number;
  ratioLabel: string;
  fileSizeMB: number;
  compatibility?: DeviceCompatibilityReport;
  error?: string;
  warning?: string;
}

/**
 * Classifies an aspect ratio into human-friendly dish photography terms.
 */
export function getRatioClassification(ratio: number): {
  label: string;
  isStandard: boolean;
  isAcceptable: boolean;
} {
  // 4:3 is ~1.333
  if (Math.abs(ratio - 1.333) <= 0.14) {
    return { label: "4:3 Landscape", isStandard: true, isAcceptable: true };
  }
  // 1:1 is 1.000
  if (Math.abs(ratio - 1.0) <= 0.10) {
    return { label: "1:1 Square", isStandard: true, isAcceptable: true };
  }
  // 3:2 is 1.500
  if (Math.abs(ratio - 1.5) <= 0.12) {
    return { label: "3:2 Landscape", isStandard: false, isAcceptable: true };
  }
  // 16:9 is ~1.777
  if (Math.abs(ratio - 1.777) <= 0.15) {
    return { label: "16:9 Widescreen", isStandard: false, isAcceptable: true };
  }
  // Vertical portrait (< 0.88)
  if (ratio < 0.88) {
    return { label: `${(1 / ratio).toFixed(1)}:1 Vertical`, isStandard: false, isAcceptable: ratio >= MIN_ASPECT_RATIO };
  }
  // Panoramic (> 2.0)
  if (ratio > 2.0) {
    return { label: `${ratio.toFixed(1)}:1 Panoramic`, isStandard: false, isAcceptable: ratio <= MAX_ASPECT_RATIO };
  }
  return { label: `${ratio.toFixed(2)}:1`, isStandard: false, isAcceptable: true };
}

/**
 * Validates a dish image file before uploading to Cloudinary.
 * Professional Multi-Device Quality Standards:
 * 1. File size strictly capped at 5 MB for rapid mobile loading and zero bandwidth waste.
 * 2. Non-image files strictly rejected.
 * 3. Extreme vertical portrait photos (< 0.75, e.g. 9:16 mobile story) are rejected
 *    because they clip off food plates heavily across mobile, tablet, and desktop cards.
 * 4. Extreme panoramic photos (> 2.10) are rejected because they shrink into thin ribbons.
 * 5. Low resolution (< 500x400 px) is rejected to eliminate blurry pixelation on Retina screens.
 */
export function validateDishImageFile(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const fileSizeMB = Number((file.size / (1024 * 1024)).toFixed(2));

    // 1. File size check (Max 5 MB hard limit)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return resolve({
        valid: false,
        width: 0,
        height: 0,
        ratio: 0,
        ratioLabel: "",
        fileSizeMB,
        error: `File size rejected: "${file.name}" is ${fileSizeMB} MB. Maximum allowed size is ${MAX_IMAGE_SIZE_MB} MB to ensure fast mobile page speeds and prevent customer cellular data drain.`,
      });
    }

    // 2. File type check (ensure it is an image)
    const fileType = (file.type || "").toLowerCase();
    const fileName = (file.name || "").toLowerCase();
    const isImage =
      fileType.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|avif|heic|bmp)$/i.test(fileName);

    if (!isImage) {
      return resolve({
        valid: false,
        width: 0,
        height: 0,
        ratio: 0,
        ratioLabel: "",
        fileSizeMB,
        error: `Format rejected: "${file.name}". Dish photos must be JPG, WebP, or PNG.`,
      });
    }

    // 3. Inspect image resolution and aspect ratio via browser Image decode
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    let settled = false;

    const cleanup = () => {
      if (!settled) {
        settled = true;
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
    };

    // Safety timeout: if image decoding stalls or takes > 2.5s, never hang the upload!
    const timer = setTimeout(() => {
      if (!settled) {
        cleanup();
        resolve({
          valid: true,
          width: 0,
          height: 0,
          ratio: 1,
          ratioLabel: "Uploaded",
          fileSizeMB,
        });
      }
    }, 2500);

    img.onload = () => {
      clearTimeout(timer);
      if (settled) return;
      cleanup();
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      if (!width || !height) {
        return resolve({
          valid: true,
          width: 0,
          height: 0,
          ratio: 1,
          ratioLabel: "Unknown",
          fileSizeMB,
        });
      }

      const ratio = width / height;
      const classification = getRatioClassification(ratio);
      const compatibility = evaluateDeviceCompatibility(width, height, ratio);

      // Strict Rule A: Low resolution rejection for Retina iPhone/iPad/Desktop
      if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
        return resolve({
          valid: false,
          width,
          height,
          ratio,
          ratioLabel: classification.label,
          fileSizeMB,
          compatibility,
          error: `Resolution rejected: "${file.name}" is only ${width}×${height} px. Dish cards across Mobile, Tablet, and Desktop require at least 500×400 px (recommended 1200×900 px) to prevent blurry pixelation on high-DPI displays.`,
        });
      }

      // Strict Rule B: Extreme vertical portrait rejection (e.g. 9:16 mobile story, 2:3 vertical)
      if (ratio < MIN_ASPECT_RATIO) {
        return resolve({
          valid: false,
          width,
          height,
          ratio,
          ratioLabel: classification.label,
          fileSizeMB,
          compatibility,
          error: `Aspect ratio rejected: "${file.name}" is vertical portrait (${(1 / ratio).toFixed(1)}:1, ${width}×${height} px). Across Mobile, Tablet, and Desktop, menu cards use horizontal landscape (4:3) or square (1:1) framing. Vertical photos get clipped by over 50%. Please crop to 4:3 or 1:1 before uploading.`,
        });
      }

      // Strict Rule C: Extreme panoramic rejection
      if (ratio > MAX_ASPECT_RATIO) {
        return resolve({
          valid: false,
          width,
          height,
          ratio,
          ratioLabel: classification.label,
          fileSizeMB,
          compatibility,
          error: `Aspect ratio rejected: "${file.name}" is ultra-wide panoramic (${ratio.toFixed(1)}:1, ${width}×${height} px). Dish cards across Mobile and Tablet require 4:3 or 1:1 photos to avoid shrinking into a thin sliver. Please crop to 4:3 or 1:1.`,
        });
      }

      // Sub-optimal advisory warnings
      let warning: string | undefined;
      if (ratio < 0.88) {
        warning = `"${file.name}" is slightly vertical (${width}×${height} px). 4:3 Landscape or 1:1 Square is recommended for optimal framing on mobile and desktop cards.`;
      } else if (ratio > 1.8) {
        warning = `"${file.name}" is widescreen (${width}×${height} px). 4:3 Landscape is recommended.`;
      } else if (width < 800 || height < 600) {
        warning = `Resolution is ${width}×${height} px. 1200×900 px is recommended for optimal Retina display clarity.`;
      }

      return resolve({
        valid: true,
        width,
        height,
        ratio,
        ratioLabel: classification.label,
        fileSizeMB,
        compatibility,
        warning,
      });
    };

    img.onerror = () => {
      clearTimeout(timer);
      if (settled) return;
      cleanup();
      resolve({
        valid: true,
        width: 0,
        height: 0,
        ratio: 1,
        ratioLabel: "Uploaded",
        fileSizeMB,
      });
    };

    // CRITICAL: Set img.src to trigger image decoding
    img.src = objectUrl;
  });
}

export interface AspectImageSpec {
  label: string;
  targetRatio: number;
  ratioTolerance: number;
  minWidth: number;
  minHeight: number;
  recommendedSize: string;
}

/** Builds a validator for a specific CMS image slot. It reuses the shared
 * file/type/size/decode checks, then enforces the dimensions that match the
 * exact public component rather than applying generic menu-card rules. */
export function validateImageForAspect(spec: AspectImageSpec) {
  return async (file: File): Promise<ImageValidationResult> => {
    const check = await validateDishImageFile(file);
    if (!check.valid || !check.width || !check.height) return check;

    if (check.width < spec.minWidth || check.height < spec.minHeight) {
      return {
        ...check,
        valid: false,
        error: `${spec.label} needs at least ${spec.minWidth}×${spec.minHeight}px (recommended ${spec.recommendedSize}). This image is ${check.width}×${check.height}px and may look blurry.`,
      };
    }

    const difference = Math.abs(check.ratio - spec.targetRatio);
    if (difference > spec.ratioTolerance) {
      return {
        ...check,
        valid: false,
        error: `${spec.label} uses a fixed ${spec.label.includes("4:5") ? "4:5 portrait" : "4:3 landscape"} frame. This image is ${check.width}×${check.height}px (${check.ratio.toFixed(2)}:1), so important content would be cropped. Crop it to ${spec.recommendedSize} and try again.`,
      };
    }

    return {
      ...check,
      ratioLabel: spec.label,
      warning: undefined,
    };
  };
}
