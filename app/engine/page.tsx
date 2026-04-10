"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// --- KONFIGURASI DATA ---
const labelMapping: Record<string, string> = {
  kof: "Engine | Konsolidator Outbound Fee",
  kif: "Engine | Konsolidator Inbound Fee",
  sof: "Engine | Subkonsolidator Outbound Fee",
  sif: "Engine | Subkonsolidator Inbound Fee",
  pof: "Engine | Pick Up Fee",
  def: "Engine | Delivery Fee",
  fro: "Engine | Forward Origin Fee",
  frd: "Engine | Forward Destination Fee",
  tuc: "Engine | Trucking Fee (TUC)",
  stt: "Engine | Trucking Fee (STT)",
  kpf: "Engine | KVP Pick Up Fee",
  kdf: "Engine | KVP Delivery Fee",
};

const vlookupItems = Object.keys(labelMapping);
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Ditambah 1 karena Januari = 0
  return `${year}-${month}`;
};

interface ActiveJob {
  jobId: string;
  itemName: string;
  displayLabel: string;
  progress: number;
  status: string;
  total: number;
  percentage: number;
  filePaths?: string;
}

export default function ReportPage() {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== "undefined") {
      // Ambil dari localStorage, kalau ga ada baru pakai default bulan sekarang
      return localStorage.getItem("selected_month") || getCurrentMonth();
    }
    return getCurrentMonth();
  });

  // const router = useRouter();

  // useEffect(() => {
  //   // Cek auth saat komponen di-mount
  //   const auth = localStorage.getItem("user_auth");

  //   if (!auth) {
  //     router.push("/login"); // Redirect ke login kalau gak ada session
  //   }
  // }, [router]);

  useEffect(() => {
    if (selectedMonth) {
      localStorage.setItem("selected_month", selectedMonth);
    }
  }, [selectedMonth]);

  const [baseUrl, setBaseUrl] = useState("");
  useEffect(() => {
    setBaseUrl(`http://${window.location.hostname}:8080`);
  }, []);

  // Polling Manager
  useEffect(() => {
    const jobsToPoll = activeJobs.filter(
      (j) => j.status !== "done" && j.status !== "failed",
    );
    if (jobsToPoll.length === 0 || !baseUrl) return;

    const interval = setInterval(async () => {
      try {
        const updatedJobs = await Promise.all(
          activeJobs.map(async (job) => {
            if (job.status === "done" || job.status === "failed") return job;

            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;
            const data = await res.json();

            // Sesuai JSON backend: status "done", path di "file_path"
            return {
              ...job,
              percentage: data.percentage || (data.status === "done" ? 100 : 0),
              progress: data.progress || 0,
              total: data.total_rows || data.total || 0,
              status: data.status,
              filePaths: data.file_path || "",
            };
          }),
        );
        setActiveJobs(updatedJobs);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobs, baseUrl]);

  const handleDownloadPart = async (
    jobId: string,
    partIdx: number,
    itemKey: string,
    displayLabel: string,
  ) => {
    try {
      const response = await fetch(
        `${baseUrl}/engine/${itemKey.toLowerCase()}/download?job_id=${jobId}&part=${partIdx}`,
      );
      if (!response.ok) throw new Error("Download gagal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = displayLabel.replace(/[\s|]+/g, "_");

      // Nama file dinamis: Part 1, Part 2, dst.
      a.href = url;
      a.download = `${safeName}_${selectedMonth}_PART${partIdx + 1}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("⚠️ Gagal mendownload file");
    }
  };

  const handleRunEngine = async (item: string) => {
    const formData = new FormData();
    formData.append("month", selectedMonth);

    try {
      const response = await fetch(`${baseUrl}/engine/${item}/generate`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok && result.job_id) {
        setActiveJobs((prev) => [
          {
            jobId: result.job_id,
            itemName: item,
            displayLabel: labelMapping[item],
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
      alert("⚠️ Backend tidak merespon!");
    }
  };

  const removeJob = (id: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.jobId !== id));
  };

  return (
    <div className="flex min-h-screen bg-white font-poppins text-black relative overflow-hidden">
      {/* MAIN CONTENT */}
      <main className="flex-1 p-12 max-w-4xl mx-auto w-full">
        <header className="flex justify-between items-end mb-12 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              Vlookup Engine
            </h1>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.2em] font-semibold">
              Data Processing Terminal
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
              className="border-2 border-black px-4 py-1.5 text-sm font-bold outline-none rounded-xl"
            />
          </div>
        </header>

        <div className="space-y-4">
          {vlookupItems.map((item) => (
            <div
              key={item}
              className="group flex flex-col bg-gray-100 rounded-2xl overflow-hidden border border-transparent hover:border-gray-200 transition-all shadow-sm"
            >
              <div className="flex justify-between items-center p-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span
                      onClick={() => handleRunEngine(item)}
                      className="text-lg font-bold uppercase tracking-tight cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {labelMapping[item]}
                    </span>
                    {activeJobs.some(
                      (j) => j.itemName === item && j.status !== "done",
                    ) && (
                      <span className="bg-blue-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase text-white animate-pulse">
                        Running...
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-1">
                    Process VLOOKUP for {labelMapping[item]}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    onClick={() => handleRunEngine(item)}
                    className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer transform translate-x-2 group-hover:translate-x-0"
                  >
                    <i className="ri-play-fill text-xl"></i>
                  </div>
                </div>
              </div>
              {/* STATS BAR (Sama UI dengan Upload Master)
              <div className="flex border-t border-gray-200 bg-white/50 divide-x divide-gray-200">
                <div className="flex-1 px-6 py-2.5 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    System Status
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
                    Ready
                  </span>
                </div>
                <div className="flex-1 px-6 py-2.5 flex items-center justify-between bg-black/5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    Active Period
                  </span>
                  <span className="text-[10px] font-black text-blue-600 uppercase">
                    {selectedMonth}
                  </span>
                </div>
              </div> */}
            </div>
          ))}
        </div>
      </main>

      {/* QUEUE POPUP */}
      {activeJobs.length > 0 && (
        <div className="fixed bottom-0 right-8 w-80 bg-white border border-gray-200 shadow-2xl rounded-t-2xl overflow-hidden z-50">
          <div
            className="bg-gray-900 text-white p-4 flex justify-between items-center cursor-pointer"
            onClick={() => setIsQueueOpen(!isQueueOpen)}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {activeJobs.length} Processing Jobs
            </span>
            <i
              className={
                isQueueOpen ? "ri-arrow-down-s-line" : "ri-arrow-up-s-line"
              }
            ></i>
          </div>

          {isQueueOpen && (
            <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-white">
              {activeJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase truncate w-36 text-gray-700">
                      {job.displayLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      {job.status === "done" ? (
                        <i className="ri-checkbox-circle-fill text-green-500 text-xl"></i>
                      ) : (
                        <span className="text-[10px] font-mono text-blue-600 font-bold">
                          {Math.round(job.percentage)}%
                        </span>
                      )}
                      <button
                        onClick={() => removeJob(job.jobId)}
                        className="hover:bg-gray-200 rounded-full p-1 transition-colors"
                      >
                        <i className="ri-close-line text-gray-400"></i>
                      </button>
                    </div>
                  </div>

                  {job.status === "done" ? (
                    <div className="mt-3 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
                      {/* Logika Pecah Part Download Berdasarkan Separator '|' */}
                      {(job.filePaths || "Result")
                        .split("|")
                        .map((_, idx, all) => (
                          <button
                            key={idx}
                            onClick={() =>
                              handleDownloadPart(
                                job.jobId,
                                idx,
                                job.itemName,
                                job.displayLabel,
                              )
                            }
                            className="w-full bg-black text-white py-2.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all shadow-md"
                          >
                            <i className="ri-download-cloud-2-line text-xs"></i>
                            {all.length > 1
                              ? `Download Part ${idx + 1}`
                              : "Download Result"}
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all duration-500"
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
    </div>
  );
}
