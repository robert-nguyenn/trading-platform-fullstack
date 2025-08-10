// src/components/polymarket/MarketEventsSection.tsx
'use client'; // Needed if this component uses hooks or state in App Router

import { useEffect, useState } from 'react';
import { EventCard } from './EventCard'; // Import the card component
import { Event, RawPolymarketEventData, PolymarketTag } from '../../lib/polymarket'; // Import types
import { Skeleton } from "@/components/ui/skeleton"; // Assuming shadcn/ui skeleton for loading state

// Helper function to format dates
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
     // Check if date is valid
    if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Error';
  }
};

// Helper function to format volume (basic formatting)
const formatVolume = (volume: number): string => {
  // You could add K/M/B logic here if needed
  // For now, just format with currency and commas
  return '$' + volume.toLocaleString('en-US', {
    minimumFractionDigits: 0, // Adjust as needed
    maximumFractionDigits: 2, // Adjust as needed
  });
};

// Helper function to map raw backend data to frontend Event type
const mapRawEventToEvent = (rawEvent: RawPolymarketEventData): Event => {
  // Safely extract tag labels. rawEvent.tags is JSON, needs parsing/assertion.
  // Assuming the structure is { id: number, name: string, slug: string, label?: string }[]
  const tags = Array.isArray(rawEvent.tags)
    ? rawEvent.tags.map((tag: PolymarketTag) => tag.label || tag.name || 'Unknown')
    : []; // Default to empty array if tags is not an array

  return {
    id: rawEvent.id.toString(), // Convert number ID to string for consistency
    image: rawEvent.image || '/placeholder.svg', // Provide fallback image
    question: rawEvent.question,
    // Map active/closed status to a display string
    status: rawEvent.active ? "Active" : (rawEvent.closed ? "Closed" : "Unknown"), // Add 'Unknown' status fallback
    endDateDisplay: formatDate(rawEvent.endDate),
    tags: tags,
    volumeDisplay: formatVolume(rawEvent.volume),
  };
};


export default function MarketEventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setError(null); // Clear previous errors
        setLoading(true); // Set loading state

        // Fetch data from your backend API endpoint
        const response = await fetch( `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/polymarket/stored-events`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result: { status: string; data: RawPolymarketEventData[]; message?: string } = await response.json();

        if (result.status !== 'OK') {
             throw new Error(result.message || 'API returned non-OK status');
        }

        // Map the fetched raw data to the frontend Event type
        const mappedEvents = result.data.map(mapRawEventToEvent);

        setEvents(mappedEvents);

      } catch (err) {
        console.error('Error fetching stored Polymarket events:', err);
        setError(`Failed to load events: ${(err as Error).message}`);
        setEvents([]); // Clear events on error
      } finally {
        setLoading(false); // Always stop loading
      }
    };

    fetchEvents();
  }, []); // Empty dependency array means this runs once on mount

  // Placeholder handler for the button (you'll implement this later)
  const handleUseInStrategy = (eventId: string) => {
    console.log(`Attempting to use event ${eventId} in strategy`);
    // Implement navigation or modal to integrate this event into the strategy builder
    // For example: router.push(`/strategies/new?eventId=${eventId}`);
  };

  return (
    <section className="py-12 bg-background">
      <div className="container px-4 mx-auto">
        {/* Section Title */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Market-Moving Events</h2>
          <p className="mt-2 text-muted-foreground">Explore high-impact events that could move markets</p>
        </div>

        {/* Loading, Error, or Content */}
        {loading && (
            // Render skeleton loaders while loading - Max 4 per row
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, index) => ( // Show skeletons to fill the grid
                    <div key={index} className="flex flex-col space-y-4 rounded-lg border p-6">
                        <Skeleton className="aspect-[3/2] w-full rounded-lg" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        )}

        {error && (
            // Render error message
            <div className="text-red-500 text-center p-8 border border-red-200 rounded-md">
                {error}
            </div>
        )}

        {!loading && !error && events.length === 0 && (
             // Render message if no events found after loading
             <div className="text-muted-foreground text-center p-8 border rounded-md">
                 No market-moving events found matching current criteria.
             </div>
        )}

        {!loading && !error && events.length > 0 && (
            // Render the grid of EventCards - Max 4 per row for better spacing
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onUseInStrategy={handleUseInStrategy} // Pass the handler
                />
              ))}
            </div>
        )}
      </div>
    </section>
  );
}