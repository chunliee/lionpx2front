"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function Home() {
  const [userData, setUserData] = useState<{
    name?: string;
    role?: string;
  } | null>(null);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // 1. Logic untuk Greeting berdasarkan jam
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // 2. Ambil data dari cookie
    const auth = Cookies.get("user_auth");
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        setUserData(parsed);
      } catch (err) {
        console.error("Failed to parse user data:", err);
      }
    }
  }, []);

  return (
    <div className="p-8 font-poppins">
      <h1 className="text-3xl font-bold tracking-tight">
        {greeting},{" "}
        <span className="text-blue-700">{userData?.name || "Guest"}</span>!
      </h1>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-sm text-gray-500">
          Signed in as{" "}
          <span className="font-bold text-blue-700 capitalize">
            {userData?.role || "Guest"}
          </span>
        </p>
      </div>
      {/* <p className="text-xs text-gray-400 mt-6 uppercase font-bold">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p> */}
    </div>
  );
}
