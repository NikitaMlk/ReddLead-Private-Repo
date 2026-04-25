import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "RedditSignal - Find High-Intent Reddit Leads",
  description: "Monitor subreddits and keywords to discover posts with buying signals, pain points, and competitor mentions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-[#09090b]`}>
        {children}
      </body>
    </html>
  );
}