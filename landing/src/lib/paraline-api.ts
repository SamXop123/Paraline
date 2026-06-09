/**
 * Paraline API Adapter
 * 
 * This file acts as an adapter layer to ensure the Next.js frontend
 * remains 100% compatible with the existing backend endpoints.
 * 
 * NO CHANGES should be made to these return values without verifying
 * against the main Electron/backend configuration.
 */

// Core GitHub URL for the Paraline project
export const GITHUB_URL = "https://github.com/SamXop123/Paraline";

/**
 * Returns the download URL for the Paraline Windows installer.
 * Currently pointing to the direct release or /api/download endpoint.
 */
export function getDownloadUrl(): string {
  // Can be swapped to an internal Next.js API route if needed: return "/api/download"
  return `${GITHUB_URL}/releases/latest`;
}

/**
 * (Optional) Returns the API endpoint to fetch GitHub stats if implemented.
 */
export function getGithubStatsEndpoint(): string {
  return "/api/github-stats";
}

/**
 * (Optional) Returns the endpoint to fetch theme configurations.
 */
export function getThemesEndpoint(): string {
  return "/api/themes";
}
