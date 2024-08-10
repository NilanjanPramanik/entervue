import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { SocketProvider } from "@/context/SocketProvider";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] });
const mostserrat = Montserrat({ subsets: ["latin"], weight: ["100", "300", "400", "500", "700"] })

export const metadata: Metadata = {
  title: "EnterVue",
  description: "Coding interviews is now easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={cn(mostserrat.className)}>
          <main className="bg-slate-950 min-h-screen">
            <Toaster />
            <Suspense>
              <SocketProvider>
                {children}
              </SocketProvider>
            </Suspense>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
