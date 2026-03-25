"use client";

import React, { useState, useEffect, useCallback } from "react";
import ExportMasterModal from "@/components/Modal";

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

interface ActiveJob {
  jobId: string;
  itemName: string;
  progress: number;
  status: string;
  total: number;
  percentage: number;
}

interface ItemStats {
  total_all: number;
  total_month: number;
}

export default function UploadPage() {
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

  useEffect(() => {
    if (selectedMonth) {
      setValidFrom(`${selectedMonth}-01`);
      setValidUntil(`${selectedMonth}-28`);
    }
  }, [selectedMonth]);

  // Polling logic
  // Polling logic
  useEffect(() => {
    // Tambahkan "pending" dan "processing" agar tetap melakukan polling selama statusnya itu
    const jobsToPoll = activeJobs.filter(
      (j) => !["done", "failed", "completed"].includes(j.status),
    );
    if (jobsToPoll.length === 0) return;

    const interval = setInterval(async () => {
      const updatedJobs = await Promise.all(
        activeJobs.map(async (job) => {
          // Jika sudah done/failed, jangan request lagi
          if (["done", "failed", "completed"].includes(job.status)) return job;

          try {
            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;
            const data = await res.json();

            // Sync status: Pastikan frontend menganggap "done" sama dengan selesai
            const isFinished =
              data.status === "done" || data.status === "completed";

            if (isFinished) {
              setTimeout(fetchStats, 1000); // Refresh angka total di UI
            }

            return {
              ...job,
              // Gunakan total_rows dari backend jika progress mau akurat
              percentage: data.percentage || 0,
              progress: data.progress || 0,
              total: data.total_rows || 0,
              status: isFinished ? "done" : data.status,
            };
          } catch (err) {
            console.error("Polling error:", err);
            return job;
          }
        }),
      );
      setActiveJobs(updatedJobs);
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobs, baseUrl, fetchStats]);

  // --- LOGIK UPLOAD DENGAN ERROR HANDLING ---
  const handleFileUpload = async (item: string) => {
    // 1. Validasi Periode (Bulan) - Wajib untuk semua
    if (isMonthEmpty) {
      alert("⚠️ Silakan pilih Periode (Bulan) terlebih dahulu.");
      return;
    }

    // 2. Validasi Khusus RF (Tanggal Validitas)
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
    // Master biasanya satu-satu, data/tbs bisa multiple
    input.multiple = activeTab !== "master";

    input.onchange = async (e: any) => {
      const files: File[] = Array.from(e.target.files);
      if (files.length === 0) return;

      // --- POPUP KONFIRMASI KHUSUS RF ---
      if (item === "rf") {
        const fileNames = files.map((f) => f.name).join(", ");
        const confirmMsg =
          `File: ${fileNames}\n` +
          `Periode: ${selectedMonth}\n` +
          `Valid From: ${validFrom}\n` +
          `Valid Until: ${validUntil}\n\n`;

        if (!window.confirm(confirmMsg)) return;
      }

      // --- LOOPING PROSES UPLOAD ---
      for (const file of files) {
        const formData = new FormData();
        formData.append("month", selectedMonth);
        formData.append("file", file);

        // Append parameter tambahan jika RF
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
            const errMsg =
              result.error || result.message || "Gagal mengunggah file";
            alert(`⚠️ Error Upload [${item.toUpperCase()}]:\n${errMsg}`);
            continue;
          }

          // Tambahkan ke Queue Jobs jika berhasil dapet Job ID
          if (result.job_id || result.job_ids) {
            const finalJobId =
              result.job_id ||
              (Array.isArray(result.job_ids) ? result.job_ids[0] : null);

            setActiveJobs((prev) => [
              {
                jobId: finalJobId,
                itemName: `${file.name.toUpperCase()} ${
                  item === "rf" ? `[${validFrom}]` : ""
                }`,
                progress: 0,
                status: "pending",
                total: 0,
                percentage: 0,
              },
              ...prev,
            ]);
            setIsQueueOpen(true);
          }
        } catch (error) {
          alert(`⚠️ Koneksi ke server terputus saat upload ${file.name}`);
          console.error(error);
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
      {/* SIDEBAR */}
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

      {/* MAIN CONTENT */}
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
                  <span
                    onClick={() => handleFileUpload(item)}
                    className="text-2xl font-bold uppercase tracking-tighter cursor-pointer"
                  >
                    {item}
                  </span>
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

              {/* STATS BAR */}
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

      {/* POPUP QUEUE */}
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
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${job.status === "done" ? "bg-green-500" : job.status === "failed" ? "bg-red-500" : "bg-blue-600"}`}
                      style={{ width: `${job.percentage}%` }}
                    ></div>
                  </div>
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
