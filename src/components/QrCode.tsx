"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { copyToClipboard } from "@/lib/clipboard";

type QrCodeProps = {
  data: string;
  size?: number;
};

export function QrCode({ data, size = 220 }: QrCodeProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    QRCode.toString(data, { type: "svg", width: size, margin: 2, color: { dark: "#111827", light: "#ffffff" } })
      .then((str: string) => {
        setSvg(str);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [data, size]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border-2 border-dashed h-64 w-64" style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
        <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>Génération du QR code…</span>
      </div>
    );
  }
  if (!svg) return <div className="h-64 w-64">Impossible de générer le QR code.</div>;

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent-soft rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
      <div className="relative bg-white p-3 rounded-xl shadow-lg border border-line">
        <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full h-full" />
      </div>
      <p className="mt-3 text-xs font-medium text-center" style={{ color: "var(--ink-soft)" }}>
        Scannez pour rejoindre la classe
      </p>
    </div>
  );
}
