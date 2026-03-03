"use client";

import React, { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  jobType: string;
}

export default function ExportMasterModal({
  isOpen,
  onClose,
  month,
  jobType,
}: Props) {
  const [availableCols, setAvailableCols] = useState<string[]>([]);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Deteksi hostname otomatis untuk API
  const baseUrl =
    typeof window !== "undefined"
      ? `http://${window.location.hostname}:8080`
      : "";

  useEffect(() => {
    if (isOpen && jobType) {
      setLoading(true);
      fetch(`${baseUrl}/engine/columns?type=${jobType}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.columns) {
            // Urutkan abjad & bersihkan dari yang sudah terpilih
            setAvailableCols(data.columns.sort());
            setSelectedCols([]);
          }
        })
        .catch(() => setAvailableCols(["error_loading_columns"]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, jobType, baseUrl]);

  const handleExport = async () => {
    if (selectedCols.length === 0) return;
    setIsExporting(true);
    try {
      const response = await fetch(`${baseUrl}/export/custom-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, type: jobType, columns: selectedCols }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EXPORT_${jobType}_${month}.csv`;
      a.click();
    } catch (err) {
      alert("Gagal mendownload CSV");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-['100'] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm font-poppins">
      <div className="bg-white w-full max-w-4xl shadow-2xl rounded-['2rem'] flex flex-col h-[85vh] overflow-hidden border border-gray-100">
        {/* HEADER */}
        <div className="p-8 flex justify-between items-center border-b border-gray-50">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tighter">
              Export {jobType}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              {month}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden grid grid-cols-2">
          {/* KIRI: AVAILABLE */}
          <div className="p-6 overflow-y-auto border-r border-gray-50 bg-gray-50/20">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Available Fields
              </span>
              <button
                onClick={() => {
                  setSelectedCols([...selectedCols, ...availableCols]);
                  setAvailableCols([]);
                }}
                className="text-[9px] font-bold uppercase hover:underline"
              >
                Select All
              </button>
            </div>

            {loading ? (
              <div className="p-4 text-xs font-bold animate-pulse">
                Fetching columns...
              </div>
            ) : (
              availableCols.map((col) => (
                <div
                  key={col}
                  onClick={() => {
                    setSelectedCols([...selectedCols, col]);
                    setAvailableCols(availableCols.filter((c) => c !== col));
                  }}
                  className="group flex justify-between items-center bg-gray-100 p-4 rounded-2xl mb-2 cursor-pointer hover:bg-black hover:text-white transition-all"
                >
                  <span className="text-[11px] font-bold uppercase truncate">
                    {col.replace(/_/g, " ")}
                  </span>
                  <i className="ri-add-line opacity-0 group-hover:opacity-100 font-bold"></i>
                </div>
              ))
            )}
          </div>

          {/* KANAN: SELECTED */}
          <div className="p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-black uppercase tracking-widest">
                Selected ({selectedCols.length})
              </span>
              <button
                onClick={() => {
                  setAvailableCols([...availableCols, ...selectedCols].sort());
                  setSelectedCols([]);
                }}
                className="text-[9px] font-bold uppercase text-red-500 hover:underline"
              >
                Clear
              </button>
            </div>

            {selectedCols.map((col) => (
              <div
                key={col}
                onClick={() => {
                  setAvailableCols([...availableCols, col].sort());
                  setSelectedCols(selectedCols.filter((c) => c !== col));
                }}
                className="flex justify-between items-center bg-black text-white p-4 rounded-2xl mb-2 cursor-pointer hover:bg-red-600 transition-all shadow-lg shadow-black/5"
              >
                <span className="text-[11px] font-bold uppercase truncate">
                  {col.replace(/_/g, " ")}
                </span>
                <i className="ri-subtract-line font-bold"></i>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 border-t border-gray-50 flex justify-end">
          <button
            onClick={handleExport}
            disabled={selectedCols.length === 0 || isExporting}
            className={`px-12 py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.2em] transition-all shadow-xl ${
              isExporting
                ? "bg-gray-100 text-gray-400"
                : "bg-black text-white hover:scale-105 active:scale-95 shadow-black/10"
            }`}
          >
            {isExporting ? "Processing..." : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
