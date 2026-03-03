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

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`http://localhost:8080/engine/columns?type=${jobType}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.columns) {
            setAvailableCols(data.columns.sort());
            setSelectedCols([]);
          }
        })
        .catch((err) => console.error("❌ Fetch Error:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, jobType]);

  // PINDAHKAN SEMUA KE KANAN
  const handleSelectAll = () => {
    setSelectedCols([...selectedCols, ...availableCols].sort());
    setAvailableCols([]);
  };

  // PINDAHKAN SEMUA KE KIRI (UNSELECT ALL)
  const handleUnselectAll = () => {
    setAvailableCols([...availableCols, ...selectedCols].sort());
    setSelectedCols([]);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        "http://localhost:8080/export/custom-master",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month, type: jobType, columns: selectedCols }),
        },
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EXPORT_${jobType}_${month}.csv`;
      a.click();
    } catch (err) {
      alert("Gagal export");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-['999'] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-['2rem'] shadow-2xl flex flex-col h-[80vh] overflow-hidden">
        {/* HEADER */}
        <div className="p-8 border-b flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
              Export {jobType}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {month}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-black hover:text-white transition-all font-bold"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden grid grid-cols-2">
          {/* KOLOM KIRI (AVAILABLE) */}
          <div className="p-6 overflow-y-auto border-r bg-gray-50/50">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Available Fields
              </p>
              {availableCols.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-[10px] font-black text-black underline uppercase hover:text-blue-600 transition-colors"
                >
                  Select All
                </button>
              )}
            </div>

            {loading ? (
              <p className="text-[10px] font-bold uppercase animate-pulse">
                Loading Fields...
              </p>
            ) : (
              availableCols.map((col) => (
                <div
                  key={col}
                  onClick={() => {
                    setSelectedCols([...selectedCols, col].sort());
                    setAvailableCols(availableCols.filter((c) => c !== col));
                  }}
                  className="p-4 bg-white mb-2 rounded-2xl border border-gray-100 cursor-pointer hover:border-black transition-all font-bold text-[11px] uppercase flex justify-between items-center group"
                >
                  <span>{col.replace(/_/g, " ")}</span>
                  <span className="text-gray-300 group-hover:text-black">
                    +
                  </span>
                </div>
              ))
            )}
          </div>

          {/* KOLOM KANAN (SELECTED) */}
          <div className="p-6 overflow-y-auto bg-white">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Selected ({selectedCols.length})
              </p>
              {selectedCols.length > 0 && (
                <button
                  onClick={handleUnselectAll}
                  className="text-[10px] font-black text-red-500 underline uppercase hover:text-red-700 transition-colors"
                >
                  Unselect All
                </button>
              )}
            </div>

            {selectedCols.map((col) => (
              <div
                key={col}
                onClick={() => {
                  setAvailableCols([...availableCols, col].sort());
                  setSelectedCols(selectedCols.filter((c) => c !== col));
                }}
                className="p-4 bg-black text-white mb-2 rounded-2xl cursor-pointer font-bold text-[11px] uppercase flex justify-between items-center hover:bg-red-600 transition-colors shadow-lg shadow-black/5"
              >
                <span>{col.replace(/_/g, " ")}</span>
                <span>✕</span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 border-t flex justify-end bg-white">
          <button
            onClick={handleExport}
            disabled={selectedCols.length === 0 || isExporting}
            className={`px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
              selectedCols.length === 0 || isExporting
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
            }`}
          >
            {isExporting ? "Processing..." : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
