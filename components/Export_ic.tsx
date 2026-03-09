"use client";

import React, { useState, useMemo } from "react";

const MASTER_COLUMNS = [
  "STT No",
  "STT Booked At",
  "Periode",
  "Jenis Kiriman",
  "Shipment ID",
  "Invoice Marketplace",
  "External ID",
  "Client Name",
  "Client Code",
  "Customer Branch Name",
  "Origin",
  "Forward Area Origin",
  "Destination",
  "Forward Area Destination",
  "Product",
  "Commodity Name",
  "Last Status",
  "Source",
  "Sub Source",
  "Mother Account",
  "Customer Code",
  "POD Date",
  "RTS/ RTSHQ Date",
  "Pcs",
  "Volume Weight",
  "Gross Weight",
  "Chargeable Weight",
  "Qty Samsung",
  "Publish Rate/Kg",
  "Publish Rate Cost/Kg",
  "Heavyweight Surcharge Rate",
  "Commodity Surcharge Rate",
  "Forward Rate Origin",
  "Forward Rate Destination",
  "COD Amount",
  "Value Of Goods",
  "Surcharge Rate",
  "Shipping Surcharge",
  "Woodpacking Fee",
  "Woodpacking Revenue",
  "Document Surcharge Rate",
  "Insurance Rate",
  "Total Amount Rate",
  "Total Amount Rate Original",
  "Total Vat",
  "COD Revenue",
  "VAT COD Revenue",
  "Total Cargo",
  "Booking Commission",
  "Insurance Commission",
  "Forward Booking Commission",
  "Booking Return",
  "Booking Return Revert",
  "Cargo Category",
  "Route Type",
  "First AWB Number",
  "Last AWB Number",
  "Lag Route",
  "Lag Moda",
  "Client Payment Method",
  "Invoice Number",
  "SO Number",
  "Delivered by",
  "Remarks",
  "Source Group",
  "Booking ID Additional",
  "Client Category",
  "PublishRateFeeFixed",
];

const LOCKED_COLUMNS = ["STT No"];

export default function ExportICModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [available, setAvailable] = useState(
    MASTER_COLUMNS.filter((c) => !LOCKED_COLUMNS.includes(c)),
  );
  const [selected, setSelected] = useState(LOCKED_COLUMNS);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    origin: "",
    destination: "",
    sttList: "",
  });
  const [part, setPart] = useState(1);

  const filteredAvailable = useMemo(() => {
    return available.filter((col) =>
      col.toLowerCase().includes(search.toLowerCase()),
    );
  }, [available, search]);

  if (!isOpen) return null;

  const moveToSelected = (col: string) => {
    setAvailable((prev) => prev.filter((c) => c !== col));
    const newSelected = [...selected, col];
    setSelected(MASTER_COLUMNS.filter((c) => newSelected.includes(c)));
  };

  const moveToAvailable = (col: string) => {
    if (LOCKED_COLUMNS.includes(col)) return;
    setSelected((prev) => prev.filter((c) => c !== col));
    const newAvailable = [...available, col];
    setAvailable(
      MASTER_COLUMNS.filter(
        (c) => newAvailable.includes(c) && !LOCKED_COLUMNS.includes(c),
      ),
    );
  };

  const handleDownload = () => {
    const baseUrl = `http://${window.location.hostname}:8080`;
    const params = new URLSearchParams({
      start_date: filters.startDate,
      end_date: filters.endDate,
      origin: filters.origin,
      destination: filters.destination,
      stt_list: filters.sttList
        .split(/[\n, \t]+/)
        .filter((s) => s)
        .join(","),
      columns: selected.join("|"),
      part: part.toString(),
    });
    window.open(
      `${baseUrl}/export/master/ic/csv?${params.toString()}`,
      "_blank",
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              IC Data Extraction
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

        {/* BODY */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0">
          {/* COLUMN 1: FILTERS */}
          <div className="col-span-3 border-r border-gray-100 p-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
            <h3 className="text-xs font-black uppercase text-gray-400 border-b pb-2">
              1. Filters
            </h3>

            <div className="space-y-4">
              {/* DATE RANGE */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Date Range
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black"
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
              </div>

              {/* ORIGIN & DESTINATION (NEW) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Origin
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CGK"
                    value={filters.origin}
                    onChange={(e) =>
                      setFilters({ ...filters, origin: e.target.value })
                    }
                    className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black uppercase placeholder:normal-case"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Destination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUB"
                    value={filters.destination}
                    onChange={(e) =>
                      setFilters({ ...filters, destination: e.target.value })
                    }
                    className="w-full bg-gray-100 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-black uppercase placeholder:normal-case"
                  />
                </div>
              </div>

              {/* PARTITION */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Partition
                </label>
                <select
                  value={part}
                  onChange={(e) => setPart(Number(e.target.value))}
                  className="w-full border border-black px-4 py-3 rounded-xl text-xs font-black outline-none bg-white"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      PART {i + 1} (900K Rows)
                    </option>
                  ))}
                </select>
              </div>

              {/* MASS STT */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Mass STT
                </label>
                <textarea
                  placeholder="Paste STT No..."
                  value={filters.sttList}
                  onChange={(e) =>
                    setFilters({ ...filters, sttList: e.target.value })
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

          {/* COLUMN 2: AVAILABLE */}
          <div className="col-span-4 bg-gray-50/50 p-8 flex flex-col gap-4 overflow-hidden border-r border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-black">
                2. Available
              </h3>
              <button
                onClick={() => {
                  setSelected(MASTER_COLUMNS);
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

          {/* COLUMN 3: SELECTED */}
          <div className="col-span-5 bg-black p-8 flex flex-col gap-4 overflow-hidden relative">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-gray-400">
                3. Selected
              </h3>
              <button
                onClick={() => {
                  setSelected(LOCKED_COLUMNS);
                  setAvailable(
                    MASTER_COLUMNS.filter((c) => !LOCKED_COLUMNS.includes(c)),
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
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    LOCKED_COLUMNS.includes(col)
                      ? "bg-white/10 border-white/20 cursor-default"
                      : "bg-white/5 border-white/10 cursor-pointer hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-tight ${
                      LOCKED_COLUMNS.includes(col)
                        ? "text-yellow-400"
                        : "text-white"
                    }`}
                  >
                    {col} {LOCKED_COLUMNS.includes(col) && "🔒"}
                  </span>
                  {!LOCKED_COLUMNS.includes(col) && (
                    <span className="text-red-500 font-bold text-xs">✕</span>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 left-8 right-8 bg-white/5 backdrop-blur-md p-2 rounded-lg border border-white/10 text-center">
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                {selected.length} Columns Selected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
