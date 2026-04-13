"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Daftar user "palsu" - sesuaikan dengan kebutuhan internal
const VALID_USERS = [
  {
    id: "su",
    username: "su",
    password: "123",
    name: "supauser",
    role: "admin",
  },
  {
    id: "sa",
    username: "sa",
    password: "123",
    name: "supauser",
    role: "admin",
  },
  {
    id: "56127368",
    username: "56127368",
    password: "123",
    name: "Lingga",
    role: "admin",
  },
  {
    id: "184762",
    username: "184762",
    password: "123",
    name: "Aldus",
    role: "admin",
  },
  {
    id: "56073384",
    username: "56073384",
    password: "123",
    name: "Mona",
    role: "subadmin",
  },
  {
    id: "192391",
    username: "192391",
    password: "123",
    name: "Christin",
    role: "role1",
  },
  {
    id: "251058",
    username: "251058",
    password: "123",
    name: "Rafly",
    role: "role2",
  },
  {
    id: "251677",
    username: "251677",
    password: "123",
    name: "Nabila",
    role: "role3",
  },
  {
    id: "56127978",
    username: "56127978",
    password: "123",
    name: "Deka",
    role: "guess",
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Mengambil data langsung dari Form untuk akurasi 100%
    const formData = new FormData(e.currentTarget);
    const currentUsername = formData.get("username")?.toString().trim();
    const currentPassword = formData.get("password")?.toString();

    const user = VALID_USERS.find(
      (u) => u.username === currentUsername && u.password === currentPassword,
    );

    if (user) {
      const sessionData = {
        id: String(user.id),
        username: user.username,
        name: user.name,
        role: user.role,
      };

      // Hapus semua cookie lama bernama sama untuk jaga-jaga
      Cookies.remove("user_auth");

      // SET ULANG dengan path: "/"
      Cookies.set("user_auth", JSON.stringify(sessionData), {
        expires: 1,
        path: "/", // INI WAJIB ADA
      });

      // Gunakan href agar seluruh state browser ter-refresh
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-white font-poppins px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-1 text-center text-3xl font-bold tracking-tight text-black">
          Lion Parcel Data Analyst
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Username
            </label>
            <div className="mt-2">
              <input
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-xl border-0 bg-gray-100 py-3 px-4 text-black shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-black sm:text-sm font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Password
            </label>
            <div className="mt-2">
              <input
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-0 bg-gray-100 py-3 px-4 text-black shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-black sm:text-sm font-bold outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold uppercase p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="flex w-full justify-center rounded-xl bg-black px-3 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-gray-800 transition-all active:scale-95"
          >
            Sign In
          </button>
        </form>

        <p className="mt-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          © 2026 - Data Analyst Dev <br />
        </p>
      </div>
    </div>
  );
}
