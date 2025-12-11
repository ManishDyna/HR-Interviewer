"use client";

import React from "react";
import { PlayCircleIcon, SpeechIcon, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLoading } from "@/contexts/loading.context";

function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { startLoading } = useLoading();

  const handleNavigation = (path: string) => {
    // Don't show loader if already on the exact same page
    if (pathname === path) {
      return;
    }
    startLoading();
    router.push(path);
  };

  return (
    <div className="z-[10] bg-slate-100 p-6 w-[200px] fixed top-[64px] left-0 h-full" style={{ marginTop: '10px' }}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-col justify-between gap-2">
          <div
            className={`flex flex-row p-3 rounded-md hover:bg-slate-200 cursor-pointer ${
              pathname.endsWith("/dashboard") ||
              pathname.includes("/interviews")
                ? "bg-indigo-200"
                : "bg-slate-100"
            }`}
            onClick={() => handleNavigation("/dashboard")}
          >
            <PlayCircleIcon className="font-thin	 mr-2" />
            <p className="font-medium ">Interviews</p>
          </div>
          <div
            className={`flex flex-row p-3 rounded-md hover:bg-slate-200 cursor-pointer ${
              pathname.endsWith("/interviewers")
                ? "bg-indigo-200"
                : "bg-slate-100"
            }`}
            onClick={() => handleNavigation("/dashboard/interviewers")}
          >
            <SpeechIcon className="font-thin mr-2" />
            <p className="font-medium ">Interviewers</p>
          </div>
          <div
            className={`flex flex-row p-3 rounded-md hover:bg-slate-200 cursor-pointer ${
              pathname.endsWith("/users")
                ? "bg-indigo-200"
                : "bg-slate-100"
            }`}
            onClick={() => handleNavigation("/dashboard/users")}
          >
            <Users className="font-thin mr-2" />
            <p className="font-medium ">Users</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SideMenu;
