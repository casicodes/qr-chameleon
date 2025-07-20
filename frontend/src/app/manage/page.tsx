"use client";
import { useState } from "react";

export default function ManagePage() {
  const [shortId, setShortId] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [qrInfo, setQrInfo] = useState<any>(null);

  const handleGetQRInfo = async () => {
    if (!shortId) return;
    
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`http://localhost:4000/api/qr/${shortId}`);
      if (res.ok) {
        const data = await res.json();
        setQrInfo(data);
       
      } else {
        setMessage("QR code not found. Please check the short ID.");
        setQrInfo(null);
      }
    } catch (err) {
      setMessage("Error fetching QR code info.");
      setQrInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDestination = async () => {
    if (!shortId || !newUrl) return;
    
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`http://localhost:4000/api/qr/${shortId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination_url: newUrl })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage("✅ Destination updated successfully!");
        setQrInfo(data);
        setNewUrl("");
      } else {
        const errorData = await res.json();
        setMessage(`❌ Error: ${errorData.error}`);
      }
    } catch (err) {
      setMessage("Error updating destination.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
      <div className="mt-4 flex justify-start">
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 py-2 px-2 rounded-lg transition-all duration-200 ease-out cursor-pointer text-black hover:bg-gray-100 text-sm"
            title="Back to QR Generator"
          >
           <svg
             xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24"
             strokeWidth={2}
             stroke="currentColor"
             className="size-5"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
             />
           </svg>


          </button>
        </div>
        <div>
        <h1 className="text-2xl font-bold text-left tracking-tight mb-1">Find QRed</h1>
        <p className="text-gray-500 leading-snug">Enter the ID you saved to change its destination link.</p>
        </div>
        <div className="space-y-4">
          <div>
            <form onSubmit={e => { e.preventDefault(); handleGetQRInfo(); }}>
              <div className="flex items-center w-full gap-2 mt-1">
                <div className="relative flex-1">
                 
                  <input
                    type="text"
                    className="w-full rounded-lg pl-4 pr-10 h-[42px] text-black focus:outline-neutral-950 border border-neutral-200 shadow-xs"
                    placeholder="Find QR ID"
                    value={shortId}
                    onChange={e => setShortId(e.target.value)}
                    autoComplete="off"
                  />
                  {shortId && (
                    <button
                      type="button"
                      className="absolute right-2 inset-y-0 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => { setShortId(""); setMessage(""); }}
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
                <button
                  type="submit"
                  disabled={loading || !shortId}
                  className="w-[85px] h-[42px] py-2 rounded-lg bg-black text-white font-medium hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Find
                </button>
              </div>
            </form>
          </div>

          {!qrInfo && message && (
            <div className="w-full flex justify-center mt-2">
              <span className="text-gray-500 text-lg">No results found</span>
            </div>
          )}

          {qrInfo && (
            <div className="space-y-3 mt-8 pt-4 border-t-[1px]">
              <h3 className="font-semibold">🎉 We've found the QR code.</h3>
             
              <p>Current destination: {qrInfo.originalUrl}</p>
             
              <div>
             
              <div className="flex flex-col gap-4 mt-1">
                <input
                  type="url"
                  className="flex-1 rounded-lg px-3 py-2 text-black bg-[#f1f1f1] border border-transparent focus:outline-none"
                  placeholder="Enter new destination URL"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                />
                <button
                  onClick={handleUpdateDestination}
                  disabled={loading || !newUrl}
                  className="w-full h-[48px] bg-green-600 font-bold text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
            </div>
          )}

         

          {message && qrInfo && (
            <div className={`p-3 rounded-lg ${
              message.includes("✅") ? "bg-green-100 text-green-800" : 
              message.includes("❌") ? "bg-red-100 text-red-800" : 
              "bg-transparent text-gray-800"
            }`}>
              {message}
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
} 