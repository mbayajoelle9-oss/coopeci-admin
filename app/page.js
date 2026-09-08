'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Loading from '@/components/Loading';

export default function Home() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [loading, isAuthenticated, router]);
  return <Loading label="Ouverture…" />;
}
