import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  assets: GitHubReleaseAsset[];
  tag_name: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGitHubReleaseAsset(value: unknown): value is GitHubReleaseAsset {
  return isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.browser_download_url === "string";
}

function isGitHubRelease(value: unknown): value is GitHubRelease {
  return isRecord(value) &&
    Array.isArray(value.assets) &&
    value.assets.every(isGitHubReleaseAsset) &&
    typeof value.tag_name === "string";
}

export async function GET() {
  try {
    // Simulate backend connection and package preparation delay (optional, for UX)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Fetch the latest release from the actual GitHub repository
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://api.github.com/repos/SamXop123/Paraline/releases/latest", {
      cache: "no-store",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Paraline-Landing-Page"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub releases: ${response.status} ${response.statusText}`);
    }

    const data: unknown = await response.json();

    if (!isGitHubRelease(data)) {
      throw new Error("Invalid GitHub release response");
    }
    
    // Find the actual .exe asset
    const exeAsset = data.assets.find((asset) => asset.name.endsWith('.exe'));
    
    if (!exeAsset) {
      throw new Error("No executable found in the latest release");
    }

    return NextResponse.json({
      success: true,
      url: exeAsset.browser_download_url,
      version: data.tag_name,
      filename: exeAsset.name,
      message: "Download ready!"
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  } catch (error: unknown) {
    console.error("Download API Error:", error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: "Request timed out fetching releases." },
        { status: 504 }
      );
    }

    // Direct fallback to the actual release asset on GitHub
    return NextResponse.json({
      success: true,
      url: "https://github.com/SamXop123/Paraline/releases/download/v2.6.1/Paraline-Setup-2.6.1.exe",
      version: "v2.6.1",
      filename: "Paraline-Setup-2.6.1.exe",
      message: "Download ready!"
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  }
}
