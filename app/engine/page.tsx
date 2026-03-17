"use client";

import React, { useState, useEffect } from "react";

const engineContent: Record<string, string[]> = {
  vlookup: [
    "kof",
    "sof",
    "pof",
    "kif",
    "sif",
    "def",
    "fro",
    "frd",
    "tuc",
    "stt",
    "kpf",
    "kdf",
  ],
  summary: ["daily", "monthly", "yearly"],
  reconcile: ["finance", "operation"],
};

interface ActiveJob {
  jobId: string;
  itemName: string;
  progress: number;
  status: string;
  total: number;
  percentage: number;
  filePaths?: string;
}

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState("vlookup");
  const [selectedMonth, setSelectedMonth] = useState("2026-12");
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);

  const baseUrl = `http://${window.location.hostname}:8080`;

  // Polling Manager
  useEffect(() => {
    const jobsToPoll = activeJobs.filter(
      (j) => j.status !== "done" && j.status !== "failed",
    );
    if (jobsToPoll.length === 0) return;

    const interval = setInterval(async () => {
      const updatedJobs = await Promise.all(
        activeJobs.map(async (job) => {
          if (job.status === "done" || job.status === "failed") return job;

          try {
            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;
            const data = await res.json();

            return {
              ...job,
              percentage: data.percentage || 0,
              progress: data.progress || 0,
              total: data.total_rows || data.total || 0,
              status: data.status === "completed" ? "done" : data.status,
              filePaths: data.file_path,
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

  // FUNGSI BARU: Supaya file ada format .csv dan nama yang benar
  const handleDownloadPart = async (
    jobId: string,
    partIdx: number,
    itemName: string,
  ) => {
    try {
      const response = await fetch(
        `${baseUrl}/engine/kof/download?job_id=${jobId}&part=${partIdx}`,
      );
      if (!response.ok) throw new Error("Download gagal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      // Bersihkan nama file dari spasi
      const safeItemName = itemName.replace(/\s+/g, "_");
      const fileName = `${safeItemName}_${selectedMonth}_PART${partIdx + 1}.csv`;

      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("⚠️ Gagal mendownload file");
      console.error(err);
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
        const newJob: ActiveJob = {
          jobId: result.job_id,
          itemName: `${item.toUpperCase()}`,
          progress: 0,
          status: "pending",
          total: 0,
          percentage: 0,
        };

        setActiveJobs((prev) => [newJob, ...prev]);
        setIsQueueOpen(true);
      } else {
        alert(`Gagal: ${result.error || "Server Error"}`);
      }
    } catch (error) {
      alert("⚠️ Koneksi ke backend gagal!");
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-poppins text-black relative overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-100 p-8 flex flex-col">
        <h2 className="font-bold text-xl mb-10 tracking-tight">Engines</h2>
        <nav className="flex flex-col gap-6">
          {Object.keys(engineContent).map((tab) => (
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
              {activeTab} Process
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase">
              Automated Data Processing
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
              className="border border-black px-4 py-1.5 text-sm font-bold outline-none rounded-lg"
            />
          </div>
        </header>

        <div className="max-w-3xl">
          {engineContent[activeTab].map((item) => (
            <div
              key={item}
              onClick={() => handleRunEngine(item)}
              className="group flex justify-between items-center border-black py-6 px-6 hover:bg-blue-50 transition-all cursor-pointer mt-2 bg-gray-100 rounded-2xl"
            >
              <div className="flex flex-col">
                <span className="text-2xl font-bold uppercase tracking-tighter">
                  {item} Engine
                </span>
                <span className="text-[10px] text-gray-400 font-medium italic">
                  Ready to process {selectedMonth}
                </span>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold uppercase text-blue-600">
                  Run Process
                </span>
                <i className="ri-play-fill text-2xl text-blue-600"></i>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* POPUP QUEUE */}
      {activeJobs.length > 0 && (
        <div className="fixed bottom-0 right-8 w-80 bg-white border border-gray-200 shadow-2xl rounded-t-xl overflow-hidden transition-all duration-300 z-50">
          <div
            className="bg-gray-900 text-white p-4 flex justify-between items-center cursor-pointer"
            onClick={() => setIsQueueOpen(!isQueueOpen)}
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeJobs.length} Processing Task
            </span>
            <i
              className={
                isQueueOpen ? "ri-arrow-down-s-line" : "ri-arrow-up-s-line"
              }
            ></i>
          </div>

          {isQueueOpen && (
            <div className="max-h-['30rem'] overflow-y-auto p-3 space-y-3 bg-white">
              {activeJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase truncate w-44 text-gray-700">
                      {job.itemName}
                    </span>
                    {job.status === "done" ? (
                      <i className="ri-checkbox-circle-fill text-green-500 text-lg"></i>
                    ) : (
                      <span className="text-[10px] font-mono text-blue-600 font-bold">
                        {job.percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ${job.status === "done" ? "bg-green-500" : "bg-blue-600"}`}
                      style={{ width: `${job.percentage}%` }}
                    ></div>
                  </div>

                  {/* Action Section */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase">
                      <span>{job.status}</span>
                      {job.status !== "done" && (
                        <span>{job.progress.toLocaleString()} rows</span>
                      )}
                    </div>

                    {/* Tombol Download (Ganti dari <a> ke button untuk handle blob) */}
                    {job.status === "done" && job.filePaths && (
                      <div className="grid grid-cols-1 gap-1.5 mt-2">
                        {job.filePaths.split("|").map((path, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              handleDownloadPart(job.jobId, idx, job.itemName)
                            }
                            className="flex items-center justify-center gap-2 bg-black text-white py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-800 transition-all"
                          >
                            <i className="ri-download-2-line"></i> Download Part{" "}
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
