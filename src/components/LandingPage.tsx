import React from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Code, 
  Cpu, 
  ArrowRight, 
  Shield, 
  Zap, 
  Layers, 
  Globe 
} from 'lucide-react';

interface LandingPageProps {
  onStartChat: () => void;
}

export function LandingPage({ onStartChat }: LandingPageProps) {
  const headline = "Asisten AI Pemikiran Mendalam untuk Kode Nyata Anda.";
  const words = headline.split(" ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#F4F2EC] to-[#EAE7DC] text-[#1F1F1E] flex flex-col relative overflow-x-hidden overflow-y-auto scroll-smooth">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Fluxel Logo" className="w-6 h-6 object-contain" />
          <span className="font-serif text-2xl font-bold tracking-tight text-[#1F1F1E]">Fluxel</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">v2.0</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onStartChat}
            className="hidden md:flex items-center gap-1.5 px-6 py-2.5 bg-[#1F1F1E] text-white rounded-[200px] text-sm font-medium hover:bg-black transition-all shadow-sm"
          >
            Start Chat <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 flex flex-col justify-center items-center text-center z-10 py-16 md:py-24">
        <div className="mb-4" />

        <motion.h1 
          className="font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1F1F1E] max-w-4xl leading-[1.2] md:leading-[1.1] mb-6 flex flex-wrap justify-center gap-x-2 gap-y-1 md:gap-x-4"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              }
            }
          }}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, idx) => {
            const isBlue = word === "Kode" || word === "Nyata";
            return (
              <motion.span
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    transition: { duration: 0.4, ease: "easeOut" } 
                  }
                }}
                className={isBlue ? "text-blue-600" : ""}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.h1>

        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mb-12 leading-relaxed font-sans px-4">
          Selamat datang di Fluxel. Platform kecerdasan buatan revolusioner dengan logika, pragmatisme, dan pola pikir mendalam seperti manusia programmer berpengalaman. Membantu Anda merancang kode nyata secara instan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-24 w-full justify-center px-4 max-w-md sm:max-w-xl">
          <button 
            onClick={onStartChat}
            className="px-6 py-3.5 bg-[#1F1F1E] text-white rounded-[200px] text-base font-semibold hover:bg-black transition-all shadow-lg hover:shadow-black/10 flex items-center justify-center gap-2 group flex-1"
          >
            Start Chat <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="#features"
            className="px-6 py-3.5 bg-white/85 border border-gray-200 hover:bg-white text-gray-800 rounded-[200px] text-base font-semibold transition-all shadow-sm flex items-center justify-center gap-2 flex-1"
          >
            Pelajari Fitur
          </a>
        </div>

        {/* Fitur Premium & Utama */}
        <section id="features" className="w-full pt-16 border-t border-gray-200/60 text-left max-w-5xl mx-auto mb-12 scroll-mt-24">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Keunggulan Utama</span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mt-2 text-[#1F1F1E]">
              Fitur Eksklusif Fluxel AI
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mt-2 text-sm">
              Tingkatkan standar pengembangan software Anda ke level tertinggi dengan fitur cerdas kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fitur Premium 1 */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/60 p-6 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md relative overflow-hidden group">
              <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Utama
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2 text-[#1F1F1E]">
                Otak Programmer Senior
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Membantu Anda memecahkan algoritma rumit, optimasi query basis data, hingga penataan arsitektur kode berskala besar dengan logika matang.
              </p>
            </div>

            {/* Fitur Premium 2 */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/60 p-6 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md relative overflow-hidden group">
              <div className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Premium
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4 text-amber-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2 text-[#1F1F1E]">
                Security Audit & Audit Kode
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Mendeteksi celah keamanan berbahaya, mencegah injeksi data SQL, XSS, serta kebocoran memori secara instan sebelum masuk produksi.
              </p>
            </div>

            {/* Fitur Premium 3 */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/60 p-6 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md relative overflow-hidden group">
              <div className="absolute top-3 right-3 bg-purple-100 text-purple-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Premium
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 text-purple-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2 text-[#1F1F1E]">
                Optimasi Kinerja Kilat
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Mengidentifikasi bottleneck, merekomendasikan teknik caching, restrukturisasi asinkronus, serta meningkatkan efisiensi eksekusi memori program.
              </p>
            </div>

            {/* Fitur Premium 4 */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/60 p-6 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 text-green-600">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2 text-[#1F1F1E]">
                Kode Riil Multi-Bahasa
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Fasih menulis kode bersih siap pakai dalam TypeScript, React, Node.js, Python, Go, Rust, SQL, HTML/CSS, dan berbagai bahasa modern lainnya.
              </p>
            </div>

            {/* Fitur Premium 5 */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/60 p-6 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mb-4 text-pink-600">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2 text-[#1F1F1E]">
                Arsitektur Desain Bersih
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kepatuhan ketat terhadap prinsip clean code SOLID, MVC, DRY (Don't Repeat Yourself), meningkatkan modularitas agar kode mudah dipelihara.
              </p>
            </div>

            {/* Fitur Premium 6 */}
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200/60 p-6 rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md relative overflow-hidden group">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 text-teal-600">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2 text-[#1F1F1E]">
                Dukungan Integrasi API
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Memudahkan rancangan integrasi RESTful API, GraphQL, serta OAuth otentikasi eksternal dengan cara yang paling aman dan mutakhir.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
