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
  start_at?: string;
  finished_at?: string;
  file_name?: string;
  file_path?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  // FILTER STATES
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const baseUrl = `http://${window.location.hostname}:8080`;

  const categoryMap: { [key: string]: string[] } = {
    MASTER: [
      "MASTER_MN",
      "MASTER_IC",
      "MASTER_LS",
      "MASTER_BC",
      "MASTER_MR",
      "MASTER_RF",
      "MASTER_RT",
      "MASTER_DT",
      "MASTER_MT",
      "MASTER_CM",
      "MASTER_MS",
    ],
    DATA: [
      "DATA_FRO",
      "DATA_POF",
      "DATA_KDF",
      "DATA_KOF",
      "DATA_KIF",
      "DATA_SOF",
      "DATA_SIF",
      "DATA_DEF",
      "DATA_FRD",
      "DATA_TUC",
      "DATA_STT",
      "DATA_KPF",
    ],
    TBS: [
      "TBS_FRO",
      "TBS_IC",
      "TBS_KDF",
      "TBS_KOF",
      "TBS_KIF",
      "TBS_SOF",
      "TBS_SIF",
      "TBS_POF",
      "TBS_DEF",
      "TBS_FRD",
      "TBS_TUC",
      "TBS_STT",
      "TBS_KPF",
    ],
    VLOOKUP: ["VLOOKUP_FRO", "VLOOKUP_KDF", "VLOOKUP_IC"],
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [page, selectedCategory, selectedType, selectedMonth]);

  const fetchLogs = async () => {
    try {
      // Pastikan category dikirim lowercase sesuai ekspektasi backend baru
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        category: selectedCategory.toLowerCase(),
        type: selectedType,
        month: selectedMonth,
      });

      const response = await fetch(`${baseUrl}/jobs/recent?${params}`);
      const result = await response.json();

      if (result.data) {
        setLogs(result.data);
        setTotalPages(result.total_pages || 1);
        setTotalData(result.total || 0);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mendapatkan nama file yang akan ditampilkan
  const displayFileName = (log: LogEntry) => {
    if (log.file_name && log.file_name !== "") return log.file_name;
    if (log.file_path) {
      const parts = log.file_path.replace(/\\/g, "/").split("/");
      return parts[parts.length - 1];
    }
    return null;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr || dateStr === "" || dateStr === "-") return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
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
      <header className="flex justify-between items-end mb-12 border-b-4 border-black pb-8">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter">
            System Logs
          </h1>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-[0.4em]">
            Backend Activity & Job History
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchLogs}
            className="border-2 border-black px-6 py-2 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all"
          >
            Sync Data
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="flex gap-4 mb-8">
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedType(""); // Reset type saat ganti kategori
            setPage(1);
          }}
          className="border-2 border-black p-2 text-[10px] font-black uppercase outline-none focus:bg-black focus:text-white transition-all cursor-pointer"
        >
          <option value="">All Category</option>
          <option value="MASTER">Master</option>
          <option value="DATA">Data</option>
          <option value="TBS">TBS</option>
          <option value="VLOOKUP">Vlookup</option>
        </select>

        <select
          value={selectedType}
          disabled={!selectedCategory}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setPage(1);
          }}
          className="border-2 border-black p-2 text-[10px] font-black uppercase outline-none disabled:opacity-30 focus:bg-black focus:text-white transition-all cursor-pointer"
        >
          <option value="">All Type</option>
          {selectedCategory &&
            categoryMap[selectedCategory].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>

        <input
          type="text"
          placeholder="Periode (YYYY-MM)"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setPage(1);
          }}
          className="border-2 border-black p-2 text-[10px] font-black uppercase outline-none focus:bg-black focus:text-white transition-all w-48"
        />
        <button
          onClick={() => {
            // Gunakan lowercase kategori untuk export juga
            const params = new URLSearchParams({
              category: selectedCategory.toLowerCase(),
              type: selectedType,
              month: selectedMonth,
            });
            window.open(`${baseUrl}/jobs/export?${params}`, "_blank");
          }}
          className="ml-auto bg-black text-white border-2 border-black px-6 py-2 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2"
        >
          <i className=" text-sm"></i>
          Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase">
                Job Details
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase">
                Periode
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase">
                Progress
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase">
                Status
              </th>
              <th className="text-left py-4 px-2 text-[10px] font-black uppercase">
                Execution
              </th>
              <th className="text-center py-4 px-2 text-[10px] font-black uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              const fileName = displayFileName(log);
              return (
                <tr
                  key={log._id}
                  className="group hover:bg-gray-50 transition-all"
                >
                  <td className="py-6 px-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight">
                        {log.type.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono mt-0.5">
                        ID: {log._id}
                      </span>
                      {/* FILE NAME BADGE */}
                      {fileName && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <i className="ri-file-text-line text-gray-400 text-[10px]"></i>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 border border-gray-200 text-[9px] font-bold rounded uppercase tracking-wider truncate max-w-[200px]">
                            {fileName}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-[11px] font-black text-gray-600 italic">
                    {log.month}
                  </td>
                  <td className="py-6 px-2 text-xs font-black">
                    {(log.progress || 0).toLocaleString()}
                  </td>
                  <td className="py-6 px-2">
                    <div
                      className={`inline-flex px-3 py-1 text-[9px] font-black uppercase border-2 ${getStatusStyle(log.status)}`}
                    >
                      {log.status}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-[10px]">
                    <div className="flex flex-col gap-1 text-gray-600 font-bold">
                      <span>
                        Start: {formatDateTime(log.start_at || log.created_at)}
                      </span>
                      {log.finished_at && (
                        <span className="text-green-400">
                          Done: {formatDateTime(log.finished_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-center">
                    {log.status === "done" && log.file_path && (
                      <button
                        onClick={() =>
                          window.open(
                            `${baseUrl}/download/generic?path=${encodeURIComponent(log.file_path || "")}`,
                            "_blank",
                          )
                        }
                        className="text-black hover:text-green-600 transition-colors"
                        title="Download File"
                      >
                        <i className="ri-download-cloud-2-line text-xl"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-between items-center border-t-2 border-black pt-6 font-black text-[10px] uppercase tracking-widest">
        <div className="text-gray-400">
          Page {page} of {totalPages} — Total {totalData} Records
        </div>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-2 border-black px-4 py-1 hover:bg-black hover:text-white disabled:opacity-20 transition-all"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-2 border-black px-4 py-1 hover:bg-black hover:text-white disabled:opacity-20 transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
