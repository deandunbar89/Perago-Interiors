"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Silently re-fetches server data every 20s so other users' changes show up
 * without anyone needing to manually reload the page. */
export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 20_000);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
