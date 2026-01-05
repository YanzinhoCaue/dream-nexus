import { Inter, Oxanium } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-oxanium" });

export const metadata = {
  title: "Dream Nexus",
  description: "Visualize your future",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oxanium.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}