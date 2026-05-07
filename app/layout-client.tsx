"use client";

import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import "remixicon/fonts/remixicon.css";
import React from "react";
import { usePathname } from "next/navigation";

const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Tentukan apakah halaman saat ini adalah login
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <body className={`${fontPoppins.className} antialiased`}>
        {/* Hanya tampilkan Navbar jika BUKAN di halaman login */}
        {!isLoginPage && <Navbar />}

        {/* PENTING: Gunakan padding atau margin top di container 
          supaya konten tidak tertutup Navbar yang posisinya biasanya fixed/sticky
        */}
        <main className={`${!isLoginPage ? "pt-4" : ""}`}>
          <div className="container mx-auto px-4">{children}</div>
        </main>
      </body>
    </html>
  );
}
