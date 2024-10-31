import { NextRequest, NextResponse } from "next/server";

const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
const clientSecret = process.env.NEXT_PUBLIC_TWITCH_CLIENT_SECRET!;
const redirectUri =
  process.env.REDIRECT_URI || "http://localhost:3000/api/auth/callback";
const tokenUrl = "https://id.twitch.tv/oauth2/token";
const scope = [
  "user:read:email",
  "user:read:follows",
  "channel:read:subscriptions",
  "channel:read:hype_train",
  "channel:read:redemptions",
  "channel:read:editors",
  "chat:read",
  "chat:edit",
  "moderation:read",
  "channel:moderate",
  "bits:read",
  "channel:read:vips",
  "analytics:read:extensions",
  "analytics:read:games",
  "clips:edit",
  "user:read:subscriptions",
].join(" ");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // No code means this is the initial request, so redirect to Twitch's authorization page
    const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}`;

    return NextResponse.redirect(twitchAuthUrl);
  }

  // If there is a code, this means we're handling the callback, so we need to exchange it for an access token
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error }, { status: 400 });
  }

  const tokens = await response.json();

  // In production, you would store the tokens securely (e.g., in a database or encrypted cookies)
  return NextResponse.redirect(
    `http://localhost:3000/?access_token=${tokens.access_token}`
  );
}
