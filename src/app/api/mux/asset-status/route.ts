import { NextRequest } from "next/server";
import { getUploadStatus, getAsset } from "@/lib/mux";

export async function GET(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  const assetId = req.nextUrl.searchParams.get("assetId");

  try {
    if (assetId) {
      const asset = await getAsset(assetId);
      return Response.json(asset);
    }

    if (uploadId) {
      const upload = await getUploadStatus(uploadId);
      return Response.json(upload);
    }

    return Response.json({ error: "uploadId or assetId required" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
