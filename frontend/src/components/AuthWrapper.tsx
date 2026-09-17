'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('garagebook_token');
    
    const checkRoleAndRedirect = async (jwt: string) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://garagebook-new.vercel.app/api/v1';
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        
        if (!res.ok) {
          localStorage.removeItem('garagebook_token');
          router.replace('/login');
          return;
        }

        const user = await res.json();
        const restrictedForMechanics = ['/settings', '/accounting', '/reports', '/procurement'];
        if (user.role === 'MECHANIC' && restrictedForMechanics.some(route => pathname.startsWith(route))) {
          router.replace('/jobs');
        }
      } catch (e) {
        // invalid token or network error
      }
    };

    if (!token) {
      if (pathname !== '/login') {
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
      }
    } else {
      if (pathname === '/login') {
        router.replace('/');
      } else {
        checkRoleAndRedirect(token);
      }
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
