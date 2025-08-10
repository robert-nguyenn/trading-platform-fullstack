// src/types/polymarket.ts

// Define the shape of the event data expected by the UI components
export type Event = {
    // Use string for ID in the frontend for consistency
    id: string;
    // Image URL or placeholder path
    image: string;
    // The main question/headline of the event
    question: string;
    // Status formatted for display (e.g., "Active", "Closed")
    status: "Active" | "Closed" | "Unknown"; // Or add other statuses like "Pending", "Resolved" if needed
    // Formatted end date string for display
    endDateDisplay: string;
    // Array of tag names or labels
    tags: string[];
    // Formatted volume string for display (e.g., "$246K", "$3.2M")
    volumeDisplay: string;
  };
  
  // Define the shape of the raw data fetched from your backend API endpoint
  // This should match the structure of the PolymarketEvent Prisma model when serialized
  export interface RawPolymarketEventData {
      id: number; // Comes as Int from Prisma
      ticker: string | null;
      slug: string;
      question: string;
      description: string | null;
      image: string | null;
      active: boolean;
      closed: boolean;
      startDate: string; // Date will be serialized as ISO string
      endDate: string | null; // Date will be serialized as ISO string, can be null
      volume: number; // Float from Prisma
      liquidity: number; // Float from Prisma
      tags: any; // Assuming this is JSON, type it appropriately if possible (e.g., PolymarketTag[])
      rawData: any; // Store the full raw object JSON
      fetchedAt: string; // Date will be serialized as ISO string
  }
  
  // Assuming you might need the raw tag structure if mapping happens client-side
  export interface PolymarketTag {
    id: number;
    name: string;
    slug: string;
    label?: string; // Polymarket API sometimes uses 'label', sometimes 'name'
    // ... other tag properties if needed
  }