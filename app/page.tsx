import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RadioPlayer from "@/components/RadioPlayer";
import ChatSystem from "@/components/ChatSystem";

export default function Home() {
  return (
    <main className="flex flex-col h-screen overflow-hidden bg-linear-to-br from-zim-cream to-white">
      <Navbar />

      <Hero />

      {/* Live Chat Section - Fills remaining space */}
      <section className="flex-1 flex flex-col min-h-0 relative pb-24 md:pb-28">
        {/* Padding bottom accounts for sticky player */}
        <div className="w-full max-w-6xl mx-auto px-2 md:px-4 flex-1 flex flex-col h-full">
          <ChatSystem />
        </div>
      </section>

      {/* Sticky Player */}
      <RadioPlayer />
    </main>
  );
}
