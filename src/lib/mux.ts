const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;
const BASE_URL = "https://api.mux.com";

function auth() {
  return btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
}

export async function createUploadUrl() {
  const res = await fetch(`${BASE_URL}/video/v1/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth()}`,
    },
    body: JSON.stringify({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
        video_quality: "basic",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mux upload creation failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return {
    uploadUrl: json.data.url as string,
    uploadId: json.data.id as string,
  };
}

export async function getUploadStatus(uploadId: string) {
  const res = await fetch(`${BASE_URL}/video/v1/uploads/${uploadId}`, {
    headers: {
      Authorization: `Basic ${auth()}`,
    },
  });

  if (!res.ok) throw new Error(`Mux upload status failed: ${res.status}`);
  const json = await res.json();
  return {
    status: json.data.status as string,
    assetId: (json.data.asset_id as string) || null,
  };
}

export async function getAsset(assetId: string) {
  const res = await fetch(`${BASE_URL}/video/v1/assets/${assetId}`, {
    headers: {
      Authorization: `Basic ${auth()}`,
    },
  });

  if (!res.ok) throw new Error(`Mux asset fetch failed: ${res.status}`);
  const json = await res.json();
  return {
    status: json.data.status as string,
    playbackId: json.data.playback_ids?.[0]?.id as string,
    duration: json.data.duration as number,
  };
}
