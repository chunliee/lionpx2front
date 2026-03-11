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
  const [part, setPart] = useState(1);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    origin: "",
    destination: "",
    list: "",
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
        origin: "",
        destination: "",
        list: "",
        date: "",
      });
    }
  }, [currentType, isOpen, masterColumns, lockedColumns]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const baseUrl = `http://${window.location.hostname}:8080`;

    // Mapping Label UI ke Key Database (Cargo No balik ke cargo_no)
    const columnMapping: { [key: string]: string } = {
      "STT No": "stt_no",
      "Cargo No": "cargo_no",
      "Manifest Validation": "manifest_validation",
      "Courier ID": "courier_id",
      "Courier Type": "courier_type",
      "Created At": "created_at",
      Origin: "origin",
      "Dest.": "dest",
      "Dropoff Created At": "dropoff_created_at",
      "Dropoff Konsol ID": "dropoff_konsol_id",
      "Dropoff Location": "dropoff_location",
      "Dropoff Partner Code": "dropoff_partner_code",
      "Dropoff Partner Name": "dropoff_partner_name",
      "Dropoff Partner Type": "dropoff_partner_type",
      "Full Name": "full_name",
      "Pickup Created At": "pickup_created_at",
      "Pickup Konsol ID": "pickup_konsol_id",
      "Pickup Location": "pickup_location",
      "Pickup Parter Code": "pickup_parter_code",
      "Pickup Partner Name": "pickup_partner_name",
      "Pickup Partner Type": "pickup_partner_type",
      "Status Validation": "status_validation",
      "Vehicle Plate": "vehicle_plate",
      "Vehicle Type": "vehicle_type",
      "Sync At": "sync_at",
      "Vendor ID": "vendor_id",
      "Vendor Name": "vendor_name",
      Product: "product",
    };

    const finalColumns = selected.map((col) =>
      currentType === "cm" ? columnMapping[col] || col : col,
    );

    const params = new URLSearchParams({
      start_date: filters.startDate,
      end_date: filters.endDate,
      origin: filters.origin,
      destination: filters.destination,
      columns: finalColumns.join("|"),
      part: part.toString(),
    });

    if (filters.list) {
      const cleanList = filters.list
        .split(/[\n, \t]+/)
        .filter((s) => s)
        .join(",");

      if (currentType === "cm" || currentType === "mt") {
        params.append("cargo_list", cleanList); // Konsisten pakai cargo_list
      } else {
        params.append("stt_list", cleanList);
      }
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {currentType} Data Extraction
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase italic">
              Configure filters and select columns
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-all font-bold text-xs"
          >
            ✕ Close
          </button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0">
          <div className="col-span-3 border-r border-gray-100 p-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
            <h3 className="text-xs font-black uppercase text-gray-400 border-b pb-2">
              1. Filters
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  {currentType === "mt"
                    ? "Cargo Created Range"
                    : currentType === "cm" || currentType === "ls"
                      ? "Created Range"
                      : "Booked Range"}
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black mb-2"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black"
                />
              </div>

              {(currentType === "cm" ||
                currentType === "mt" ||
                currentType === "ic") && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    {currentType === "mt" ? "Cargo Origin City Code" : "Origin"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CGK"
                    value={filters.origin}
                    onChange={(e) =>
                      setFilters({ ...filters, origin: e.target.value })
                    }
                    className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black uppercase"
                  />
                </div>
              )}

              {(currentType === "dt" ||
                currentType === "mt" ||
                currentType === "ic") && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    {currentType === "mt"
                      ? "Cargo Destination City Code"
                      : "Destination"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUB"
                    value={filters.destination}
                    onChange={(e) =>
                      setFilters({ ...filters, destination: e.target.value })
                    }
                    className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black uppercase"
                  />
                </div>
              )}

              {currentType === "cm" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Date (Specific)
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={filters.date}
                    onChange={(e) =>
                      setFilters({ ...filters, date: e.target.value })
                    }
                    className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Mass{" "}
                  {currentType === "mt" || currentType === "cm"
                    ? "Cargo No"
                    : "STT No"}
                </label>
                <textarea
                  placeholder={`Paste ${currentType === "mt" || currentType === "cm" ? "Cargo No" : "STT No"}...`}
                  value={filters.list}
                  onChange={(e) =>
                    setFilters({ ...filters, list: e.target.value })
                  }
                  className="w-full h-32 bg-gray-100 p-4 rounded-xl text-[10px] font-mono outline-none focus:border-black resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="mt-auto bg-black text-white py-4 rounded-xl font-black uppercase text-xs hover:bg-gray-800 transition-all shadow-lg active:scale-95"
            >
              Download CSV
            </button>
          </div>

          <div className="col-span-4 bg-gray-50/50 p-8 flex flex-col gap-4 overflow-hidden border-r border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-black">
                2. Available
              </h3>
              <button
                onClick={() => {
                  setSelected(masterColumns);
                  setAvailable([]);
                }}
                className="text-[9px] font-black bg-black text-white px-3 py-1 rounded-full uppercase"
              >
                All
              </button>
            </div>
            <input
              type="text"
              placeholder="Search column..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-black shadow-sm"
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

          <div className="col-span-5 bg-black p-8 flex flex-col gap-4 overflow-hidden relative">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-gray-400">
                3. Selected
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
              {selected.map((col) => (
                <div
                  key={col}
                  onClick={() => moveToAvailable(col)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${lockedColumns.includes(col) ? "bg-white/10 border-white/20 cursor-default" : "bg-white/5 border-white/10 cursor-pointer hover:bg-white/10"}`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-tight ${lockedColumns.includes(col) ? "text-yellow-400" : "text-white"}`}
                  >
                    {col} {lockedColumns.includes(col) && "🔒"}
                  </span>
                  {!lockedColumns.includes(col) && (
                    <span className="text-red-500 font-bold text-xs">✕</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
