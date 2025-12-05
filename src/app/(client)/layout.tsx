"use client";

import "../globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";
import Providers from "@/components/providers";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import SideMenu from "@/components/sideMenu";
import { NavigationLoader } from "@/components/NavigationLoader";
import { TestLoaderButton } from "@/components/test-loader-button";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const metadata = {
  title: "FoloUp",
  description: " AI-powered Interviews",
  openGraph: {
    title: "FoloUp",
    description: "AI-powered Interviews",
    siteName: "FoloUp",
    images: [
      {
        url: "/foloup.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/browser-client-icon.ico" />
      </head>
      <body
        className={cn(
          inter.className,
          "antialiased overflow-hidden min-h-screen",
        )}
      >
        <ClerkProvider
          signInFallbackRedirectUrl={"/dashboard"}
          afterSignOutUrl={"/sign-in"}
        >
          <Providers>
            <NavigationLoader />
            {!pathname.includes("/sign-in") &&
              !pathname.includes("/sign-up") && <Navbar />}
            <div className="flex flex-row h-screen">
              {!pathname.includes("/sign-in") &&
                !pathname.includes("/sign-up") && <SideMenu />}
              <div className="ml-[200px] pt-[64px] h-full overflow-y-auto flex-grow">
                {children}
              </div>
            </div>
            <TestLoaderButton />
            <Toaster />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
