import { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import LayoutClient from "./layout-client";

const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

// DI SINI TEMPAT LOGO NYA
export const metadata: Metadata = {
  title: "Dashboard KOF",
  icons: {
    icon: "/assets/logolag.PNG",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <LayoutClient poppinsClass={fontPoppins.className}>
        {children}
      </LayoutClient>
    </html>
  );
}
