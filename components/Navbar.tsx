import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-zim-blue text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-center items-center">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="flex flex-col items-center">
            <span className="font-display font-black text-2xl leading-none tracking-tight">
              LA NUEVA
            </span>
            <span className="text-sm font-bold tracking-widest bg-zim-orange px-2 rounded-sm mt-1 text-white shadow-sm">
              106.7 FM
            </span>
          </div>
        </Link>

        {/* Desktop Menu - Removed as per request (Single Page Mode) */}

        {/* Optional: Add Social Icons or a simple 'Live' indicator here if needed later */}
      </div>
    </nav>
  );
}
