import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Import your AuthProvider - double check this path matches your file structure
import { AuthProvider } from "@/components/Auth/AuthProvider"; 
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ohmify",
  description: "Leetcode for electronics engineers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 1. Wrap everything in AuthProvider */}
        <AuthProvider>
          {/* 2. Navbar is now global and has access to Auth Context */}
          <Navbar /> 
          
          {/* 3. The rest of your pages load here */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}