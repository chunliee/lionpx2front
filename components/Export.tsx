"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MASTER_COLUMNS_MAP, LOCKED_MAP } from "../constant/Columns";

interface ExportUniversalModalProps {
  type: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportUniversalModal({
  type,
  isOpen,
  onClose,
}: ExportUniversalModalProps) {
  const currentType = type || "ic";

  // LOGIC TAMPILAN FILTER BERDASARKAN TIPE MASTER
  const hasOrigin = ["ic", "mt", "cm", "ms"].includes(currentType);
  const hasDestination = ["ic", "mt", "cm", "ms", "dt"].includes(currentType);
  const hasCargo = ["ic", "mt", "ms"].includes(currentType);

  const masterColumns = useMemo(
    () => MASTER_COLUMNS_MAP[currentType] || [],
    [currentType],
  );
  const lockedColumns = useMemo(
    () => LOCKED_MAP[currentType] || ["STT No", "Cargo No"],
    [currentType],
  );

  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    originList: "",
    destinationList: "",
    cargoList: "",
    sttList: "",
    clientCodeList: "",
    customerCodeList: "",
    date: "",
  });

  useEffect(() => {
    if (isOpen) {
      setAvailable(masterColumns.filter((c) => !lockedColumns.includes(c)));
      setSelected(lockedColumns);
      setSearch("");
      setFilters({
        startDate: "",
        endDate: "",
        originList: "",
        destinationList: "",
        cargoList: "",
        sttList: "",
        clientCodeList: "",
        customerCodeList: "",
        date: "",
      });
    }
  }, [currentType, isOpen, masterColumns, lockedColumns]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const baseUrl = `http://${window.location.hostname}:8080`;

    const cleanInput = (raw: string) =>
      raw
        .split(/[\n, \t\r]+/)
        .map((s) => s.trim())
        .filter((s) => s && s.length > 0)
        .join(",");

    const params = new URLSearchParams({
      columns: selected.join("|"),
    });

    // Append Filter Standar
    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);
    if (filters.sttList) params.append("stt_list", cleanInput(filters.sttList));

    // Append Filter khusus IC
    if (currentType === "ic") {
      if (filters.clientCodeList)
        params.append("client_code_list", cleanInput(filters.clientCodeList));
      if (filters.customerCodeList)
        params.append(
          "customer_code_list",
          cleanInput(filters.customerCodeList),
        );
    }

    // Append Filter Spesifik jika tipe mendukung
    if (hasCargo && filters.cargoList)
      params.append("cargo_list", cleanInput(filters.cargoList));
    if (hasOrigin && filters.originList)
      params.append("origin_list", cleanInput(filters.originList));
    if (hasDestination && filters.destinationList)
      params.append("destination_list", cleanInput(filters.destinationList));

    // Khusus Master CM
    if (currentType === "cm" && filters.date)
      params.append("date", filters.date);

    window.open(
      `${baseUrl}/export/master/${currentType}/csv?${params.toString()}`,
      "_blank",
    );
  };

  const filteredAvailable = available.filter((col) =>
    col.toLowerCase().includes(search.toLowerCase()),
  );

  const moveToSelected = (col: string) => {
    setAvailable((prev) => prev.filter((c) => c !== col));
    const newSelected = [...selected, col];
    setSelected(masterColumns.filter((c) => newSelected.includes(c)));
  };

  const moveToAvailable = (col: string) => {
    if (lockedColumns.includes(col)) return;
    setSelected((prev) => prev.filter((c) => c !== col));
    const newAvailable = [...available, col];
    setAvailable(
      masterColumns.filter(
        (c) => newAvailable.includes(c) && !lockedColumns.includes(c),
      ),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-black">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {currentType} Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-all font-bold text-xs"
          >
            ✕ Close
          </button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0">
          {/* SECTION 1: FILTERS */}
          <div className="col-span-3 border-r border-gray-100 p-6 flex flex-col gap-4 overflow-y-auto scrollbar-hide">
            <h3 className="text-xs font-black uppercase text-gray-400 border-b pb-2">
              Filters
            </h3>

            {/* DATE RANGE */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400">
                Date Range
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full bg-gray-100 p-2 rounded-lg text-xs font-bold outline-none mb-1"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full bg-gray-100 p-2 rounded-lg text-xs font-bold outline-none"
              />
            </div>

            {/* CONDITIONAL CLIENT & CUSTOMER CODE FOR IC ONLY */}
            {currentType === "ic" && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Client Code
                  </label>
                  <textarea
                    placeholder=""
                    value={filters.clientCodeList}
                    onChange={(e) =>
                      setFilters({ ...filters, clientCodeList: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Customer Code
                  </label>
                  <textarea
                    placeholder=""
                    value={filters.customerCodeList}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        customerCodeList: e.target.value,
                      })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
              </>
            )}

            {/* ORIGIN LIST */}
            {hasOrigin && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Origin
                </label>
                <textarea
                  value={filters.originList}
                  onChange={(e) =>
                    setFilters({ ...filters, originList: e.target.value })
                  }
                  className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            )}

            {/* DESTINATION LIST */}
            {hasDestination && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Destination
                </label>
                <textarea
                  value={filters.destinationList}
                  onChange={(e) =>
                    setFilters({ ...filters, destinationList: e.target.value })
                  }
                  className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            )}

            {/* STT LIST */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400">
                STT
              </label>
              <textarea
                value={filters.sttList}
                onChange={(e) =>
                  setFilters({ ...filters, sttList: e.target.value })
                }
                className="w-full h-24 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
              />
            </div>

            {/* CARGO LIST */}
            {hasCargo && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Cargo No
                </label>
                <textarea
                  value={filters.cargoList}
                  onChange={(e) =>
                    setFilters({ ...filters, cargoList: e.target.value })
                  }
                  className="w-full h-24 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            )}

            <button
              onClick={handleDownload}
              className="mt-auto bg-black text-white py-4 rounded-xl font-black uppercase text-xs hover:bg-gray-800 transition-all shadow-lg active:scale-95"
            >
              Generate & Download
            </button>
          </div>

          {/* SECTION 2: AVAILABLE */}
          <div className="col-span-4 bg-gray-50/50 p-8 flex flex-col gap-4 overflow-hidden border-r border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-black">
                Select Column
              </h3>
              <button
                onClick={() => {
                  setSelected(masterColumns);
                  setAvailable([]);
                }}
                className="text-[9px] font-black bg-black text-white px-3 py-1 rounded-full uppercase"
              >
                Select All
              </button>
            </div>
            <input
              type="text"
              placeholder="Search column..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold outline-none shadow-sm focus:border-black"
            />
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
              {filteredAvailable.map((col) => (
                <div
                  key={col}
                  onClick={() => moveToSelected(col)}
                  className="group flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 cursor-pointer hover:border-black transition-all shadow-sm"
                >
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    {col}
                  </span>
                  <span className="text-gray-300 group-hover:text-black font-black">
                    +
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: SELECTED */}
          <div className="col-span-5 bg-black p-8 flex flex-col gap-4 overflow-hidden relative">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-gray-400">
                Selected Columns
              </h3>
              <button
                onClick={() => {
                  setSelected(lockedColumns);
                  setAvailable(
                    masterColumns.filter((c) => !lockedColumns.includes(c)),
                  );
                }}
                className="text-[9px] font-black bg-white/10 text-white px-3 py-1 rounded-full uppercase hover:bg-red-600 transition-all"
              >
                Reset
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide pb-12">
              {selected.map((col) => {
                const isLocked = lockedColumns.includes(col);
                return (
                  <div
                    key={col}
                    onClick={() => moveToAvailable(col)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isLocked ? "bg-white/10 border-white/20 cursor-default" : "bg-white/5 border-white/10 cursor-pointer hover:bg-white/10"}`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-tight ${isLocked ? "text-yellow-400" : "text-white"}`}
                    >
                      {col} {isLocked && "🔒"}
                    </span>
                    {!isLocked && (
                      <span className="text-red-500 font-bold text-xs">✕</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
