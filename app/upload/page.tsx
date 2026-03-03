"use client";

import React, { useState, useEffect } from "react";
import ExportMasterModal from "@/components/Modal";

const dataContent: Record<string, string[]> = {
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
  master: ["mn", "ic", "ls", "bc", "mr", "rf", "rt", "dt", "mt", "cm"],
};

interface ActiveJob {
  jobId: string;
  itemName: string;
  progress: number;
  status: string;
  total: number;
  percentage: number;
}

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState("data");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState("");
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);

  // Gunakan optional chaining atau check browser env untuk menghindari error SSR
  const baseUrl =
    typeof window !== "undefined"
      ? `http://${window.location.hostname}:8080`
      : "";

  const isMonthEmpty = !selectedMonth || selectedMonth === "";

  // Fungsi Manual Remove Job
  const removeJob = (id: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.jobId !== id));
  };

  // Polling Manager
  useEffect(() => {
    const jobsToPoll = activeJobs.filter(
      (j) =>
        j.status !== "done" &&
        j.status !== "failed" &&
        j.status !== "completed",
    );

    if (jobsToPoll.length === 0) return;

    const interval = setInterval(async () => {
      const updatedJobs = await Promise.all(
        activeJobs.map(async (job) => {
          if (
            job.status === "done" ||
            job.status === "failed" ||
            job.status === "completed"
          )
            return job;

          try {
            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;
            const data = await res.json();

            return {
              ...job,
              percentage: data.percentage || 0,
              progress: data.progress || 0,
              total: data.total || 0,
              status: data.status === "completed" ? "done" : data.status,
            };
          } catch (err) {
            return job;
          }
        }),
      );

      setActiveJobs(updatedJobs);
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobs, baseUrl]);

  const handleFileUpload = async (item: string) => {
    if (isMonthEmpty) {
      alert("Silakan pilih Periode (Bulan) terlebih dahulu.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv, .xlsx";
    input.multiple = activeTab !== "master";

    input.onchange = async (e: any) => {
      const files: File[] = Array.from(e.target.files);
      if (files.length === 0) return;

      for (const file of files) {
        const formData = new FormData();
        formData.append("month", selectedMonth);
        formData.append("file", file);

        try {
          const response = await fetch(
            `${baseUrl}/upload/${activeTab}/${item}`,
            {
              method: "POST",
              body: formData,
            },
          );

          const result = await response.json();

          if (response.ok && (result.job_id || result.job_ids)) {
            const finalJobId =
              result.job_id ||
              (Array.isArray(result.job_ids) ? result.job_ids[0] : null);

            if (finalJobId) {
              const newJob: ActiveJob = {
                jobId: finalJobId,
                itemName: file.name.toUpperCase(),
                progress: 0,
                status: "pending",
                total: 0,
                percentage: 0,
              };

              setActiveJobs((prev) => [newJob, ...prev]);
              setIsQueueOpen(true);
            }
          } else {
            alert(`Gagal upload ${file.name}: ${result.error}`);
          }
        } catch (error) {
          console.error(`⚠️ Koneksi terputus`, error);
        }
      }
      input.value = "";
    };

    input.click();
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
                  ? "font-bold text-black"
                  : "text-gray-400 hover:text-gray-600 rounded-2xl py-6 px-3 bg-gray-100 "
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
              Multiple Uploads Enabled
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              Periode
            </span>
            <input
              type="month"
              required
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`border px-4 py-1.5 text-sm font-bold outline-none transition-all ${
                isMonthEmpty ? "border-red-500 animate-pulse" : "border-black"
              }`}
            />
          </div>
        </header>

        <div
          className={`max-w-3xl transition-opacity duration-300 ${isMonthEmpty ? "opacity-40 cursor-not-allowed" : "opacity-100"}`}
        >
          {dataContent[activeTab].map((item) => (
            <div
              key={item}
              className={`group flex justify-between items-center border-black py-6 px-3 hover:bg-gray-50 transition-all mt-2 bg-gray-100 rounded-2xl ${
                isMonthEmpty ? "pointer-events-none select-none" : ""
              }`}
            >
              <span
                onClick={() => handleFileUpload(item)}
                className="text-2xl font-bold uppercase tracking-tighter flex-1 cursor-pointer"
              >
                {item}
              </span>

              <div className="flex items-center gap-4">
                {activeTab === "master" && (
                  <button
                    disabled={isMonthEmpty}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExportType(`MASTER_${item.toUpperCase()}`);
                      setIsExportOpen(true);
                    }}
                    className="bg-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-black hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Export
                  </button>
                )}

                <div
                  onClick={() => handleFileUpload(item)}
                  className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    Add to Queue
                  </span>
                  <i className="ri-add-line text-2xl text-black"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* POPUP QUEUE (MANUAL CLOSE) */}
      {activeJobs.length > 0 && (
        <div className="fixed bottom-0 right-8 w-80 bg-white border border-gray-200 shadow-2xl rounded-t-lg overflow-hidden transition-all duration-300 z-50">
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
                  className="p-3 border-b border-gray-50 last:border-0 relative"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase truncate w-32">
                      {job.itemName}
                    </span>
                    <div className="flex items-center gap-2">
                      {job.status === "done" || job.status === "completed" ? (
                        <i className="ri-checkbox-circle-fill text-green-500"></i>
                      ) : job.status === "failed" ? (
                        <i className="ri-error-warning-fill text-red-500"></i>
                      ) : (
                        <span className="text-[9px] font-mono text-blue-600 font-bold">
                          {job.percentage.toFixed(0)}%
                        </span>
                      )}
                      {/* Tombol Close Manual */}
                      <button
                        onClick={() => removeJob(job.jobId)}
                        className="hover:bg-gray-100 rounded-full p-0.5 transition-colors group"
                      >
                        <i className="ri-close-line text-gray-400 group-hover:text-black font-bold"></i>
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        job.status === "done" || job.status === "completed"
                          ? "bg-green-500"
                          : job.status === "failed"
                            ? "bg-red-500"
                            : "bg-blue-600"
                      }`}
                      style={{ width: `${job.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER MODAL EXPORT */}
      <ExportMasterModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        month={selectedMonth}
        jobType={exportType}
      />
    </div>
  );
}
