"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { TbLogout2 } from "react-icons/tb";
import Image from "next/image";
import lpLogo from "../public/assets/lpred.png";

const Navbar = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const menuClass = `
  px-4 py-2 rounded-md text-black 
  hover:text-white hover:bg-gray-700 
  transform hover:scale-105 
  transition duration-300 ease-in-out 
  cursor-pointer
  `;
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
    <div className="navbar py-4 shadow-md">
      <div className="container mx-auto px-4">
        <div className="navbar-box flex items-center justify-between">
          {/* LOGO */}
          <div className="logo flex items-center">
            <Image
              src={lpLogo}
              alt="Lion Parcel Logo"
              width={280}
              height={80}
              priority
            />
          </div>

          <ul className="menu flex items-center gap-12">
            {/* HOME: Semua Role Bisa Lihat */}
            <li className={menuClass}>
              <Link href="/">Home</Link>
            </li>

            {/* UPLOAD & EXPORT: Semua kecuali guest */}
            {canAccess(["admin", "subadmin", "role1", "role2", "role3"]) && (
              <>
                <li
                  className="px-4 py-2 rounded-md text-black 
            hover:text-white hover:bg-gray-700 
            transform hover:scale-105 
            transition duration-300 ease-in-out 
            cursor-pointer"
                >
                  <Link href="/upload">Upload</Link>
                </li>
              </>
            )}

            {/* ENGINE: Hanya admin, subadmin, role1 */}
            {canAccess(["admin", "subadmin", "role1", "role2"]) && (
              <li className={menuClass}>
                <Link href="/engine">Engine</Link>
              </li>
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
                <li className={menuClass}>
                  <Link href="/exportv2">Extraction Hub</Link>
                </li>
              </>
            )}

            {/* LOGS: Semua bisa lihat */}
            <li className={menuClass}>
              <Link className="" href="/logs">
                Logs
              </Link>
            </li>

            <li
              className={`${menuClass} text-red-500 hover:bg-red-500 hover:text-white`}
            >
              <button onClick={handleLogout} className="w-full text-left">
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
