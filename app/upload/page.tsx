"use client";

import React, { useState, useEffect, useCallback } from "react";
import ExportMasterModal from "@/components/Modal";
import { useRouter } from "next/navigation";

// --- KONFIGURASI DATA ---
const dataContent: Record<string, string[]> = {
  master: ["mn", "ic", "ls", "bc", "mr", "rf", "rt", "dt", "mt", "cm", "ms"],
  tbs: [
    "kof",
    "kif",
    "sof",
    "sif",
    "pof",
    "def",
    "fro",
    "frd",
    "tuc",
    "stt",
    "kpf",
    "kdf",
  ],
  data: [
    "kof",
    "kif",
    "sof",
    "sif",
    "pof",
    "def",
    "fro",
    "frd",
    "tuc",
    "stt",
    "kpf",
    "kdf",
  ],
};

const labelMapping: Record<string, Record<string, string>> = {
  master: {
    mn: "Master | ID Mitra (MN)",
    ic: "Master | Detail STT (M.IC)",
    ls: "Master | Last Status STT (LS)",
    bc: "Master | Berat STT Corporate (BC)",
    mr: "Master | Routing Transportation & Area (MR)",
    rf: "Master | Rate Forward Area (RF)",
    rt: "Master | Rate Trucking (RT)",
    dt: "Master | Delivery Tiering Policy (DTPOL) (DT)",
    cm: "Master | Detail Manifest Cargo (CM)",
    mt: "Master | Manifest Cargo (MT)  ",
    ms: "Master | Outgoing Shipment Report (MS)",
  },
  tbs: {
    kof: "TBS | Konsolidator Outbound Fee",
    kif: "TBS | Konsolidator Inbound Fee",
    sof: "TBS | Subkonsolidator Outbound Fee",
    sif: "TBS | Subkonsolidator Inbound Fee",
    pof: "TBS | Pick Up Fee",
    def: "TBS | Delivery Fee",
    fro: "TBS | Forward Origin Fee",
    frd: "TBS | Forward Destination Fee",
    tuc: "TBS | Trucking Fee (TUC)",
    stt: "TBS | Trucking Fee (STT)",
    kpf: "TBS | KVP Pick Up Fee",
    kdf: "TBS | KVP Delivery Fee",
  },
  data: {
    kof: "Tagihan | Konsolidator Outbound Fee",
    kif: "Tagihan | Konsolidator Inbound Fee",
    sof: "Tagihan | Subkonsolidator Outbound Fee",
    sif: "Tagihan | Subkonsolidator Inbound Fee",
    pof: "Tagihan | Pick Up Fee",
    def: "Tagihan | Delivery Fee",
    fro: "Tagihan | Forward Origin Fee",
    frd: "Tagihan | Forward Destination Fee",
    tuc: "Tagihan | Trucking Fee (TUC)",
    stt: "Tagihan | Trucking Fee (STT)",
    kpf: "Tagihan | KVP Pick Up Fee",
    kdf: "Tagihan | KVP Delivery Fee",
  },
};
// Interface untuk State UI
interface ActiveJob {
  jobId: string;
  itemName: string;
  progress: number;
  status: string;
  total: number;
  percentage: number;
  new_records: number; // Mapping dari new_records_count
  updated_records: number; // Mapping dari updated_records_count
  skipped_records: number; // Mapping dari skipped_records_count
  type?: string;
  category?: string;
}

// Interface sesuai JSON API yang kamu kasih
interface ServerJobResponse {
  _id: string; // dari /jobs/active
  jobId?: string; // jaga-jaga jika /jobs/:id pakai key ini
  file_name: string;
  new_records: number; // Pakai nama asli dari JSON kamu
  updated_records: number; // Pakai nama asli dari JSON kamu
  skipped_records: number; // Pakai nama asli dari JSON kamu
  percentage: number;
  progress: number;
  status: string;
  total: number;
  type: string;
  category?: string;
}

interface ItemStats {
  total_all: number;
  total_month: number;
}

// Tambahkan ini di luar komponen atau di bagian interface

const MathRound = (val: number) => Math.round(val);

export default function UploadPage() {
  // const router = useRouter();
  // useEffect(() => {
  //   // Cek auth saat komponen di-mount
  //   const auth = localStorage.getItem("user_auth");

  //   if (!auth) {
  //     router.push("/login"); // Redirect ke login kalau gak ada session
  //   }
  // }, [router]);

  const [activeTab, setActiveTab] = useState("master");

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState("");
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [stats, setStats] = useState<Record<string, ItemStats>>({});
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selected_month") || "";
    }
    return "";
  });

  useEffect(() => {
    if (selectedMonth) {
      localStorage.setItem("selected_month", selectedMonth);
      setValidFrom(`${selectedMonth}-01`);
      setValidUntil(`${selectedMonth}-28`);
    }
  }, [selectedMonth]);

  const baseUrl =
    typeof window !== "undefined"
      ? `http://${window.location.hostname}:8080`
      : "";

  const isMonthEmpty = !selectedMonth || selectedMonth === "";

  const fetchStats = useCallback(async () => {
    if (!selectedMonth) return;
    try {
      const res = await fetch(
        `${baseUrl}/stats/${activeTab}?month=${selectedMonth}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Gagal ambil stats:", err);
    }
  }, [activeTab, selectedMonth, baseUrl]);

  const removeJob = (id: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.jobId !== id));
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Polling logic
  useEffect(() => {
    const jobsToPoll = activeJobs.filter(
      (j) => !["done", "failed", "completed"].includes(j.status),
    );
    if (jobsToPoll.length === 0) return;

    const interval = setInterval(async () => {
      const updatedJobs = await Promise.all(
        activeJobs.map(async (job) => {
          if (["done", "failed", "completed"].includes(job.status)) return job;

          try {
            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;
            const data = await res.json();

            const isFinished =
              data.status === "done" || data.status === "completed";

            // REFRESH STATS: Jika baru saja selesai, update angka di dashboard
            if (isFinished && job.status !== "done") {
              fetchStats();
            }

            return {
              ...job,
              percentage: data.percentage || 0,
              progress: data.progress || 0,
              total: data.total || 0,
              status: isFinished ? "done" : data.status,
              new_records: data.new_records_count || 0,
              updated_records: data.updated_records_count || 0,
              skipped_records: data.skipped_records_count || 0,
            };
          } catch (err) {
            return job;
          }
        }),
      );
      setActiveJobs(updatedJobs);
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobs, baseUrl, fetchStats]);

  // --- FIX: Logic Sinkronisasi Global agar data 'done' tidak hilang ---
  // --- FUNGSI SINKRONISASI GLOBAL ---
  // --- FUNGSI SINKRONISASI GLOBAL (/jobs/active) ---
  const syncActiveJobs = useCallback(async () => {
    if (!baseUrl) return;
    try {
      const res = await fetch(`${baseUrl}/jobs/active`);
      if (!res.ok) return;

      const serverData: any[] = await res.json();

      if (serverData && Array.isArray(serverData)) {
        setActiveJobs((prevJobs) => {
          const newJobsState = [...prevJobs];

          serverData.forEach((sJob) => {
            const mappedJob: ActiveJob = {
              // Gunakan _id atau jobId mana yang ada di JSON
              jobId: sJob._id || sJob.jobId,
              itemName:
                sJob.file_name?.toUpperCase() || sJob.type?.toUpperCase(),
              progress: sJob.progress,
              total: sJob.total,
              percentage: sJob.percentage,
              status: sJob.status,
              // Ambil field sesuai JSON baru kamu
              new_records: sJob.new_records ?? 0,
              updated_records: sJob.updated_records ?? 0,
              skipped_records: sJob.skipped_records ?? 0,
              type: sJob.type,
              category: sJob.category,
            };

            const existingIdx = newJobsState.findIndex(
              (j) => j.jobId === mappedJob.jobId,
            );

            if (existingIdx > -1) {
              const currentStatus = newJobsState[existingIdx].status;
              // Kunci state kalau sudah 'done' agar UI tidak kedip balik ke 0
              if (!["done", "completed"].includes(currentStatus)) {
                newJobsState[existingIdx] = mappedJob;
              }
            } else {
              newJobsState.unshift(mappedJob);
            }
          });

          return newJobsState;
        });
      }
    } catch (err) {
      console.error("Gagal sync global:", err);
    }
  }, [baseUrl]);

  // --- POLLING LOGIC (/jobs/:id) ---
  useEffect(() => {
    const jobsToPoll = activeJobs.filter(
      (j) => !["done", "failed", "completed", "uploading"].includes(j.status),
    );

    if (jobsToPoll.length === 0) return;

    const interval = setInterval(async () => {
      const updatedList = await Promise.all(
        activeJobs.map(async (job) => {
          if (
            ["done", "failed", "completed", "uploading"].includes(job.status)
          ) {
            return job;
          }

          try {
            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;

            const data: ServerJobResponse = await res.json();
            const isFinished =
              data.status === "done" || data.status === "completed";

            if (isFinished && job.status !== "done") {
              fetchStats();
            }

            return {
              ...job,
              progress: data.progress,
              total: data.total,
              percentage: data.percentage,
              status: isFinished ? "done" : data.status,
              // FIX: Mapping ke field yang benar sesuai JSON kamu
              new_records: data.new_records ?? job.new_records,
              updated_records: data.updated_records ?? job.updated_records,
              skipped_records: data.skipped_records ?? job.skipped_records,
            };
          } catch (err) {
            return job;
          }
        }),
      );
      setActiveJobs(updatedList);
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobs, baseUrl, fetchStats]);

  // --- POLLING LOGIC ---
  useEffect(() => {
    // Cari job yang statusnya belum final
    const jobsToPoll = activeJobs.filter(
      (j) => !["done", "failed", "completed", "uploading"].includes(j.status),
    );

    if (jobsToPoll.length === 0) return;

    const interval = setInterval(async () => {
      const updatedList = await Promise.all(
        activeJobs.map(async (job) => {
          // Jika sudah selesai atau sedang proses upload awal, lewati polling
          if (
            ["done", "failed", "completed", "uploading"].includes(job.status)
          ) {
            return job;
          }

          try {
            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;

            const data: ServerJobResponse = await res.json();
            const isFinished =
              data.status === "done" || data.status === "completed";

            if (isFinished && job.status !== "done") {
              fetchStats(); // Update angka dashboard (MN, IC, dll)
            }

            return {
              ...job,
              progress: data.progress,
              total: data.total,
              percentage: data.percentage,
              status: isFinished ? "done" : data.status,
              new_records: data.new_records || 0,
              updated_records: data.updated_records || 0,
              skipped_records: data.skipped_records || 0,
            };
          } catch (err) {
            return job;
          }
        }),
      );
      setActiveJobs(updatedList);
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobs, baseUrl, fetchStats]);
  // Trigger sinkronisasi saat pertama kali load dan interval rutin
  useEffect(() => {
    // Langsung cek pas pertama kali buka
    syncActiveJobs();

    // Cek berkala setiap 3 detik untuk sinkronisasi global
    const globalSyncInterval = setInterval(() => {
      syncActiveJobs();
    }, 3000);

    return () => clearInterval(globalSyncInterval);
  }, [syncActiveJobs]);

  const handleFileUpload = async (item: string) => {
    if (isMonthEmpty) {
      alert("⚠️ Silakan pilih Periode (Bulan) terlebih dahulu.");
      return;
    }

    if (item === "rf") {
      if (!validFrom || !validUntil) {
        alert(
          "⚠️ Untuk Master RF, silakan isi tanggal 'From' dan 'Until' terlebih dahulu.",
        );
        return;
      }
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv, .xlsx";
    input.multiple = activeTab !== "master";

    input.onchange = async (e: any) => {
      const files: File[] = Array.from(e.target.files);
      if (files.length === 0) return;

      if (item === "rf") {
        const fileNames = files.map((f) => f.name).join(", ");
        const confirmMsg = `File: ${fileNames}\nPeriode: ${selectedMonth}\nValid From: ${validFrom}\nValid Until: ${validUntil}\n\n`;
        if (!window.confirm(confirmMsg)) return;
      }

      for (const file of files) {
        // 1. Generate ID Sementara untuk UI (karena ID dari backend belum ada)
        const tempJobId = `temp-${Date.now()}-${file.name}`;

        // 2. OPTIMISTIC UPDATE: Langsung masukkan ke Queue agar label "Uploading" muncul
        setActiveJobs((prev) => [
          {
            jobId: tempJobId,
            itemName: `${file.name.toUpperCase()} ${item === "rf" ? `[${validFrom}]` : ""}`,
            progress: 0,
            status: "uploading", // Beri status khusus agar UI tahu ini sedang proses stream ke server
            total: 0,
            percentage: 0,
          },
          ...prev,
        ]);
        setIsQueueOpen(true);

        const formData = new FormData();
        formData.append("month", selectedMonth);
        formData.append("file", file);
        if (item === "rf") {
          formData.append("valid_from", validFrom);
          formData.append("valid_until", validUntil);
        }

        try {
          const response = await fetch(
            `${baseUrl}/upload/${activeTab}/${item}`,
            {
              method: "POST",
              body: formData,
            },
          );

          const result = await response.json();

          if (!response.ok) {
            alert(
              `⚠️ Error Upload [${item.toUpperCase()}]:\n${result.error || "Gagal mengunggah"}`,
            );
            // Hapus job sementara jika gagal upload
            removeJob(tempJobId);
            continue;
          }

          // 3. SYNC ID: Ganti tempJobId dengan jobId asli dari Backend agar polling berjalan
          if (result.job_id || result.job_ids) {
            const finalJobId =
              result.job_id ||
              (Array.isArray(result.job_ids) ? result.job_ids[0] : null);

            setActiveJobs((prev) =>
              prev.map((j) =>
                j.jobId === tempJobId
                  ? { ...j, jobId: finalJobId, status: "pending" }
                  : j,
              ),
            );
          }
        } catch (error) {
          alert(`⚠️ Koneksi ke server terputus saat upload ${file.name}`);
          removeJob(tempJobId);
        }
      }
    };
    input.click();
  };

  const handleDownloadTemplate = (item: string) => {
    const fileName = `temp_${item.toLowerCase()}.csv`;
    let folder =
      activeTab === "master"
        ? "temp_master"
        : activeTab === "tbs"
          ? "temp_tbs"
          : "temp_data";
    const filePath = `/${folder}/${fileName}`;
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-white font-poppins text-black relative overflow-hidden">
      <aside className="w-64 border-r border-gray-100 p-8 flex flex-col">
        <h2 className="font-bold text-xl mb-10 tracking-tight">Collections</h2>
        <nav className="flex flex-col gap-6">
          {Object.keys(dataContent).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left text-lg capitalize transition-all ${
                activeTab === tab
                  ? "font-bold text-black border-l-4 border-black pl-4"
                  : "text-gray-400 hover:text-gray-600 rounded-2xl py-6 px-3 bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-12">
        <header className="flex justify-between items-end mb-12 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold capitalize">
              {activeTab} Upload List
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase">
              Database Row Tracker Enabled
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              Periode
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`border px-4 py-1.5 text-sm font-bold outline-none transition-all ${
                isMonthEmpty ? "border-red-500 animate-pulse" : "border-black"
              }`}
            />
          </div>
        </header>

        <div
          className={`max-w-3xl space-y-4 transition-opacity duration-300 ${isMonthEmpty ? "opacity-40 cursor-not-allowed" : "opacity-100"}`}
        >
          {dataContent[activeTab].map((item) => (
            <div
              key={item}
              className="group flex flex-col bg-gray-100 rounded-2xl overflow-hidden border border-transparent hover:border-gray-200 transition-all"
            >
              <div className="flex justify-between items-center p-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span
                      onClick={() => handleFileUpload(item)}
                      className="text-lg font-bold uppercase tracking-tight cursor-pointer"
                    >
                      {/* Logic: Ambil dari [activeTab][item], kalau ga ada balik ke [item] saja */}
                      {labelMapping[activeTab]?.[item] || item}
                    </span>
                    {activeJobs.some(
                      (j) =>
                        j.itemName.includes(item.toUpperCase()) &&
                        j.status !== "done",
                    ) && (
                      <span className="bg-blue-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest text-white animate-pulse">
                        Uploading...
                      </span>
                    )}
                  </div>
                  {item === "rf" && (
                    <div className="flex gap-4 mt-3 p-3 bg-white/50 rounded-lg border border-dashed border-gray-300">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-black uppercase text-gray-400">
                          From
                        </label>
                        <input
                          type="date"
                          value={validFrom}
                          onChange={(e) => setValidFrom(e.target.value)}
                          className="bg-transparent text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-black uppercase text-gray-400">
                          Until
                        </label>
                        <input
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="bg-transparent text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDownloadTemplate(item)}
                    className="bg-black px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-gray-800 transition-all shadow-sm"
                  >
                    Template
                  </button>
                  <div
                    onClick={() => handleFileUpload(item)}
                    className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <i className="ri-add-line text-2xl text-black"></i>
                  </div>
                </div>
              </div>

              <div className="flex border-t border-gray-200 bg-white/50 divide-x divide-gray-200">
                <div className="flex-1 px-6 py-2 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    Total Master Rows
                  </span>
                  <span className="text-xs font-black">
                    {(stats[item]?.total_all || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex-1 px-6 py-2 flex items-center justify-between bg-black/5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    Rows in {selectedMonth || "Month"}
                  </span>
                  <span className="text-xs font-black text-blue-600">
                    {(stats[item]?.total_month || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {activeJobs.length > 0 && (
        <div className="fixed bottom-0 right-8 w-80 bg-white border border-gray-200 shadow-2xl rounded-t-lg overflow-hidden z-50">
          <div
            className="bg-gray-900 text-white p-3 flex justify-between items-center cursor-pointer"
            onClick={() => setIsQueueOpen(!isQueueOpen)}
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeJobs.length} Uploads
            </span>
            <i
              className={
                isQueueOpen ? "ri-arrow-down-s-line" : "ri-arrow-up-s-line"
              }
            ></i>
          </div>
          {isQueueOpen && (
            <div className="max-h-96 overflow-y-auto p-2 space-y-2 bg-white">
              {activeJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="p-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase truncate w-32">
                      {job.itemName}
                    </span>
                    <div className="flex items-center gap-2">
                      {job.status === "done" ? (
                        <i className="ri-checkbox-circle-fill text-green-500"></i>
                      ) : job.status === "failed" ? (
                        <i className="ri-error-warning-fill text-red-500"></i>
                      ) : (
                        <span className="text-[9px] font-mono text-blue-600 font-bold">
                          {job.percentage.toFixed(0)}%
                        </span>
                      )}
                      <button
                        onClick={() => removeJob(job.jobId)}
                        className="hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                      >
                        <i className="ri-close-line text-gray-400 font-bold"></i>
                      </button>
                    </div>
                  </div>

                  {job.status === "done" ? (
                    <div className="mt-2 flex gap-1 animate-in slide-in-from-left duration-500">
                      <div className="flex-1 bg-gray-100 rounded-xl p-2 flex flex-col items-center justify-center border border-gray-200">
                        <div className="flex gap-2 w-full">
                          {/* 1. SELALU MUNCUL: TOTAL */}
                          <div className="flex-1 bg-white rounded-xl p-2 flex flex-col items-center justify-center border border-gray-200 shadow-sm">
                            <span className="text-[8px] font-black text-gray-400 uppercase">
                              Total
                            </span>
                            <span className="text-[10px] font-black text-black">
                              {job.total || 0}
                            </span>
                          </div>

                          {/* 2. MUNCUL JIKA ADA NEW */}
                          {job.new_records > 0 && (
                            <div className="flex-1 bg-green-50 rounded-xl p-2 flex flex-col items-center justify-center border border-green-200">
                              <span className="text-[8px] font-black text-green-600 uppercase">
                                New Records
                              </span>
                              <span className="text-[10px] font-black text-green-700">
                                {job.new_records}
                              </span>
                            </div>
                          )}

                          {/* 3. MUNCUL JIKA ADA UPDATED */}
                          {job.updated_records > 0 && (
                            <div className="flex-1 bg-blue-50 rounded-xl p-2 flex flex-col items-center justify-center border border-blue-200">
                              <span className="text-[8px] font-black text-blue-600 uppercase">
                                Updated
                              </span>
                              <span className="text-[10px] font-black text-blue-700">
                                {job.updated_records}
                              </span>
                            </div>
                          )}

                          {/* 4. MUNCUL JIKA SKIPPED ADA DAN (NEW & UPDATED KOSONG) 
      Atau hapus kondisi kedua jika ingin Skipped selalu muncul saat > 0 */}
                          {job.skipped_records > 0 &&
                            job.new_records === 0 &&
                            job.updated_records === 0 && (
                              <div className="flex-1 bg-gray-50 rounded-xl p-2 flex flex-col items-center justify-center border border-gray-200">
                                <span className="text-[8px] font-black text-gray-400 uppercase">
                                  Skipped
                                </span>
                                <span className="text-[10px] font-black text-gray-600">
                                  {job.skipped_records}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all duration-300 ${job.status === "failed" ? "bg-red-500" : "bg-blue-600"}`}
                        style={{ width: `${job.percentage}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ExportMasterModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        month={selectedMonth}
        jobType={exportType}
      />
    </div>
  );
}
