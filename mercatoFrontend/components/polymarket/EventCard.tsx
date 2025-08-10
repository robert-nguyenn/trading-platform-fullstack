// src/components/polymarket/EventCard.tsx
import Image from "next/image";
import { Badge } from "@/components/ui/badge"; // Assuming shadcn/ui alias
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui alias
import { CalendarIcon, TrendingUpIcon } from "lucide-react"; // Assuming lucide-react is installed

import { Event } from "@/lib/polymarket"; // Adjust the import path as necessary


type EventCardProps = {
  event: Event;
  // Add any other props needed, e.g., onClick handler for "Use in Strategy"
  onUseInStrategy?: (eventId: string) => void;
};

export const EventCard = ({ event, onUseInStrategy }: EventCardProps) => {
  // Determine badge variant based on status
  const statusVariant = event.status === "Active" ? "default" : "secondary";

  return (
    <div className="group flex flex-col h-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-2 hover:scale-[1.02] overflow-hidden cursor-pointer"> {/* Added group, enhanced animations */}
      {/* Image Section */}
      <div className="relative aspect-[3/2] w-full overflow-hidden"> {/* Added overflow-hidden for image animation */}
        {/* Use event.image directly, Image component handles loading/error */}
        <Image
          src={event.image}
          alt={event.question}
          fill
          className="object-cover rounded-t-lg transition-transform duration-500 group-hover:scale-110" // Added image zoom on hover
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, (max-width: 1500px) 25vw, 20vw" // Good practice for performance
        />
        {/* Overlay effect on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-6 space-y-5 flex-grow"> {/* Increased padding to p-6 and spacing to space-y-5 */}
        {/* Question/Headline */}
        <h3 className="font-semibold text-base line-clamp-3 leading-relaxed min-h-[4.5rem] transition-colors duration-200 group-hover:text-primary"> {/* Added color transition on hover */}
          {event.question}
        </h3>

        {/* Status and End Date */}
        <div className="flex items-center justify-between text-sm text-muted-foreground"> {/* Increased text size */}
          <Badge variant={statusVariant} className="px-3 py-1.5 text-xs font-medium transition-all duration-200 group-hover:scale-105"> {/* Added scale animation */}
            {event.status}
          </Badge>
          <div className="flex items-center transition-all duration-200 group-hover:text-foreground"> {/* Added text color transition */}
            <CalendarIcon className="h-4 w-4 mr-1.5 transition-transform duration-200 group-hover:rotate-12" /> {/* Added icon rotation */}
            <span>Ends: {event.endDateDisplay}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 min-h-[2.5rem]"> {/* Increased gap and minimum height */}
          {event.tags.slice(0, 3).map((tag, index) => ( // Limit to 3 tags for consistency
            <Badge 
              key={`${event.id}-tag-${index}`} 
              variant="outline" 
              className="px-2.5 py-1 text-xs font-normal transition-all duration-200 group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 50}ms` }} // Staggered animation
            >
              #{tag}
            </Badge>
          ))}
          {event.tags.length > 3 && (
            <Badge 
              variant="outline" 
              className="px-2.5 py-1 text-xs font-normal text-muted-foreground transition-all duration-200 group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:-translate-y-0.5"
              style={{ animationDelay: '150ms' }}
            >
              +{event.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Volume */}
        <div className="flex items-center text-sm text-muted-foreground transition-all duration-200 group-hover:text-foreground">
          <TrendingUpIcon className="h-4 w-4 mr-2 transition-all duration-300 group-hover:text-green-500 group-hover:scale-110" /> {/* Added color and scale animation */}
          <span className="font-medium">Volume: {event.volumeDisplay}</span>
        </div>

        {/* Use in Strategy Button - This will always be at the bottom */}
        <div className="mt-auto pt-3"> {/* Increased top padding */}
          <Button
            className="w-full h-11 transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/25 transform group-hover:scale-105" // Enhanced button animations
            onClick={() => onUseInStrategy?.(event.id)}
          >
            <span className="transition-all duration-200 group-hover:font-semibold">Use in Strategy</span>
          </Button>
        </div>
      </div>
    </div>
  );
};