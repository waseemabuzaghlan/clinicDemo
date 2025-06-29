'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function VisitRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/visits');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}