"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MASTER_COLUMNS_MAP, LOCKED_MAP } from "../constant/Columns";
import Cookies from "js-cookie";

interface ExportUniversalModalProps {
  type: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (jobId: string, label: string) => void;
}

export default function ExportUniversalModalv2({
  type,
  isOpen,
  onClose,
  onSuccess,
}: ExportUniversalModalProps) {
  const currentType = type || "ic";
  const [isGenerating, setIsGenerating] = useState(false);

  // LOGIC TAMPILAN FILTER BERDASARKAN TIPE MASTER
  const hasOrigin = ["ic", "mt", "cm", "ms", "rt"].includes(currentType);
  const hasDestination = ["ic", "mt", "cm", "ms", "dt", "rt"].includes(
    currentType,
  );
  const hasCargo = ["mt", "ms", "cm"].includes(currentType);
  const hasDateRange =
    currentType !== "mn" &&
    currentType !== "mr" &&
    currentType !== "rt" &&
    currentType !== "rf";
  const hasSTT =
    currentType !== "mn" &&
    currentType !== "mt" &&
    currentType !== "mr" &&
    currentType !== "rt" &&
    currentType !== "rf";
  const hasMonthFilter = ["mr", "rt", "rf"].includes(currentType);
  const hasMitraFilter = ["mn", "rt"].includes(currentType);
  const hasProductRoute = currentType === "mr";
  const isBC = currentType === "bc";
  const isRT = currentType === "rt";
  const isRF = currentType === "rf";

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
    mitraCodeList: "",
    tlcList: "",
    kategoriList: "",
    date: "",
    awbList: "",
    month: "",
    productRouteList: "",
    chargeableWeight: "",
    rute: "",
    truck_rate: "",
    typeRate: "",
    districtName: "",
    remarksList: "",
    shipmentList: "",
    externalList: "",
  });
  const [userInfo, setUserInfo] = useState<{
    name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const auth = Cookies.get("user_auth");
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        setUserInfo(parsed); // Simpan seluruh objek user (termasuk name)
      } catch (err) {
        console.error("Gagal parse user data:", err);
      }
    }
  }, []);
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
        mitraCodeList: "",
        tlcList: "",
        kategoriList: "",
        date: "",
        awbList: "",
        month: "",
        productRouteList: "",
        chargeableWeight: "",
        rute: "",
        truck_rate: "",
        typeRate: "",
        districtName: "",
        remarksList: "",
        shipmentList: "",
        externalList: "",
      });
    }
  }, [currentType, isOpen, masterColumns, lockedColumns]);

  if (!isOpen) return null;

  const handleGenerateJob = async () => {
    const baseUrl = `http://${window.location.hostname}:8080`;

    // Helper Pembersihan Data
    const cleanInput = (raw: string) =>
      raw
        .split(/[\n, \t\r]+/)
        .map((s) => s.trim())
        .filter((s) => s && s.length > 0)
        .join(",");

    const cleanInput2 = (raw: string) =>
      raw
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .join("|");

    const params = new URLSearchParams({
      columns: selected.join("|"),
      user: userInfo?.name || "System User",
    });

    // --- LOGIC FILTER (Lengkap sesuai kodemu) ---

    if (isBC) {
      if (filters.sttList) params.append("stt_id", cleanInput(filters.sttList));
      if (filters.chargeableWeight)
        params.append("chargeable_weight", filters.chargeableWeight);
    } else if (isRT) {
      if (filters.tlcList)
        params.append("3lc_list", cleanInput(filters.tlcList));
      if (filters.month) params.append("month", filters.month);
      if (filters.mitraCodeList)
        params.append("mitra_code", cleanInput(filters.mitraCodeList));
      if (filters.rute) params.append("rute", filters.rute.trim());
      // if (filters.truck_rate)
      //   params.append("truck_rate", filters.truck_rate.trim());
    } else if (isRF) {
      if (filters.month) params.append("month", filters.month);
      if (filters.districtName)
        params.append("district_name", cleanInput2(filters.districtName));
      if (filters.typeRate) params.append("type_rate", filters.typeRate);
    } else {
      // Standard STT list untuk tipe lain
      if (hasSTT && filters.sttList)
        params.append("stt_list", cleanInput(filters.sttList));
    }

    // Filter Tanggal
    if (hasDateRange) {
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
    }

    // Filter Master MR
    if (currentType === "mr") {
      if (filters.month) params.append("month", filters.month);
      if (filters.productRouteList) {
        params.append(
          "product_route_list",
          cleanInput(filters.productRouteList),
        );
      }
    }

    // Re-append Filter Standar (Sesuai kodemu yang ada double check)
    if (filters.startDate) params.append("start_date", filters.startDate);
    if (filters.endDate) params.append("end_date", filters.endDate);

    // Append Filter khusus IC
    if (currentType === "ic") {
      if (filters.remarksList)
        params.append("remarks_list", cleanInput(filters.remarksList));
      if (filters.clientCodeList)
        params.append("client_code_list", cleanInput(filters.clientCodeList));
      if (filters.customerCodeList)
        params.append(
          "customer_code_list",
          cleanInput(filters.customerCodeList),
        );
      if (filters.shipmentList)
        params.append("shipment_id_list", cleanInput(filters.shipmentList));
      if (filters.externalList)
        params.append("external_id_list", cleanInput(filters.externalList));
      if (filters.awbList)
        params.append("awb_list", cleanInput(filters.awbList));
    }

    // Append Filter khusus MN
    if (currentType === "mn") {
      if (filters.mitraCodeList)
        params.append("mitra_code_list", cleanInput(filters.mitraCodeList));
      if (filters.tlcList)
        params.append("3lc_list", cleanInput(filters.tlcList));
      if (filters.kategoriList)
        params.append("kategori_list", cleanInput(filters.kategoriList));
    }

    // Append Filter Spesifik Cargo & Origin/Destination
    if (hasCargo && filters.cargoList)
      params.append("cargo_list", cleanInput(filters.cargoList));
    if (hasOrigin && filters.originList)
      params.append("origin_list", cleanInput(filters.originList));
    if (hasDestination && filters.destinationList)
      params.append("destination_list", cleanInput(filters.destinationList));

    // Khusus Master CM
    if (currentType === "cm" && filters.date)
      params.append("date", filters.date);

    // --- EKSEKUSI API CALL ---
    try {
      console.log("Params to send:", params.toString());
      console.log("FINAL PARAMS:", params.toString());
      const response = await fetch(
        `${baseUrl}/exportv2/master/${currentType}/csv?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();

      // PERBAIKAN DI SINI:
      // Ambil job_id (dari backend Go kamu) atau _id (sebagai fallback)
      const finalJobId = result.job_id || result._id;

      if (finalJobId) {
        // Teruskan ke function onSuccess di Page utama
        onSuccess(finalJobId, `${currentType.toUpperCase()} Export`);
        onClose();
      } else {
        console.error("Response dari server:", result);
        alert("Gagal: ID Pekerjaan tidak ditemukan dalam respon server.");
      }
    } catch (error) {
      console.error("Generate Export Error:", error);
      alert("Terjadi kesalahan saat menghubungi server.");
    }
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
            {/* Masukkan ini di dalam Section 1: FILTERS, cari bagian isRT atau hasMitraFilter */}
            {isRT && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Rute
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={filters.rute}
                    onChange={(e) =>
                      setFilters({ ...filters, rute: e.target.value })
                    }
                    className="w-full h-10 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>

                {/* <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Truck Rate
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={filters.truck_rate}
                    onChange={(e) =>
                      setFilters({ ...filters, truck_rate: e.target.value })
                    }
                    className="w-full h-10 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div> */}
              </>
            )}
            {hasMonthFilter && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Target Month
                </label>
                <input
                  type="month" // Input tipe month sangat cocok untuk format 2026-03
                  value={filters.month}
                  onChange={(e) =>
                    setFilters({ ...filters, month: e.target.value })
                  }
                  className="w-full bg-gray-100 p-2 rounded-lg text-xs font-bold outline-none"
                />
              </div>
            )}

            {hasProductRoute && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Product Route List
                </label>
                <textarea
                  placeholder=""
                  value={filters.productRouteList}
                  onChange={(e) =>
                    setFilters({ ...filters, productRouteList: e.target.value })
                  }
                  className="w-full h-24 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            )}

            {/* DATE RANGE */}
            {hasDateRange && (
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
            )}
            {isRF && (
              <>
                <div className="space-y-1">
                  {/* <label className="text-[9px] font-black uppercase text-gray-400">
                    District Name
                  </label>
                  <input
                    type="text"
                    value={filters.districtName || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, districtName: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                    placeholder=""
                  /> */}
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    District Name
                  </label>
                  <textarea
                    value={filters.districtName || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, districtName: e.target.value })
                    }
                    className="w-full h-24 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Type Rate
                  </label>
                  <select
                    value={filters.typeRate || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, typeRate: e.target.value })
                    }
                    className="w-full h-10 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  >
                    <option value="">All Type</option>
                    <option value="Reguler">Reguler</option>
                    <option value="SPX">SPX</option>
                  </select>
                </div>
              </>
            )}
            {/* {isBC && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">
                  Chargeable Weight
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={filters.chargeableWeight}
                  onChange={(e) =>
                    setFilters({ ...filters, chargeableWeight: e.target.value })
                  }
                  className="w-full bg-gray-100 p-2 rounded-lg text-xs font-bold outline-none"
                />
              </div>
            )} */}
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
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    AWB Number (First/Last)
                  </label>
                  <textarea
                    placeholder=""
                    value={filters.awbList}
                    onChange={(e) =>
                      setFilters({ ...filters, awbList: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Remarks
                  </label>
                  <textarea
                    placeholder=""
                    value={filters.remarksList}
                    onChange={(e) =>
                      setFilters({ ...filters, remarksList: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Shipment ID
                  </label>
                  <textarea
                    placeholder="Paste Shipment IDs..."
                    value={filters.shipmentList}
                    onChange={(e) =>
                      setFilters({ ...filters, shipmentList: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    External ID
                  </label>
                  <textarea
                    placeholder="Paste External IDs..."
                    value={filters.externalList}
                    onChange={(e) =>
                      setFilters({ ...filters, externalList: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
              </>
            )}

            {/* CONDITIONAL FOR MN ONLY */}
            {/* CONDITIONAL FOR MN & RT */}
            {(currentType === "mn" || currentType === "rt") && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    Mitra Code
                  </label>
                  <textarea
                    placeholder=""
                    value={filters.mitraCodeList}
                    onChange={(e) =>
                      setFilters({ ...filters, mitraCodeList: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">
                    3LC
                  </label>
                  <textarea
                    placeholder=""
                    value={filters.tlcList}
                    onChange={(e) =>
                      setFilters({ ...filters, tlcList: e.target.value })
                    }
                    className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>

                {/* Kategori dipisah kondisinya agar RT tidak ikut */}
                {currentType === "mn" && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400">
                      Kategori
                    </label>
                    <textarea
                      placeholder=""
                      value={filters.kategoriList}
                      onChange={(e) =>
                        setFilters({ ...filters, kategoriList: e.target.value })
                      }
                      className="w-full h-16 bg-gray-100 p-3 rounded-lg text-[10px] font-mono outline-none focus:ring-1 focus:ring-black resize-none"
                    />
                  </div>
                )}
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

            {/* STT LIST - Sekarang kondisional */}
            {hasSTT && (
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
            )}

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
              onClick={handleGenerateJob}
              className="mt-auto bg-black text-white py-4 rounded-xl font-black uppercase text-xs hover:bg-gray-800 transition-all shadow-lg active:scale-95"
            >
              Generate
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
