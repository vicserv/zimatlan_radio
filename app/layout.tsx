import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google"; // Import new fonts
import "./globals.css";

// Configure Montserrat for Titles (Bold/Black)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700", "900"], // Bold and Black as requested
});

// Configure Roboto for Body Text
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Radio La Nueva - Zimatlán 106.7 FM",
  description: "La Nueva Zimatlán",
  icons: {
    icon: "/logo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${roboto.variable} antialiased font-roboto`} // Set Roboto as default for body
      >
        {children}
      </body>
    </html>
  );
}
