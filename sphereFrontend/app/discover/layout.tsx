'use client';
// mercatoFrontend/app/discover/layout.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isGeo = path?.startsWith('/discover/geopolitical');
  // const isMacro = path?.startsWith('/discover/macro');
  const isMacro = path === '/discover' || path?.startsWith('/discover/macro');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex space-x-6 mb-8 border-b">
        <Link
          href="/discover/geopolitical"
          className={`pb-2 ${isGeo ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
        >
          Geopolitical
        </Link>
        <Link
          // href="/discover/macro"
          href="/discover"
          className={`pb-2 ${isMacro ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
        >
          Macroeconomic
        </Link>
      </div>
      {children}
    </div>
  );
}