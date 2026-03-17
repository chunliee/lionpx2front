"use client";

import React, { useState } from "react";
import ExportICModal from "@/components/Export_ic";
import ExportUniversalModal from "@/components/Export_ic";

export default function ExportICPage() {
  // State untuk kontrol modal mana yang buka
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const menu = [
    { id: "ic", label: "Master IC" },
    { id: "ls", label: "Master LS" },
    { id: "dt", label: "Master DT" },
    { id: "mt", label: "Master MT" },
    { id: "cm", label: "Master CM" },
    { id: "ms", label: "Master MS" }, // Tambahan MS di sini
  ];

  return (
    <div className="flex min-h-screen bg-white font-poppins text-black">
      <aside className="w-64 border-r border-gray-100 p-8 flex flex-col fixed h-full">
        <h2 className="font-bold text-xl mb-10 tracking-tight text-gray-400">
          Export Tool
        </h2>
        <nav className="flex flex-col gap-2">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModal(item.id)}
              className={`text-left text-lg font-bold pl-4 transition-all py-2 rounded-r-lg ${
                activeModal === item.id
                  ? "text-black border-l-4 border-black bg-gray-50"
                  : "text-gray-400 hover:text-black hover:bg-gray-50 border-l-4 border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
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
