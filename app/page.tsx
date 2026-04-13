"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function Home() {
  const [userData, setUserData] = useState<{
    name?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    // 1. Ambil data dari cookie
    const auth = Cookies.get("user_auth");

    if (auth) {
      try {
        // 2. Parse string JSON menjadi objek
        const parsed = JSON.parse(auth);
        setUserData(parsed);
      } catch (err) {
        console.error("Gagal parse data user:", err);
      }
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Welcome,{" "}
        <span className="text-blue-600">{userData?.name || "XXXXXXXXXX"}</span>!
      </h1>
      <p className="text-gray-500 mt-2">
        Kamu login sebagai: <strong>{userData?.role || "-"}</strong>
      </p>
    </div>
  );
}
