"use client";

import React, { useEffect, useState } from "react";

interface LogEntry {
  _id: string;
  type: string;
  month: string;
  status: string;
  progress: number;
  total_rows?: number;
  created_at: string;
  finished_at?: string;
  file_name?: string;
  file_path?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = `http://${window.location.hostname}:8080`;

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${baseUrl}/jobs/recent`);
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI UNTUK EXPORT SEMUA DATA KE CSV
  const exportAllToCSV = async () => {
    try {
      const response = await fetch(`${baseUrl}/jobs/export`);
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        alert("Tidak ada data untuk di-export");
        return;
      }

      // Buat header CSV
      const headers = Object.keys(data[0]).join(",");
      // Buat baris data
      const rows = data.map((obj) =>
        Object.values(obj)
          .map((val) => `"${val}"`)
          .join(","),
      );

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `system_logs_${new Date().getTime()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Gagal melakukan export data");
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "done":
        return "bg-green-50 text-green-700 border-green-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white font-poppins text-black p-12">
      {/* HEADER */}
      <header className="flex justify-between items-end mb-12 border-b-4 border-black pb-8">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter">
            System Logs
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-[0.4em]">
            Backend Activity & Job History
          </p>
        </div>
        <div className="flex gap-4">
          {/* TOMBOL EXPORT HISTORY (BARU) */}
          <button
            onClick={exportAllToCSV}
            className="border-2 border-black px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-white hover:text-black transition-all"
          >
            Export History
          </button>
          <button
            onClick={fetchLogs}
            className="border-2 border-black px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
          >
            Sync Data
          </button>
        </div>
      </header>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-wider">
                Job Details
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-wider">
                Periode
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-wider">
                Progress
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-wider">
                Execution Time
              </th>
              <th className="text-center py-4 px-2 text-[10px] font-black uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-32 text-center text-xs font-bold animate-pulse uppercase tracking-[0.5em] text-gray-300"
                >
                  Fetching System Logs...
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log._id}
                  className="group hover:bg-gray-50 transition-all"
                >
                  <td className="py-6 px-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight">
                        {log.type.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">
                        ID: {log._id}
                      </span>
                      {log.file_name && (
                        <div className="flex items-center gap-2 mt-3 bg-gray-100 border border-gray-200 w-fit px-2.5 py-1 rounded-sm shadow-sm">
                          <i className="ri-file-text-fill text-black text-[10px]"></i>
                          <span className="text-[10px] font-bold text-gray-700 truncate max-w-['200px']">
                            {log.file_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-2">
                    <span className="text-[11px] font-black text-gray-600 uppercase italic">
                      {log.month}
                    </span>
                  </td>
                  <td className="py-6 px-2">
                    <div className="flex flex-col text-xs">
                      <span className="font-black">
                        {(log.progress || 0).toLocaleString()}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                        Processed Rows
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-2">
                    <div
                      className={`inline-flex items-center px-3 py-1 text-[9px] font-black uppercase border-2 ${getStatusStyle(log.status)}`}
                    >
                      {log.status}
                    </div>
                  </td>
                  <td className="py-6 px-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black text-gray-300 uppercase w-8">
                          Start
                        </span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                      {log.finished_at && (
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-black text-green-300 uppercase w-8">
                            Done
                          </span>
                          <span className="text-[10px] font-bold text-gray-600">
                            {formatDateTime(log.finished_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-center">
                    {log.status === "done" &&
                    (log.type.includes("VLOOKUP") ||
                      log.type.includes("MASTER")) ? (
                      <button
                        onClick={() => {
                          const url = log.type.includes("VLOOKUP")
                            ? `${baseUrl}/report/kof/download?job_id=${log._id}`
                            : `${baseUrl}/download/generic?path=${encodeURIComponent(log.file_path || "")}`;
                          window.open(url, "_blank");
                        }}
                        className="text-black hover:text-green-600 transition-colors"
                        title="Download File"
                      >
                        <i className="ri-download-cloud-2-line text-xl"></i>
                      </button>
                    ) : (
                      <i className="ri-lock-line text-gray-200 text-xl"></i>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <footer className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
        <div className="flex gap-10">
          <span>Total Jobs: {logs.length}</span>
          <span>Status: System Operational</span>
        </div>
        <span>Refreshed at {new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}
