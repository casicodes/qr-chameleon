"use client";
import { useState, useRef, useEffect } from "react";

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#e53935" },
  { name: "Orange", value: "#fb8c00" },
  { name: "Green", value: "#43a047" },
  { name: "Blue", value: "#1e88e5" },
  { name: "White", value: "#ffffff" },
];

const FORMATS = [
  { label: "JPG", value: "jpg", icon: "/ft-jpg.svg" },
  { label: "PNG", value: "png", icon: "/ft-png.svg" },
  { label: "SVG", value: "svg", icon: "/ft-svg.svg" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [format, setFormat] = useState<'png' | 'svg' | 'jpg'>('png');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrBlob, setQrBlob] = useState<Blob | null>(null);
  const [svgText, setSvgText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState<string>("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [shortId, setShortId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // Debounce URL input to avoid spamming backend
  const debouncedUrl = useDebounce(url, 400);

  useEffect(() => {
    const generateQR = async () => {
      if (!debouncedUrl) {
        setQrImage(null);
        setQrBlob(null);
        setSvgText(null);
        setError(null);
        setRedirectUrl(null);
        setShortId(null);
        return;
      }

      // Validate URL format
      try {
        new URL(debouncedUrl);
      } catch (err) {
        setError("Invalid destination link");
        setQrImage(null);
        setQrBlob(null);
        setSvgText(null);
        setRedirectUrl(null);
        setShortId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:4000/api/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination_url: debouncedUrl, format, color }),
        });
        if (!res.ok) throw new Error("Failed to generate QR code");
        
        // Get the short ID and redirect URL from response headers
        const shortId = res.headers.get('X-Short-ID');
        const redirectUrl = res.headers.get('X-Redirect-URL');
        
        console.log('Response headers:', {
          shortId,
          redirectUrl,
          allHeaders: Object.fromEntries(res.headers.entries())
        });
        
        if (format === 'svg') {
          const svgText = await res.text();
          const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
          setQrBlob(svgBlob);
          setQrImage(URL.createObjectURL(svgBlob));
          setSvgText(svgText);
        } else {
          const blob = await res.blob();
          setQrBlob(blob);
          setQrImage(URL.createObjectURL(blob));
          setSvgText(null);
        }
        
        // Set the actual short ID and redirect URL from backend
        setShortId(shortId);
        setRedirectUrl(redirectUrl);
        
        console.log('Set shortId to:', shortId);
        
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setQrImage(null);
        setQrBlob(null);
        setSvgText(null);
        setRedirectUrl(null);
        setShortId(null);
      } finally {
        setLoading(false);
      }
    };
    generateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUrl, color, format]);

  const handleDownload = () => {
    if (qrBlob && downloadRef.current) {
      const url = URL.createObjectURL(qrBlob);
      downloadRef.current.href = url;
      downloadRef.current.download = `qr-code.${format}`;
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const handleCopyLink = async () => {
    console.log('Copying shortId:', shortId);
    if (shortId) {
      try {
        await navigator.clipboard.writeText(shortId);
        console.log('Successfully copied:', shortId);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error('Failed to copy QR ID:', err);
      }
    } else {
      console.log('No shortId available to copy');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-left tracking-tight flex-1">QR Chameleon</h1>
          <button
            type="button"
            onClick={() => window.location.href = '/manage'}
            className="flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-lg transition-all duration-200 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black hover:bg-gray-200 text-sm"
            title="Manage your QR codes"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>

          </button>
        </div>
        <form className="flex flex-col gap-2.5" onSubmit={e => e.preventDefault()}>
          <label className="font-medium text-gray-700 tracking-normal">Enter destination URL</label>
          <input
            type="url"
            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black bg-[#fafafa]"
            placeholder="https://example.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
          <label className="font-medium text-gray-700 tracking-w mt-3">Choose color</label>
          <div className="flex gap-3 mb-2 w-full justify-between">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c.value}
                className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${color === c.value ? 'border-black scale-110' : c.value === '#ffffff' ? 'border-gray-300' : 'border-transparent'}`}
                style={{ background: c.value }}
                aria-label={c.name}
                onClick={() => { setColor(c.value); setCustomColor(""); }}
              />
            ))}
            {/* Custom color picker */}
            <label className="h-10 w-10 rounded-full border-2 border border-gray-300 flex items-center justify-center cursor-pointer transition-all" style={{ background: customColor || '#fff' }}>
              <input
                type="color"
                value={customColor || "#000000"}
                onChange={e => { setCustomColor(e.target.value); setColor(e.target.value); }}
                className="opacity-0 w-0 h-0 absolute cursor-pointer"
                aria-label="Custom color"
              />
              <span className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center" style={{ background: customColor || '#fff' }}>
                {/* Color wheel icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" strokeWidth="1.5" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25 1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 1 0-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94.19-1.28.53l-.97.97-.75-.75.97-.97c.34-.34.53-.8.53-1.28s.19-.94.53-1.28L12.75 9M15 11.25 12.75 9" />
</svg>

              </span>
            </label>
          </div>
          <label className="font-medium text-gray-700 tracking-w mt-3">Format</label>
          <div className="flex gap-3 mb-2">
            {FORMATS.map(f => (
              <button
                type="button"
                key={f.value}
                className={`w-full flex flex-col items-center justify-center w-20 h-16 rounded-xl border transition-all cursor-pointer ${
                  format === f.value
                    ? 'border-black border bg-gray-100 shadow-[0_0_px_0_rgba(0,0,0,1)]'
                    : 'border-gray-200 border bg-white shadow-none'
                }`}
                onClick={() => setFormat(f.value as any)}
                style={{
                  boxShadow: format === f.value
                    ? '0 0px 0px 1px rgba(0,0,0,1)'
                    : 'none'
                }}
              >
                <img src={f.icon} alt={f.label + ' icon'} className="w-8 h-8 mb-1" />
              </button>
            ))}
          </div>
        </form>
        <div className="bg-[#fafafa] rounded-xl p-4 flex flex-col items-center border border-gray-200 min-h-[180px] justify-center" style={{height: 180}}>
          {loading ? (
            <span className="text-gray-400">Generating...</span>
          ) : error ? (
            <span className="text-red-500 text-lg">{error}</span>
          ) : format === 'svg' && svgText ? (
            <div
              className="w-40 h-40 flex items-center justify-center overflow-hidden"
              style={{ minWidth: 160, minHeight: 160, maxWidth: 160, maxHeight: 160 }}
              dangerouslySetInnerHTML={{
                __html: svgText.replace(
                  /<svg([^>]*)>/,
                  '<svg$1 width="160" height="160" style="width:160px;height:160px;" preserveAspectRatio="xMidYMid meet">'
                ),
              }}
            />
          ) : (
            qrImage && <img src={qrImage} alt="Generated QR Code" className="w-40 h-40" />
          )}
          {!qrImage && !svgText && !loading && !error && (
            <span className="text-gray-400 flex items-center justify-center h-full w-full text-center text-lg">QR code preview</span>
          )}
        </div>
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black hover:bg-gray-200"
            style={{ minHeight: 48 }}
            disabled={!shortId}
            title="Save this ID to update the destination later without regenerating the QR code"
          >
            {/* Clipboard icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
</svg>

            Copy QR ID
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200 ease-out cursor-pointer  bg-black text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black"
            style={{  minHeight: 48 }}
            disabled={!qrBlob}
          >
            {/* Download icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            Download
          </button>
        </div>
        
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
            QR ID copied!
          </div>
        )}
        
        <a ref={downloadRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
