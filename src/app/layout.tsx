import type { Metadata } from "next";
import { Gaegu } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const gaegu = Gaegu({
  weight: ["300", "400", "700"],
  variable: "--font-gaegu",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "성장 일기",
  description: "매일 기록하고 성장하는 우리들의 일기장",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${gaegu.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF6EE] text-[#4A3E3D]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
