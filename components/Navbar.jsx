"use client";

import React from "react";
import { useAuth } from "@/components/Auth/AuthProvider.jsx";
import { 
  UserCircle, Settings, Briefcase, GraduationCap, Coffee, 
  MessageSquare, LogOut, ExternalLink, Bell 
} from "lucide-react";

export default function Navbar({ color }) {
  const { user, loading, signIn, signOut } = useAuth();

  return (
    <div className="navbar min-h-12 h-12 shadow-xs text-base-content/80 bg-base-100 px-4 border-b border-base-200 transition-colors duration-300">
      
      {/* LEFT SECTION (brand) */}
      <div className="navbar-start">
        <a href="/" className={`flex font-bold items-center ${color ? `text-white` : `text-base-content`}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0d7406" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-omega mx-2">
            <path d="M3 20h4.5a.5.5 0 0 0 .5-.5v-.282a.52.52 0 0 0-.247-.437 8 8 0 1 1 8.494-.001.52.52 0 0 0-.247.438v.282a.5.5 0 0 0 .5.5H21"/>
          </svg>
          <span className="text-[1.7em] font-bold tracking-wide font-jersey">scope.io</span>
        </a>
      </div>

      {/* CENTER MENU */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 font-medium">
          <li><a className="hover:text-green-600 hover:bg-transparent" href="/problem">Problems</a></li>
          <li><a className="hover:text-cyan-600 hover:bg-base-200" href="/tools">Tools</a></li>
          <li><a className="hover:text-green-500 hover:bg-base-200" href="/ComingSoon">Contest</a></li>
          <li><a className="hover:text-green-500 hover:bg-base-200" href="/ComingSoon">Discuss</a></li>
          {(user?.role === "admin" || user?.role === "creator") && (
            <li><a className="text-green-600 font-bold hover:text-blue-600 hover:bg-base-200" href="/create">Create</a></li>
          )}
        </ul>
      </div>

      {/* RIGHT SECTION */}
      <div className="navbar-end flex items-center gap-3">
        <a href="/help" className="text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </a>

        {loading ? "" : user ? (
          <>
            <div className="flex items-center text-orange-600 text-xs font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
              </svg>
              {user.totalPoints || 0}
            </div>

            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="flex items-center font-bold text-xs hover:cursor-pointer"><Bell size={20} />{user?.notifications || 0}</div>
              <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-2xl bg-base-100 rounded-box w-64 border border-base-300 text-[15px] text-base-content">
                <li>
                  <a><Bell size={18}/> Notifications</a>
                </li>
                <li>
                  <p>No new notifications</p>
                </li>
              </ul>
            </div>

            {/* ENHANCED AVATAR DROPDOWN */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar hover:bg-green-200">
                <div className="w-8 rounded-full border">
                  <img alt="avatar" src={user.photoURL || "profile.png"} />
                </div>
              </div>
              
              <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-2xl bg-base-100 rounded-box w-64 border border-base-300 text-[15px] text-base-content">
                {/* Section 1: Account */}
                <li className="hover-bordered">
                  <a href="/profile"><UserCircle size={18}/> View Profile</a>
                </li>
                <li>
                  
                  <a href="/settings"><Settings size={18}/> Manage Account</a>
                </li>
              {user?.role === "admin" && (
              <li><a href="/admin"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
                Admin Dashboard</a></li>
                              )}

                <div className="divider my-1"></div>

                {/* Section 2: Links */}
                <li><a href="/business" className="justify-between">
                  <span className="flex items-center gap-2"><Briefcase size={18}/> For Business</span>
                  <ExternalLink size={14} className="opacity-50"/>
                </a></li>
                <li><a href="/education" className="justify-between">
                  <span className="flex items-center gap-2"><GraduationCap size={18}/> For Education</span>
                  <ExternalLink size={14} className="opacity-50"/>
                </a></li>

                <div className="divider my-1"></div>

                {/* Section 3: Support */}
                {/* include swag shop once it pops off... */}
                {/* <li><a className="justify-between">
                  <span className="flex items-center gap-2"><ShoppingCart size={18}/> Swag Shop</span>
                  <ExternalLink size={14} className="opacity-50"/>
                </a></li> */}

                <li><a><Coffee size={18}/> Buy Me Coffee</a></li>
                <li><a><MessageSquare size={18}/> Give Feedback</a></li>

                <div className="divider my-1"></div>

                {/* Logout */}
                <li>
                  <button onClick={signOut} className="flex items-center gap-2 hover:bg-red-50">
                    <LogOut size={18} /> Log Out
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <button onClick={signIn} className="btn btn-sm btn-outline btn-success font-bold px-4 rounded-full">
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}