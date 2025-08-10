   // sphereFrontend/app/discover/geopolitical/page.tsx
   import MarketEventsSection from '@/components/polymarket/MarketEventSection';

   export const metadata = {
     title: 'Geopolitical Events | Sphere',
     description: 'Explore high-impact geopolitical events',
   };

   export default function GeopoliticalPage() {
     return <MarketEventsSection />;
   }