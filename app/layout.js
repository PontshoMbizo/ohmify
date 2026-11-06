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
  title: "scope.io",
  description: "Leetcode for electronics engineers",
};

// Runs before paint: applies the theme preference saved by /settings
// ("scope-theme" in localStorage) so the page doesn't flash the default.
const themeInit = `(function(){try{var p=localStorage.getItem("scope-theme");if(!p||p==="dim")return;var t=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dim":"light"):p;document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dim" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300`}>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
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