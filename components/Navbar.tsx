"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

const Navbar = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const auth = Cookies.get("user_auth");
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        setUserRole(parsed.role);
      } catch (err) {
        console.error("Gagal parse role:", err);
      }
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("user_auth");
    window.location.href = "/login";
  };

  // Helper function untuk cek akses
  const canAccess = (allowedRoles: string[]) => {
    return userRole && allowedRoles.includes(userRole);
  };

  return (
    <div className="navbar py-6">
      <div className="container mx-auto px-4">
        <div className="navbar-box flex items-center justify-between">
          <div className="logo">
            <h1 className="text-3xl font-bold italic">Lion Parcel</h1>
          </div>

          <ul className="menu flex items-center gap-12">
            {/* HOME: Semua Role Bisa Lihat */}
            <li>
              <Link href="/">Home</Link>
            </li>

            {/* UPLOAD & EXPORT: Semua kecuali guest */}
            {canAccess(["admin", "subadmin", "role1", "role2", "role3"]) && (
              <>
                <li>
                  <Link href="/upload">Upload</Link>
                </li>
              </>
            )}
            {/* EXPORT: Semua kecuali guest */}
            {canAccess([
              "admin",
              "subadmin",
              "role1",
              "role2",
              "role3",
              "guess",
            ]) && (
              <>
                <li>
                  <Link href="/exportv2">Exportv2</Link>
                </li>
              </>
            )}

            {/* ENGINE: Hanya admin, subadmin, role1 */}
            {canAccess(["admin", "subadmin", "role1"]) && (
              <li>
                <Link href="/engine">Engine</Link>
              </li>
            )}

            {/* LOGS: Semua bisa lihat */}
            <li>
              <Link href="/logs">Logs</Link>
            </li>

            {/* DELETE: Hanya Admin yang bisa lihat */}
            {canAccess(["admin"]) && (
              <li className="text-red-500 font-bold">
                <Link href="/delete">Delete</Link>
              </li>
            )}

            <li>
              <button
                onClick={handleLogout}
                className="text-red-500 font-bold hover:underline transition-all"
              >
                Logout
              </button>
            </li>
          </ul>

          <div className="md:hidden block">
            <i className="ri-menu-3-line ri-2x font-bold"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
