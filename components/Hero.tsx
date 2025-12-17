import { Play } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full flex items-center justify-center pt-8 pb-4 shrink-0">
      {/* Abstract Background Element - "Oaxacan" feel with warmth */}
      <div className="absolute top-0 right-0 w-2/3 h-full bg-zim-orange/10 rounded-l-full blur-3xl transform translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-2/3 bg-zim-gold/10 rounded-r-full blur-3xl transform -translate-x-1/4"></div>

      <div className="container mx-auto px-4 z-10 flex flex-col items-center">
        {/* Main Logo - Prominent */}
        <div className="w-full max-w-[280px] md:max-w-[340px] relative flex justify-center animate-fade-in-up">
          <div className="relative w-full aspect-square">
            <Image
              src="/logo.png"
              alt="Logo Zimatlán Radio"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
