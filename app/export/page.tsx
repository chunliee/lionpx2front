"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import ExportUniversalModal from "@/components/Export";

export default function ExportICPage() {
  // const router = useRouter();
  // useEffect(() => {
  //   // Cek auth saat komponen di-mount
  //   const auth = localStorage.getItem("user_auth");

  //   if (!auth) {
  //     router.push("/login"); // Redirect ke login kalau gak ada session
  //   }
  // }, [router]);
  // State untuk kontrol modal mana yang buka
  const [activeModal, setActiveModal] = useState<string | null>(null);

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

  return (
    <div className="flex min-h-screen bg-white font-poppins text-black">
      <aside className="w-64 border-r border-gray-100 flex flex-col fixed h-full bg-white">
        {/* HEADER - Tetap di atas */}
        <div className="p-8 pb-4">
          <h2 className="font-bold text-xl tracking-tight text-gray-400">
            Export Tool
          </h2>
        </div>

        {/* NAV - Bagian yang bisa di-scroll */}
        <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-2 scrollbar-hide">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModal(item.id)}
              className={`text-left text-lg font-bold pl-4 transition-all py-2 rounded-lg ${
                activeModal === item.id
                  ? "text-black border-l-4 border-black bg-gray-50"
                  : "text-gray-400 hover:text-black hover:bg-gray-50 border-l-4 border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* FOOTER - Tetap di bawah */}
        <div className="p-8 pt-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
              System Status
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold">Server Online</span>
            </div>
          </div>
        </div>
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

      {/* MODALS */}
      <ExportUniversalModal
        type={activeModal}
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
