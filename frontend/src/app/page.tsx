"use client";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#e53935" },
  { name: "Orange", value: "#fb8c00" },
  { name: "Green", value: "#43a047" },
  { name: "Blue", value: "#1e88e5" },
  // Removed white color
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
  const [showColorWheel, setShowColorWheel] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlError, setUrlError] = useState(false);

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
        setError("Invalid destination url");
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
    if (!url || !isValidUrl(url)) {
      setUrlError(true);
      urlInputRef.current?.focus();
      return;
    }
    if (qrBlob && downloadRef.current) {
      const url = URL.createObjectURL(qrBlob);
      downloadRef.current.href = url;
      downloadRef.current.download = `qr-code.${format}`;
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const handleCopyLink = async () => {
    if (!url || !isValidUrl(url)) {
      setUrlError(true);
      urlInputRef.current?.focus();
      return;
    }
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

  function isValidUrl(str: string) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

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
            className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 text-black bg-[#fafafa] ${urlError && (!url || !isValidUrl(url)) ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-black'}`}
            placeholder="https://example.com"
            value={url}
            onChange={e => { setUrl(e.target.value); setUrlError(false); }}
            required
            ref={urlInputRef}
          />
          
          <label className="font-medium text-gray-700 tracking-w mt-3">Choose color</label>
          <div className="flex gap-3 mb-2 w-full justify-between">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c.value}
                className="h-12 w-12 flex items-center justify-center transition-all cursor-pointer bg-transparent p-0 border-none"
                onClick={() => { setColor(c.value); setCustomColor(""); setShowColorWheel(false); }}
                aria-label={c.name}
                style={{ background: 'transparent' }}
              >
                {color === c.value ? (
                  <span className="block h-10 w-10 rounded-full flex items-center justify-center" style={{ background: c.value }}>
                    <motion.span
                      className="block h-8 w-8 rounded-full border-4 border-white"
                      style={{ background: c.value }}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, ease: "easeOut" }}
                    />
                  </span>
                ) : (
                  <span className="block h-10 w-10 rounded-full" style={{ background: c.value }} />
                )}
              </button>
            ))}
            {/* Custom color wheel picker */}
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                className={`h-12 w-12 flex items-center justify-center transition-all cursor-pointer bg-transparent p-0 border-none`}
                aria-label="Custom color"
                style={{ background: 'transparent' }}
                onClick={() => setShowColorWheel(v => !v)}
              >
                {color === customColor && customColor ? (
                  (customColor.toLowerCase() === '#fff' || customColor.toLowerCase() === '#ffffff') ? (
                    // White selected: add gray-50 background for balance
                    <span className="block h-10 w-10 rounded-full flex items-center justify-center bg-gray-50">
                      <motion.span
                        className="block h-8 w-8 rounded-full border-4"
                        style={{ background: customColor, borderColor: '#e5e7eb' }}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, ease: "easeOut" }}
                      />
                    </span>
                  ) : (
                    // Other custom color selected
                    <span className="block h-10 w-10 rounded-full flex items-center justify-center" style={{ background: customColor }}>
                      <motion.span
                        className="block h-8 w-8 rounded-full border-4 border-white"
                        style={{ background: customColor }}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, ease: "easeOut" }}
                      />
                    </span>
                  )
                ) : (
                  // Not selected
                  <span
                    className="block h-10 w-10 rounded-full"
                    style={{
                      background: customColor
                        ? customColor
                        : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                    }}
                  />
                )}
              </button>
              {showColorWheel && (
                <div className="absolute z-50 top-12 left-1/2 -translate-x-1/2 bg-white p-3 rounded-xl shadow-lg border border-black/5 flex flex-col items-center min-w-[220px] w-64">
                  <HexColorPicker
                    color={customColor || "#000000"}
                    onChange={c => {
                      setCustomColor(c);
                      setColor(c);
                    }}
                  />
                  <input
                    type="text"
                    className="mt-3 mb-2 w-full rounded-md border border-gray-300 px-2 py-1 text-center text-base font-mono focus:outline-none focus:ring-2 focus:ring-black"
                    value={customColor || "#000000"}
                    onChange={e => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val.replace(/[^0-9a-fA-F]/g, '');
                      setCustomColor(val);
                      setColor(val);
                    }}
                    maxLength={7}
                  />
                  <button
                    className="w-full mt-1 px-3 py-2 bg-black text-white rounded-lg font-semibold text-base hover:bg-neutral-800 transition-all cursor-pointer"
                    onClick={() => setShowColorWheel(false)}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
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
            <span className="text-gray-50">Generating...</span>
          ) : error ? (
            <motion.span
              className="text-red-500 text-lg flex items-center gap-2 justify-center"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -3, 3, -2, 2, -1, 1, 0] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {/* Warning icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              {error}
            </motion.span>
          ) : (
            <AnimatePresence mode="wait">
              {(format === 'svg' && svgText) ? (
                <motion.div
                  key={svgText + color + format + debouncedUrl}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: "linear" }}
                  className="w-40 h-40 flex items-center justify-center overflow-hidden"
                  style={{ minWidth: 160, minHeight: 160, maxWidth: 160, maxHeight: 160 }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: svgText.replace(
                        /<svg([^>]*)>/,
                        '<svg$1 width="160" height="160" style="width:160px;height:160px;" preserveAspectRatio="xMidYMid meet">'
                      ),
                    }}
                    className="w-full h-full"
                  />
                </motion.div>
              ) : qrImage ? (
                <motion.img
                  key={qrImage + color + format + debouncedUrl}
                  src={qrImage}
                  alt="Generated QR Code"
                  className="w-40 h-40"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: "linear" }}
                />
              ) : (
                !loading && !error && (
                  <span className="text-gray-400 flex items-center justify-center h-full w-full text-center text-lg">QR code preview</span>
                )
              )}
            </AnimatePresence>
          )}
        </div>
        <div className="flex gap-4 mt-2">
          <motion.button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200 ease-out cursor-pointer bg-gray-100 text-black hover:bg-gray-200"
            style={{ minHeight: 48 }}
            // disabled={!shortId}
            title="Save this ID to update the destination later without regenerating the QR code"
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative w-5 h-5 flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {!showToast ? (
                  <motion.span
                    key="clipboard"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {/* Clipboard icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                  </motion.span>
                ) : (
                  <motion.span
                    key="check"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.12, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {/* Check icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span>
              {showToast ? "Copy QR ID" : "Copy QR ID"}
            </span>
          </motion.button>
          <motion.button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200 ease-out cursor-pointer  bg-black text-white hover:bg-neutral-800"
            style={{  minHeight: 48 }}
            // disabled={!qrBlob}
            whileTap={{ scale: 0.98 }}
          >
            {/* Download icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            Download
          </motion.button>
        </div>
        
        {/* Toast Notification */}
        <AnimatePresence mode="wait">
          {showToast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
              exit={{ opacity: 0, x: 16, transition: { duration: 0.2, ease: 'easeInOut' } }}
              className="fixed top-8 right-8 bg-black text-white px-5 py-2 rounded-full shadow-lg z-50 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
              <span className="font-medium">Copied</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <a ref={downloadRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
