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
        setMessage("QR code found!");
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
            className="flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-lg transition-all duration-200 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 text-black hover:bg-gray-200 text-sm"
            title="Back to QR Generator"
          >
           <svg
             xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24"
             strokeWidth={2}
             stroke="currentColor"
             className="size-6"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
             />
           </svg>


          </button>
        </div>
        <h1 className="text-2xl font-bold text-left mb-2 tracking-tight">Update the destination link for any QR code you’ve already created</h1>
        
        <div className="space-y-4">
          <div>
            <label className="font-medium text-gray-700 tracking-normal">Enter QR ID</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black bg-[#fafafa]"
                placeholder="e.g., 8Q4G79E7"
                value={shortId}
                onChange={e => setShortId(e.target.value)}
              />
              <button
                onClick={handleGetQRInfo}
                disabled={loading || !shortId}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Find"}
              </button>
            </div>
          </div>

          {qrInfo && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Current QR Code Info:</h3>
              <p><strong>Short ID:</strong> {qrInfo.shortId}</p>
              <p><strong>Current Destination:</strong> {qrInfo.originalUrl}</p>
              <p><strong>Redirect URL:</strong> {qrInfo.redirectUrl}</p>
              <p><strong>Created:</strong> {new Date(qrInfo.createdAt).toLocaleDateString()}</p>
            </div>
          )}

          {qrInfo && (
            <div>
              <label className="font-medium text-gray-700 tracking-normal">Update Destination URL</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="url"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black bg-[#fafafa]"
                  placeholder="https://new-destination.com"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                />
                <button
                  onClick={handleUpdateDestination}
                  disabled={loading || !newUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes("✅") ? "bg-green-100 text-green-800" : 
              message.includes("❌") ? "bg-red-100 text-red-800" : 
              "bg-blue-100 text-blue-800"
            }`}>
              {message}
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
} 