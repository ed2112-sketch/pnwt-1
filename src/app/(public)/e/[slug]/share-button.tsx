"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ eventTitle }: { eventTitle: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: eventTitle, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-[rgba(255,255,255,0.08)] text-white transition-colors duration-200 hover:border-[rgba(255,255,255,0.2)] cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="size-4 text-white" />
          Link Copied
        </>
      ) : (
        <>
          <Share2 className="size-4 text-[#a1a1a1]" />
          Share Event
        </>
      )}
    </button>
  );
}
