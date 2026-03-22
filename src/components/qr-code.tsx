"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QrCode({ data, size = 150 }: { data: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, { width: size, margin: 2 });
    }
  }, [data, size]);
  return <canvas ref={canvasRef} />;
}
