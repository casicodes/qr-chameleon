"use client";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { Inter } from "next/font/google";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const inter = Inter({ subsets: ["latin"] });

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
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerToggleRef = useRef<HTMLButtonElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlError, setUrlError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);

  // Manage QR states
  const [manageShortId, setManageShortId] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [findLoading, setFindLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [manageMessage, setManageMessage] = useState("");
  const [qrInfo, setQrInfo] = useState<any>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const isCreatingRef = useRef(false);

  // Debounce URL input to avoid spamming backend
  const debouncedUrl = useDebounce(url, 400);
  const debouncedColor = useDebounce(color, 200);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node) &&
        colorPickerToggleRef.current &&
        !colorPickerToggleRef.current.contains(event.target as Node)
      ) {
        setShowColorWheel(false);
      }
    };

    if (showColorWheel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorWheel]);

  useEffect(() => {
    const generateQR = async () => {
      if (!debouncedUrl) {
        setQrImage(null);
        setQrBlob(null);
        setSvgText(null);
        setError(null);
        setRedirectUrl(null);
        setShortId(null);
        setLoading(false);
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

      const isUpdate = !!shortId;

      // Prevent sending a new creation request if one is already in flight.
      if (!isUpdate && isCreatingRef.current) {
        return;
      }

      setLoading(true);
      setError(null);

      // Lock to indicate a creation request is starting.
      if (!isUpdate) {
        isCreatingRef.current = true;
      }

      try {
        const res = await fetch("/api/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination_url: debouncedUrl,
            format,
            color: debouncedColor,
            existingShortId: shortId
          }),
        });
        if (!res.ok) throw new Error("Failed to generate QR code");
        
        // Get the short ID and redirect URL from response headers
        const newShortId = res.headers.get('X-Short-ID');
        const redirectUrl = res.headers.get('X-Redirect-URL');
        
        console.log('Response headers:', {
          shortId: newShortId,
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
        if (newShortId) {
          setShortId(newShortId);
        }
        setRedirectUrl(redirectUrl);
        
        console.log('Set shortId to:', newShortId);
        
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setQrImage(null);
        setQrBlob(null);
        setSvgText(null);
        setRedirectUrl(null);
        setShortId(null);
      } finally {
        setLoading(false);
        // Unlock once the creation attempt is complete.
        if (!isUpdate) {
          isCreatingRef.current = false;
        }
      }
    };
    generateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUrl, debouncedColor, format, shortId]);

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
    const finalShortId = shortId || (redirectUrl ? new URL(redirectUrl).pathname.split('/').pop() : null);
    console.log('Copying shortId:', finalShortId);
    if (finalShortId) {
      try {
        await navigator.clipboard.writeText(finalShortId);
        console.log('Successfully copied:', finalShortId);
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

  const handleGetQRInfo = async () => {
    if (!manageShortId) return;
    setFindLoading(true);
    setManageMessage("");
    setQrInfo(null);
    try {
      const res = await fetch(`/api/qr/${manageShortId}`);
      if (res.ok) {
        const data = await res.json();
        setQrInfo(data);
      } else {
        setManageMessage("QR code not found. Please check the short ID.");
        setQrInfo(null);
      }
    } catch (err) {
      setManageMessage("Error fetching QR code info.");
      setQrInfo(null);
    } finally {
      setFindLoading(false);
    }
  };

  const handleUpdateDestination = async () => {
    if (!manageShortId || !newUrl) return;
    setUpdateLoading(true);
    setManageMessage("");
    try {
      const res = await fetch(`/api/qr/${manageShortId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination_url: newUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setManageMessage("Destination updated");
        setQrInfo({
          ...qrInfo,
          originalUrl: newUrl
        });
        setNewUrl("");
        setShowSuccessAnimation(true);
        setShowShimmer(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
        setTimeout(() => setShowShimmer(false), 2000);
      } else {
        const errorData = await res.json();
        setManageMessage(`❌ Error: ${errorData.error}`);
      }
    } catch (err) {
      setManageMessage("Error updating destination.");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-left tracking-tight flex-1">QR Chameleon</h1>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex gap-2 items-center justify-center p-2 rounded-lg transition-all duration-200 ease-out cursor-pointer text-gray-500 hover:text-black"
            title="Manage QR codes"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Find QR
          </button>
        </div>
        <form className="flex flex-col gap-2.5" onSubmit={e => e.preventDefault()}>
          <label className="font-medium text-gray-700 tracking-normal">Enter URL</label>
          <input
            type="url"
            className={`rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-1 border ${
              urlError && (!url || !isValidUrl(url))
                ? 'border-red-500 focus:ring-red-500'
                : 'border-neutral-200 focus:ring-black'
            }`}
            
            value={url}
            onChange={e => { setUrl(e.target.value); setUrlError(false); }}
            onFocus={() => { if (urlError) setUrlError(false); }}
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
                ref={colorPickerToggleRef}
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
                <div ref={colorPickerRef} className="absolute z-50 top-12 left-1/2 -translate-x-1/2 bg-white p-3 rounded-xl shadow-lg border border-black/5 flex flex-col items-center min-w-[220px] w-64">
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
                  <motion.button
                    className="w-full mt-1 px-3 py-2 bg-neutral-100 text-black rounded-lg font-semibold text-base hover:bg-neutral-200 transition-all cursor-pointer"
                    onClick={() => setShowColorWheel(false)}
                    whileTap={{ scale: 0.98 }}
                  >
                    Done
                  </motion.button>
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
                className={`w-full flex flex-col items-center justify-center w-20 h-16 rounded-xl border shadow-sm transition-all cursor-pointer ${
                  format === f.value
                    ? 'border-black border border-1 shadow-[0_0_px_0_rgba(0,0,1,1)]'
                    : 'border-neutral-200 border bg-white shadow-none'
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
        <div className="border border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center min-h-[180px] justify-center" style={{height: 180}}>
          {loading ? (
            <span className="text-neutral-300 shimmer">Generating...</span>
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
                  <span className="text-neutral-400 flex items-center justify-center h-full w-full text-center text-lg">QR preview will appear here</span>
                )
              )}
            </AnimatePresence>
          )}
        </div>
        <div className="flex gap-4 mt-2">
          <motion.button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-200 ease-out cursor-pointer bg-neutral-100 text-black hover:bg-neutral-200"
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

      {/* Manage QR Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className={`bg-white min-h-[55vh] ${inter.className}`}>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle className="text-2xl">Find QR</DrawerTitle>
              <DrawerDescription className="text-neutral-500 text-base">Enter the ID you saved to change its destination link.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="flex items-center w-full gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className="w-full rounded-lg pl-4 pr-10 h-[42px] text-black focus:outline-neutral-950 border border-neutral-200 shadow-xs"
                    placeholder="Find QR ID"
                    value={manageShortId}
                    onChange={e => { setManageShortId(e.target.value); setManageMessage(""); }}
                    autoComplete="off"
                  />
                  {manageShortId && (
                    <button
                      type="button"
                      className="absolute right-2 inset-y-0 flex items-center text-neutral-400 hover:text-black"
                      onClick={() => { setManageShortId(""); setManageMessage(""); setQrInfo(null); }}
                      tabIndex={-1}
                      aria-label="Clear"
                    >
                      {/* X icon */}
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="6" y1="6" x2="14" y2="14" />
                        <line x1="14" y1="6" x2="6" y2="14" />
                      </svg>
                    </button>
                  )}
                </div>
                <motion.button
                  type="button"
                  onClick={handleGetQRInfo}
                  disabled={findLoading || !manageShortId}
                  whileTap={{ scale: 0.98 }}
                  className="w-[85px] h-[42px] py-2 rounded-lg bg-neutral-100 text-black font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Find
                </motion.button>
              </div>

              {findLoading && (
                <div className="w-full flex justify-center py-12 mt-8">
                  <span className="text-neutral-400 shimmer">Searching...</span>
                </div>
              )}

              {!findLoading && !qrInfo && manageMessage && (
                <div className="w-full flex justify-center py-12 mt-8">
                  <span className="text-neutral-500 flex items-center gap-2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-neutral-500 w-[20px]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 16C16 16 14.5 14 12 14C9.5 14 8 16 8 16M15 9H15.01M9 9H9.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM15.5 9C15.5 9.27614 15.2761 9.5 15 9.5C14.7239 9.5 14.5 9.27614 14.5 9C14.5 8.72386 14.7239 8.5 15 8.5C15.2761 8.5 15.5 8.72386 15.5 9ZM9.5 9C9.5 9.27614 9.27614 9.5 9 9.5C8.72386 9.5 8.5 9.27614 8.5 9C8.5 8.72386 8.72386 8.5 9 8.5C9.27614 8.5 9.5 8.72386 9.5 9Z"
                        stroke="#737373"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    No results found
                  </span>
                </div>
              )}

              {qrInfo && (
                <div className="space-y-3 mt-8 pt-4">
                  
                  
                  <div>
                    <div className="bg-neutral-50 rounded-lg">
                      <div className="relative">
                      <input
                        type="url"
                        className={`w-full rounded-lg px-3 text-sm text-neutral-500 bg-neutral-50 border border-transparent focus:outline-none${showShimmer ? ' shimmer' : ''}`}
                        value={qrInfo.originalUrl}
                        readOnly
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                        Current
                      </span>
                    </div>
                    
                    <input
                      type="url"
                      className={`w-full rounded-lg px-3 py-2 text-black border focus:outline-neutral-950 border shadow-xs ${newUrl && !isValidUrl(newUrl) ? 'border-red-500' : 'border-neutral-200'}`}
                      placeholder="Enter new URL"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                    />
                    {newUrl && !isValidUrl(newUrl) && (
                      <div className="text-red-500 text-sm mt-1">Please enter a valid URL</div>
                    )}
                    </div>
                    
                    {showSuccessAnimation ? (
                      <div className="mt-6 w-full h-[48px] bg-neutral-800 font-semibold text-white rounded-xl flex items-center justify-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                        Destination updated
                      </div>
                    ) : (
                      <motion.button
                      whileTap={{ scale: 0.98 }}
                        onClick={handleUpdateDestination}
                        disabled={updateLoading || !newUrl || (!!newUrl && !isValidUrl(newUrl))}
                        className="mt-6 w-full h-[48px] bg-black font-semibold text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateLoading ? "Updating..." : "Update"}
                      </motion.button>
                    )}
                  </div>
                </div>
              )}

              {manageMessage && qrInfo && !manageMessage.includes("Destination updated") && (
                <div className={`p-3 rounded-lg ${
                  manageMessage.includes("✅") ? "bg-green-100 text-green-800" : 
                  manageMessage.includes("❌") ? "bg-red-100 text-red-800" : 
                  "bg-transparent text-gray-800"
                }`}>
                  {manageMessage}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
