"use client";

import { useEffect, useRef } from "react";
import { ScanLine } from "lucide-react";

interface ScannerInputProps {
  onScan: (data: string) => void;
  disabled?: boolean;
}

export function ScannerInput({ onScan, disabled }: ScannerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused for barcode scanner
  useEffect(() => {
    const el = inputRef.current;
    if (!el || disabled) return;

    el.focus();
    const refocus = () => {
      if (!disabled) setTimeout(() => el.focus(), 100);
    };
    el.addEventListener("blur", refocus);
    return () => el.removeEventListener("blur", refocus);
  }, [disabled]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const value = e.currentTarget.value.trim();
      if (value) {
        onScan(value);
        e.currentTarget.value = "";
      }
    }
  }

  return (
    <div className="relative">
      <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Scan QR code or type ticket ID..."
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full h-14 rounded-lg border bg-background pl-14 pr-4 text-lg outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50"
        autoComplete="off"
        autoFocus
      />
    </div>
  );
}
