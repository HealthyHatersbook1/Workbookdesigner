// FIX: Add Vite client types to resolve issues with import.meta.env
/// <reference types="vite/client" />

export interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  photographer: string;
  photographer_url: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

const PEXELS_API_KEY = import.meta.env?.VITE_PEXELS_API_KEY;
const PEXELS_API_URL = "https://api.pexels.com/v1/search";

if (!PEXELS_API_KEY) {
  console.warn("VITE_PEXELS_API_KEY environment variable not set. Stock image search will not work.");
}

export const searchPexelsImages = async (query: string): Promise<PexelsPhoto[]> => {
  if (!PEXELS_API_KEY) {
    throw new Error("Pexels API Key is not configured.");
  }
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=15`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API request failed with status ${response.status}`);
    }

    const data: PexelsResponse = await response.json();
    return data.photos;

  } catch (error) {
    console.error("Error searching Pexels images:", error);
    return [];
  }
};