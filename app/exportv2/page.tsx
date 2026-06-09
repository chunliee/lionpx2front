"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ExportUniversalModal from "@/components/Export";
import ExportUniversalModalv2 from "@/components/Exportv2";
import Cookies from "js-cookie";

// 1. Definisikan interface untuk Job
interface ActiveJob {
  jobId: string;
  displayLabel: string;
  status: string;
  percentage: number;
}

export default function ExportICPage() {
  // const router = useRouter();
  const baseUrl = `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8083`;

  const [activeModal, setActiveModal] = useState<string | null>(null);
  // Melacak jobId mana yang sedang dalam proses request download
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

  // 2. State untuk menampung daftar job yang sedang berjalan
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
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

  // useEffect(() => {
  //   const auth = localStorage.getItem("user_auth");
  //   if (!auth) {
  //     router.push("/login");
  //   }
  // }, [router]);

  // 3. Polling Manager: Cek status setiap 2 detik jika ada job yang belum 'done'
  useEffect(() => {
    const unfinishedJobs = activeJobs.filter(
      (j) => j.status !== "done" && j.status !== "failed",
    );

    if (unfinishedJobs.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const updatedJobs = await Promise.all(
          activeJobs.map(async (job) => {
            // Jika sudah beres, jangan difetch lagi
            if (job.status === "done" || job.status === "failed") return job;

            // Sesuaikan dengan endpoint detail job kamu (misal: /jobs/:id)
            const res = await fetch(`${baseUrl}/jobs/${job.jobId}`);
            if (!res.ok) return job;

            const data = await res.json();
            return {
              ...job,
              status: data.status,
              percentage: data.percentage || 0,
            };
          }),
        );
        setActiveJobs(updatedJobs);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobs, baseUrl]);

  // 4. Handler saat Modal berhasil men-generate job
  const handleExportSuccess = (jobId: string, label: string) => {
    const newJob: ActiveJob = {
      jobId: jobId,
      displayLabel: label,
      status: "processing",
      percentage: 0,
    };
    setActiveJobs((prev) => [newJob, ...prev]);
  };

  // 5. Handler Download
  const handleDownload = async (jobId: string) => {
    // Mulai loading
    setDownloadingIds((prev) => [...prev, jobId]);

    try {
      const res = await fetch(`${baseUrl}/export/download/${jobId}`);
      if (!res.ok) throw new Error("Gagal mengunduh file");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      // Mencoba mengambil nama file dari job info atau default
      const jobInfo = activeJobs.find((j) => j.jobId === jobId);
      const fileName = jobInfo
        ? `${jobInfo.displayLabel.replace(/\s+/g, "_")}.zip`
        : `export_${jobId}.zip`;

      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal mendownload file, silakan coba lagi.");
    } finally {
      // Matikan loading
      setDownloadingIds((prev) => prev.filter((id) => id !== jobId));
    }
  };
  const menu = [
    { id: "mn", label: "ID Mitra (MN)" },
    { id: "ic", label: "Detail STT (M.IC)" },
    { id: "ls", label: "Last Status STT (LS)" },
    { id: "bc", label: "Berat STT Corporate (BC)" },
    { id: "mr", label: "Routing Transportation & Area (MR)" },
    { id: "rf", label: "Rate Forward Area (RF)" },
    { id: "rt", label: "Rate Trucking (RT)" },
    { id: "dt", label: "Delivery Tiering Policy (DTPOL)" },
    { id: "mt", label: "Manifest Cargo (MT)" },
    { id: "cm", label: "Detail Manifest Cargo (CM)" },
    { id: "ms", label: "Outgoing Shipment Report (MS)" },
  ];
  const filteredMenu = menu.filter(
    (item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCloseJob = (jobId: string) => {
    setActiveJobs((prev) => prev.filter((job) => job.jobId !== jobId));
  };

  return (
    <div className="flex min-h-screen bg-white font-poppins text-black relative">
      <aside className="w-64 border-r border-gray-100 flex flex-col fixed h-full bg-white z-10">
        <div className="p-8 pb-4">
          <h2 className="font-bold text-xl tracking-tight text-black">
            Export Tool
          </h2>

          {/* SEARCH BOX */}
          <div className="mt-4 relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder=""
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-black  py-2 pl-9 pr-4 text-xs font-bold outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 scrollbar-hide mb-20">
          {/* Tambahkan padding bottom besar (mb-20 atau pb-10) 
      agar item terakhir tidak tertutup elemen bawah */}
          {filteredMenu.length > 0 ? (
            filteredMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModal(item.id)}
                className={`text-left text-lg font-bold pl-4 transition-all py-2 rounded-lg shrink-0 ${
                  // Tambahkan shrink-0
                  activeModal === item.id
                    ? "text-black border-l-4 border-black bg-gray-50"
                    : "text-gray-400 hover:text-black hover:bg-gray-50 border-l-4 border-transparent"
                }`}
              >
                {item.label}
              </button>
            ))
          ) : (
            <p className="text-[10px] text-center text-gray-400 uppercase mt-4 font-bold">
              Menu tidak ditemukan
            </p>
          )}
        </nav>

        {/* System Status tetep di bawah */}
        <div className="p-8 pt-4">{/* ... kode system status kamu ... */}</div>
      </aside>

      <main className="flex-1 ml-64 p-12 flex flex-col min-h-screen justify-center items-center">
        <div className="max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-gray-100 rounded-[2.5rem] flex items-center justify-center rotate-12">
              <span className="text-4xl">📊</span>
            </div>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
            Data Extraction Hub
          </h1>
        </div>
      </main>

      {/* 6. POPUP QUEUE (Pojok Kanan Bawah) */}
      {activeJobs.length > 0 && (
        <div className="fixed bottom-6 right-6 w-80 flex flex-col gap-3 z-[60] max-h-[80vh] overflow-y-auto scrollbar-hide">
          <h3 className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest block">
            Active Exports
          </h3>
          {activeJobs.map((job) => (
            <div
              key={job.jobId}
              className="bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-right duration-300 flex flex-col h-auto min-h-[85px] w-full clear-both"
            >
              {/* Header Notif (Judul di kiri, Status & Tombol X di kanan sejajar) */}
              <div className="flex justify-between items-center gap-2 w-full mb-3">
                {/* Title Menu */}
                <span className="text-[10px] font-black uppercase truncate block max-w-[120px]">
                  {job.displayLabel}
                </span>

                {/* Container Kanan (Status Badge + Tombol X Sejajar) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full block whitespace-nowrap ${
                      job.status === "done"
                        ? "bg-green-100 text-green-600"
                        : job.status === "failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600 animate-pulse"
                    }`}
                  >
                    {job.status.toUpperCase()}
                  </span>

                  {/* Tombol X pas di sebelah status */}
                  <button
                    onClick={() => handleCloseJob(job.jobId)}
                    className="text-gray-400 hover:text-black font-bold text-base transition-colors w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0"
                    title="Dismiss"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Konten Fleksibel Berdasarkan Status */}
              <div className="w-full block mt-auto">
                {job.status === "done" ? (
                  <button
                    disabled={downloadingIds.includes(job.jobId)}
                    onClick={() => handleDownload(job.jobId)}
                    className={`w-full py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                      downloadingIds.includes(job.jobId)
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    {downloadingIds.includes(job.jobId) ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <i className="ri-download-line text-xs"></i>
                        Download File
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span>Progress</span>
                      <span>{Math.round(job.percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-black h-full transition-all duration-500"
                        style={{ width: `${job.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      <ExportUniversalModalv2
        type={activeModal}
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        onSuccess={handleExportSuccess} // Kirim fungsi ke modal
      />
    </div>
  );
}
