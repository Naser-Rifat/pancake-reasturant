// Cloudinary unsigned image upload — shared by every admin upload surface.
// The cloud name + unsigned preset are public (NEXT_PUBLIC_*), so this runs
// entirely client-side with no secret involved. No SDK; plain REST.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** True only when both env vars are set — callers hide upload UI otherwise. */
export const cloudinaryReady = Boolean(CLOUD && PRESET);

/**
 * Upload an image to Cloudinary and return its delivery URL with automatic
 * format/quality optimisation (`f_auto,q_auto`) baked in. A Blob is wrapped
 * into a File named `name`. Throws with Cloudinary's message on failure.
 */
export async function uploadToCloudinary(file: File | Blob, name = "upload.png"): Promise<string> {
  if (!CLOUD || !PRESET) throw new Error("Image uploads aren't configured.");
  const form = new FormData();
  form.append("file", file instanceof File ? file : new File([file], name, { type: "image/png" }));
  form.append("upload_preset", PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? "Upload failed");
  return (body.secure_url as string).replace("/upload/", "/upload/f_auto,q_auto/");
}
