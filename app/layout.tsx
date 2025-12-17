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
  metadataBase: new URL("https://lanuevazimatlan1067fm.com.mx"),
  title: "Radio La Nueva - Zimatlán 106.7 FM | La Frecuencia Que Manda",
  description:
    "Escucha La Nueva Zimatlán 106.7 FM en vivo. La mejor música regional, noticias y entretenimiento desde Zimatlán de Álvarez, Oaxaca. Conéctate y envía tus saludos.",
  applicationName: "La Nueva Zimatlán App",
  authors: [
    { name: "Totonix Soluciones Tecnológicas", url: "https://totonix.com.mx" },
  ],
  generator: "Next.js",
  keywords: [
    "radio",
    "zimatlan",
    "oaxaca",
    "106.7 fm",
    "la nueva",
    "musica",
    "en vivo",
    "noticias",
    "sonidero",
    "cumbia",
    "regional mexicano",
    "radio online",
    "zimatlan de alvarez",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Totonix Soluciones",
  publisher: "La Nueva Zimatlán",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/logo.ico",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "La Nueva",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Radio La Nueva - Zimatlán 106.7 FM",
    description:
      "La Frecuencia Que Manda. Escúchanos en vivo desde Zimatlán, Oaxaca. Música, saludos y el mejor ambiente.",
    url: "https://lanuevazimatlan1067fm.com.mx/",
    siteName: "La Nueva Zimatlán 106.7 FM",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Logo La Nueva Zimatlán",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radio La Nueva - Zimatlán 106.7 FM",
    description:
      "La Frecuencia Que Manda. Transmitiendo desde Zimatlán de Álvarez, Oaxaca.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
