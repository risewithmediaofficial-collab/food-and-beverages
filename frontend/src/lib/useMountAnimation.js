import { useEffect, useState } from 'react';

// returns a className that animates from slightly below + faded to visible
export default function useMountAnimation(delay = 10) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2';
}
