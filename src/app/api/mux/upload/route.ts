import { createUploadUrl } from "@/lib/mux";

export async function POST() {
  try {
    const { uploadUrl, uploadId } = await createUploadUrl();
    return Response.json({ uploadUrl, uploadId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
