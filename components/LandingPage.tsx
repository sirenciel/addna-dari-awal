import React, { useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const faqs = [
    {
        question: "Apakah ini menggantikan desainer/copywriter saya?",
        answer: "Ini menggantikan *bottleneck* dari mereka. Anda beralih dari 'Manajer Proyek' (menunggu revisi) menjadi 'Operator Pabrik' (memproduksi ratusan ide). Desainer terbaik Anda bisa fokus pada strategi level tinggi, bukan pekerjaan produksi massal yang membosankan."
    },
    {
        question: "Apakah ini sulit digunakan? Butuh skill teknis?",
        answer: "Jika Anda bisa mengisi formulir, Anda bisa menggunakan KreatifOS. UI kami sengaja dibuat untuk 'memaksa' Anda berpikir strategis (Peta Perang), lalu AI yang akan melakukan pekerjaan berat (Produksi Massal). Tidak perlu coding atau skill desain."
    },
    {
        question: "Ini cocok untuk industri apa?",
        answer: "Sistem ini terbukti bekerja untuk E-commerce, Info Produk, SaaS, Agensi, dan bisnis apa pun yang bergantung pada iklan berbayar (Facebook, TikTok, Google) untuk bertumbuh. Jika Anda perlu menguji banyak angle untuk menemukan pemenang, Anda butuh sistem ini."
    }
];


export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    
    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <>
        <style>{`
            body {
            font-family: 'Inter', sans-serif;
            background-color: #020617; /* slate-950 */
            color: #e2e8f0; /* slate-200 */
            }

            /* Efek "glitch" untuk kata "berharap" */
            @keyframes glitch {
            0% { text-shadow: 0.5px 0 0 #f87171, -0.5px 0 0 #3b82f6; opacity: 1; }
            25% { opacity: 0.8; }
            50% { text-shadow: -0.5px 0 0 #f87171, 0.5px 0 0 #3b82f6; opacity: 1; }
            75% { opacity: 0.7; }
            100% { text-shadow: 0.5px 0 0 #f87171, -0.5px 0 0 #3b82f6; opacity: 1; }
            }

            .glitch {
            animation: glitch 0.3s infinite alternate;
            }

            /* Efek pulse untuk tombol CTA utama */
            @keyframes pulse-intense {
            0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
            }
            50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px 10px rgba(22, 163, 74, 0);
            }
            }

            .cta-button {
            background-color: #22c55e; /* green-500 */
            color: #020617; /* slate-950 */
            animation: pulse-intense 2s infinite;
            }

            .cta-button:hover {
            animation: none;
            transform: scale(1.05);
            background-color: #16a34a; /* green-600 */
            }

            .glass-card {
            background: rgba(15, 23, 42, 0.6); /* slate-900/60 */
            backdrop-filter: blur(10px);
            border: 1px solid rgba(51, 65, 85, 0.5); /* slate-700/50 */
            }

            /* Styling untuk FAQ Accordion */
            .faq-content {
            transition: max-height 0.3s ease-out;
            }
        `}</style>
        <div className="antialiased scroll-smooth">
            {/* Bagian Hero / Hook */}
            <header className="min-h-screen flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                {/* Efek Latar Belakang - Grid Khas "OS" */}
                <div className="absolute inset-0 z-0 opacity-10">
                    <div style={{backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)", backgroundSize: "40px 40px"}} className="w-full h-full"></div>
                </div>
                
                <div className="z-10 max-w-4xl">
                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter">
                    Iklan Anda Adalah
                    <span className="block text-red-500 underline decoration-red-500 decoration-wavy">Perjudian Mahal.</span>
                  </h1>
                  
                  <p className="mt-8 text-xl md:text-3xl text-slate-300 max-w-2xl mx-auto">
                    Anda tidak sedang "mengetes". Anda sedang
                    <span className="font-bold text-yellow-400 glitch">"berharap"</span>.
                  </p>
                  
                  <p className="mt-4 text-lg md:text-xl text-slate-400">
                    Anda "berharap" $1,000 yang akan Anda bakar minggu ini akan menghasilkan sesuatu. Berhenti berharap. <span className="font-bold text-white">Harapan bukan strategi.</span>
                  </p>

                  <div className="mt-12">
                    <button onClick={onStart} className="cta-button font-black text-xl md:text-2xl uppercase py-5 px-12 rounded-lg shadow-2xl shadow-green-500/30 transition-all duration-300">
                      Instal Sistem Saya (Gratis 14 Hari)
                    </button>
                    <p className="mt-4 text-green-400 font-semibold">
                      Tanpa Kartu Kredit. Jaminan $100.
                    </p>
                  </div>
                </div>
            </header>
            
            {/* Bagian Masalah: Siklus Neraka (Versi 2: Visual Loop) */}
            <section className="py-20 px-6 bg-slate-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black text-center">
                        Proses Anda Adalah <span className="text-red-500">Bottleneck</span>
                    </h2>
                    <p className="text-center text-xl text-slate-400 mt-4 max-w-3xl mx-auto">
                        Anda mengulangi "Siklus Neraka" yang sama. Ini adalah perjudian mahal yang Anda sebut "marketing".
                    </p>
                    
                    {/* Tata Letak Siklus Visual */}
                    <div className="mt-16 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Card 01: Tebak */}
                          <div className="border-2 border-red-900 bg-red-900/10 p-6 rounded-lg relative overflow-hidden z-10">
                            <span className="absolute top-0 right-0 text-9xl font-black text-red-800/20 -translate-y-4 translate-x-4">01</span>
                            <h3 className="text-2xl font-bold text-red-400">Tebak Ide (Feeling)</h3>
                            <p className="mt-3 text-slate-300">
                              Scroll TikTok. Lihat kompetitor. Brief berdasarkan tebakan, bukan <span className="font-bold line-through">data</span>.
                            </p>
                            {/* Panah ke 02 (hanya di lg) */}
                            <svg className="w-16 h-16 text-red-700 absolute -right-16 top-1/2 -translate-y-1/2 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                          </div>
                          
                          {/* Card 02: Revisi */}
                          <div className="border-2 border-red-900 bg-red-900/10 p-6 rounded-lg relative overflow-hidden z-10">
                            <span className="absolute top-0 right-0 text-9xl font-black text-red-800/20 -translate-y-4 translate-x-4">02</span>
                            <h3 className="text-2xl font-bold text-red-400">Revisi Manual (Lambat)</h3>
                            <p className="mt-3 text-slate-300">
                              Tunggu 1-2 minggu. Bolak-balik revisi. Saat iklan jadi, <span className="font-bold">tren sudah basi.</span>
                            </p>
                            {/* Panah ke 03 (hanya di lg) */}
                            <svg className="w-16 h-16 text-red-700 absolute -right-16 top-1/2 -translate-y-1/2 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                          </div>
                          
                          {/* Card 03: Bakar Uang */}
                          <div className="border-2 border-red-900 bg-red-900/10 p-6 rounded-lg relative overflow-hidden z-10">
                            <span className="absolute top-0 right-0 text-9xl font-black text-red-800/20 -translate-y-4 translate-x-4">03</span>
                            <h3 className="text-2xl font-bold text-red-400">Bakar Uang (Boncos)</h3>
                            <p className="mt-3 text-slate-300">
                              Luncurkan 5 iklan. Bakar $500. <span className="font-bold text-red-300">Semuanya ZONK.</span> Anda tidak tahu MENGAPA.
                            </p>
                            {/* Panah ke 04 (hanya di lg) */}
                            <svg className="w-16 h-16 text-red-700 absolute -right-16 top-1/2 -translate-y-1/2 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                          </div>
                          
                          {/* Card 04: Ulangi */}
                          <div className="border-2 border-red-900 bg-red-900/10 p-6 rounded-lg relative overflow-hidden z-10">
                            <span className="absolute top-0 right-0 text-9xl font-black text-red-800/20 -translate-y-4 translate-x-4">04</span>
                            <h3 className="text-2xl font-bold text-red-400">Ulangi (Putus Asa)</h3>
                            <p className="mt-3 text-slate-300">
                              Salahkan algoritma. Salahkan audiens. Kembali ke Langkah 1: <span className="font-bold">Menebak lagi.</span>
                            </p>
                          </div>
                        </div>

                        {/* GARIS SIKLUS (Hanya di LG) */}
                        <div className="absolute h-32 w-full mt-8 hidden lg:block z-0" aria-hidden="true">
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 120" preserveAspectRatio="none">
                            {/* Panah melengkung dari 04 kembali ke 01 */}
                            <path d="M 900 60 C 900 110, 800 110, 500 110 C 200 110, 100 110, 100 60" 
                                  stroke="#ef4444" strokeWidth="4" fill="none" 
                                  strokeDasharray="10 10" />
                            {/* Kepala Panah di kiri (menunjuk ke 01) */}
                            <path d="M 100 60 L 115 50 M 100 60 L 115 70" stroke="#ef4444" strokeWidth="4" fill="none" />
                          </svg>
                          <span className="absolute left-1/2 -translate-x-1/2 top-20 text-red-500 font-bold text-lg uppercase tracking-wider">...Dan Siklus Neraka Berulang...</span>
                        </div>
                    </div>
                  
                    <div className="mt-16 lg:mt-48 text-center max-w-3xl mx-auto p-8 glass-card rounded-xl shadow-2xl">
                        <p className="text-2xl md:text-4xl font-bold">
                          Anda bukan <span className="text-cyan-400">Advertiser</span>. Anda adalah <span className="text-yellow-400">Manajer Proyek</span> yang frustrasi untuk proses yang tidak menghasilkan uang.
                        </p>
                    </div>
                </div>
            </section>
            
            {/* Bagian Solusi: Perajin vs Pabrik */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-center tracking-tighter">
                        Hentikan "Beriklan".<br/>Mulai <span className="text-cyan-400">"Menginstal Sistem".</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 text-left">
                        {/* Model Perajin (Rusak) */}
                        <div className="glass-card rounded-xl p-8 border-red-700 border-2 opacity-70">
                          <h3 className="text-3xl font-bold text-red-400">Model Perajin (Rusak)</h3>
                          <p className="text-lg text-slate-300 mt-2">Anda diajari model ini. Lambat, mahal, dan berisiko.</p>
                          <ul className="mt-6 space-y-3">
                            <li className="flex items-center text-lg">
                              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                              1 Ide, 1 Desainer
                            </li>
                            <li className="flex items-center text-lg">
                              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                              Sangat Lambat (1-2 Minggu)
                            </li>
                            <li className="flex items-center text-lg">
                              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                              Mahal & Berisiko (Berjudi)
                            </li>
                          </ul>
                        </div>
                        
                        {/* Model Pabrik (Logis) */}
                        <div className="glass-card rounded-xl p-8 border-cyan-500 border-2 shadow-2xl shadow-cyan-500/30">
                          <h3 className="text-3xl font-bold text-cyan-400">Model Pabrik (Logis)</h3>
                          <p className="text-lg text-slate-300 mt-2">Anda butuh ini. Instan, bisa diprediksi, dan terukur.</p>
                          <ul className="mt-6 space-y-3">
                            <li className="flex items-center text-lg">
                              <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              500 Ide, 0 Desainer
                            </li>
                            <li className="flex items-center text-lg">
                              <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Instan (5 Menit)
                            </li>
                            <li className="flex items-center text-lg">
                              <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Bisa Diprediksi (Sistem)
                            </li>
                          </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bagian Produk: KreatifOS */}
            <section className="py-20 px-6 overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-center text-2xl text-cyan-400 font-bold uppercase tracking-widest">Memperkenalkan</h2>
                    <p className="text-center text-6xl md:text-8xl font-black tracking-tighter" style={{background: "linear-gradient(to right, #22d3ee, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
                        KreatifOS
                    </p>
                    
                      {/* Fitur 1: Arsitektur Hipotesis */}
                      <div className="flex flex-col md:flex-row items-center gap-12 mt-20">
                        <div className="md:w-1/2">
                          <span className="text-6xl font-black text-slate-800">[1]</span>
                          <h3 className="text-4xl font-black mt-2">ARSITEKTUR HIPOTESIS</h3>
                          <p className="text-lg text-slate-300 mt-4">
                            Anda berhenti "brainstorming". Anda mulai <span className="font-bold text-white">merancang Peta Perang.</span> UI kami memaksa Anda untuk memetakan <span className="font-bold text-cyan-400">Persona</span> x <span className="font-bold text-cyan-400">Trigger Psikologis</span> x <span className="font-bold text-cyan-400">Angle</span>. Anda tahu *mengapa* Anda membuat iklan bahkan sebelum Anda membuatnya.
                          </p>
                        </div>
                        <div className="md:w-1/2 w-full">
                          {/* Mockup UI: Peta Hipotesis */}
                          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-2xl shadow-slate-900/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-slate-200">Peta Perang: Produk Skincare</span>
                              <div className="flex space-x-1.5">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              </div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-md">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">PERSONA</h4>
                                  <div className="space-y-2">
                                    <div className="bg-blue-600 text-white p-2 rounded-md text-sm">Ibu Muda (30-40)</div>
                                    <div className="bg-slate-700 text-slate-300 p-2 rounded-md text-sm">Remaja (18-25)</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">TRIGGER</h4>
                                  <div className="space-y-2">
                                    <div className="bg-purple-600 text-white p-2 rounded-md text-sm">Takut Kusam</div>
                                    <div className="bg-slate-700 text-slate-300 p-2 rounded-md text-sm">Ingin Cepat</div>
                                    <div className="bg-slate-700 text-slate-300 p-2 rounded-md text-sm">Hemat</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">ANGLE</h4>
                                  <div className="space-y-2">
                                    <div className="bg-teal-600 text-white p-2 rounded-md text-sm">"5 Menit Glowing"</div>
                                    <div className="bg-teal-600 text-white p-2 rounded-md text-sm">"Hasil Sejak Hari 1"</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Fitur 2: Pabrik Produksi Massal */}
                      <div className="flex flex-col md:flex-row-reverse items-center gap-12 mt-24">
                        <div className="md:w-1/2">
                          <span className="text-6xl font-black text-slate-800">[2]</span>
                          <h3 className="text-4xl font-black mt-2">PABRIK PRODUKSI MASSAL</h3>
                          <p className="text-lg text-slate-300 mt-4">
                            Pilih Peta Perang Anda. Tekan <span className="font-bold text-white bg-cyan-600 px-2 py-1 rounded-md">"CETAK"</span>. AI kami akan <span className="font-bold text-white">memuntahkan 500 varian</span> (Hook, Headline, Gambar) dalam 5 menit. Desainer Anda butuh 5 bulan.
                          </p>
                        </div>
                        <div className="md:w-1/2 w-full">
                          {/* Mockup UI: Galeri Varian */}
                          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-2xl shadow-slate-900/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-slate-200">Galeri Varian: 512 Aset Dibuat</span>
                              <div className="flex space-x-1.5">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              </div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-md h-64 overflow-y-scroll">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-700 rounded h-24 flex items-center justify-center text-slate-500 text-xs">[Varian Iklan 1]</div>
                                <div className="bg-slate-700 rounded h-24 flex items-center justify-center text-slate-500 text-xs">[Varian Iklan 2]</div>
                                <div className="bg-slate-700 rounded h-24 flex items-center justify-center text-slate-500 text-xs">[Varian Iklan 3]</div>
                                <div className="bg-slate-700 rounded h-24 flex items-center justify-center text-slate-500 text-xs">[Varian Iklan 4]</div>
                                <div className="bg-slate-700 rounded h-24 flex items-center justify-center text-slate-500 text-xs">[Varian Iklan 5]</div>
                                <div className="bg-slate-700 rounded h-24 flex items-center justify-center text-slate-500 text-xs">[Varian Iklan 6]</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Fitur 3: Dasbor Eliminasi */}
                      <div className="flex flex-col md:flex-row items-center gap-12 mt-24">
                        <div className="md:w-1/2">
                          <span className="text-6xl font-black text-slate-800">[3]</span>
                          <h3 className="text-4xl font-black mt-2">DASBOR ELIMINASI</h3>
                          <p className="text-lg text-slate-300 mt-4">
                            Hubungkan Ad Account Anda. Sistem kami tidak memberi Anda "data" yang rumit. Sistem kami memberi Anda <span className="font-bold text-white">jawaban</span>. Ini <span className="text-green-400 font-bold">PROFIT</span>. Itu <span className="text-red-400 font-bold">BONCOS</span>. Matikan yang boncos, skalakan yang profit.
                          </p>
                        </div>
                        <div className="md:w-1/2 w-full">
                          {/* Mockup UI: Dashboard Profit/Boncos */}
                          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-2xl shadow-slate-900/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-slate-200">Dasbor Eliminasi</span>
                              <div className="flex space-x-1.5">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                              </div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-md">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Kolom Profit */}
                                <div>
                                  <h4 className="text-lg font-bold text-green-400 mb-3">PROFIT (SKALAKAN)</h4>
                                  <div className="space-y-2">
                                    <div className="bg-green-900/50 border border-green-700 p-3 rounded-md">
                                      <span className="text-sm text-slate-300">Angle: "Hasil Hari 1"</span>
                                      <span className="text-lg font-bold block text-green-300">+ $1,204</span>
                                    </div>
                                    <div className="bg-green-900/50 border border-green-700 p-3 rounded-md">
                                      <span className="text-sm text-slate-300">Angle: "5 Menit Glowing"</span>
                                      <span className="text-lg font-bold block text-green-300">+ $980</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Kolom Boncos */}
                                <div>
                                  <h4 className="text-lg font-bold text-red-400 mb-3">BONCOS (MATIKAN)</h4>
                                  <div className="space-y-2">
                                    <div className="bg-red-900/50 border border-red-700 p-3 rounded-md">
                                      <span className="text-sm text-slate-300">Angle: "Hemat"</span>
                                      <span className="text-lg font-bold block text-red-300">- $310</span>
                                    </div>
                                    <div className="bg-red-900/50 border border-red-700 p-3 rounded-md">
                                      <span className="text-sm text-slate-300">Angle: "Beli 1 Gratis 1"</span>
                                      <span className="text-lg font-bold block text-red-300">- $250</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                </div>
            </section>
            
            {/* Bagian Kualifikasi (Siapa) */}
            <section className="py-20 px-6 bg-slate-900">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* BUKAN UNTUK ANDA */}
                    <div className="glass-card p-8 rounded-xl border-red-700">
                        <h3 className="text-3xl font-bold text-red-400">INI BUKAN UNTUK ANDA JIKA...</h3>
                        <ul className="mt-6 space-y-4 text-lg text-slate-300">
                            <li className="flex">
                                <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Anda mencari "tombol ajaib" tanpa strategi.
                            </li>
                            <li className="flex">
                                <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Anda menyalahkan "algoritma" alih-alih "iklan Anda".
                            </li>
                        </ul>
                    </div>
                    
                    {/* HANYA UNTUK ANDA */}
                      <div className="glass-card p-8 rounded-xl border-green-500 shadow-2xl shadow-green-500/20">
                        <h3 className="text-3xl font-bold text-green-400">INI HANYA UNTUK ANDA JIKA...</h3>
                        <ul className="mt-6 space-y-4 text-lg text-slate-200">
                          <li className="flex">
                            <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Anda <span className="font-bold">terobsesi</span> dengan ROAS dan profit.
                          </li>
                          <li className="flex">
                            <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Anda <span className="font-bold">benci bottleneck manual</span> (desainer, dll).
                          </li>
                        </ul>
                      </div>
                </div>
            </section>
            
            {/* [BARU] Bagian Bukti Sosial (Testimoni) */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black text-center">
                        Jangan Percaya Klaim Kami.<br/>
                        Percaya <span className="text-cyan-400">Hasil Mereka</span>.
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {/* Testimoni 1 */}
                        <div className="glass-card rounded-xl p-8">
                            <p className="text-lg text-slate-300 italic">"Ini gila. Kami menemukan 3 angle pemenang dalam 48 jam pertama. Biasanya butuh 2 minggu dan $2,000 untuk data yang sama."</p>
                            <p className="text-5xl font-black text-green-400 mt-6">+3.8x ROAS</p>
                            <div className="flex items-center mt-6 pt-6 border-t border-slate-700">
                                <img className="w-14 h-14 rounded-full" src="https://placehold.co/100x100/334155/e2e8f0?text=AD" alt="Foto profil Angga D."/>
                                <div className="ml-4">
                                    <p className="font-bold text-white text-lg">Angga D.</p>
                                    <p className="text-sm text-cyan-400">Founder, Brand Skincare</p>
                                </div>
                            </div>
                        </div>
                        {/* Testimoni 2 */}
                        <div className="glass-card rounded-xl p-8">
                            <p className="text-lg text-slate-300 italic">"Sistem ini menggantikan 2 desainer full-time dan 1 copywriter kami. Bukan cuma lebih cepat, tapi hasilnya JAUH lebih profit."</p>
                            <p className="text-5xl font-black text-green-400 mt-6">-$8,000/bln</p>
                            <p className="text-lg text-slate-400">(Biaya Operasional)</p>
                            <div className="flex items-center mt-6 pt-6 border-t border-slate-700">
                                <img className="w-14 h-14 rounded-full" src="https://placehold.co/100x100/334155/e2e8f0?text=RF" alt="Foto profil Rina F."/>
                                <div className="ml-4">
                                    <p className="font-bold text-white text-lg">Rina F.</p>
                                    <p className="text-sm text-cyan-400">CMO, Agensi Digital</p>
                                </div>
                            </div>
                        </div>
                        {/* Testimoni 3 */}
                        <div className="glass-card rounded-xl p-8">
                            <p className="text-lg text-slate-300 italic">"Saya beralih dari 'menebak-nebak' menjadi operator pabrik. Ad fatigue warning system-nya saja sudah bernilai 10x lipat dari harganya."</p>
                            <p className="text-5xl font-black text-green-400 mt-6">90%</p>
                            <p className="text-lg text-slate-400">(Waktu Tes Berkurang)</p>
                            <div className="flex items-center mt-6 pt-6 border-t border-slate-700">
                                <img className="w-14 h-14 rounded-full" src="https://placehold.co/100x100/334155/e2e8f0?text=B" alt="Foto profil Bima"/>
                                <div className="ml-4">
                                    <p className="font-bold text-white text-lg">Bima</p>
                                    <p className="text-sm text-cyan-400">Media Buyer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Bagian Value Stack & Harga */}
            <section className="py-20 px-6 bg-slate-900">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black">
                        Anda Tidak Membeli "Software".<br/>
                        Anda Menginstal <span className="text-cyan-400">"Aset Pencetak Uang"</span>.
                    </h2>
                    <p className="text-xl text-slate-300 mt-4">
                        Inilah yang Anda dapatkan saat Anda menginstal KreatifOS hari ini:
                    </p>
                    
                    <div className="space-y-4 mt-12 text-left">
                        <div className="glass-card p-6 rounded-lg flex justify-between items-center">
                          <span className="text-lg text-slate-200">1. PABRIK KREATIFOS LENGKAP</span>
                          <span className="text-lg font-bold text-slate-400 line-through">(Nilai: $2,997)</span>
                        </div>
                        <div className="glass-card p-6 rounded-lg flex justify-between items-center">
                          <span className="text-lg text-slate-200">2. DATABASE "ANGLE PEMENANG"</span>
                          <span className="text-lg font-bold text-slate-400 line-through">(Nilai: $997)</span>
                        </div>
                        <div className="glass-card p-6 rounded-lg flex justify-between items-center">
                          <span className="text-lg text-slate-200">3. SISTEM PERINGATAN "AD FATIGUE"</span>
                          <span className="text-lg font-bold text-slate-400 line-through">(Nilai: $1,997)</span>
                        </div>
                      </div>
                      
                      <p className="text-2xl text-slate-400 font-bold mt-8 line-through">
                        Total Nilai: $5,991
                      </p>
                      <p className="text-xl text-slate-300 mt-8">Harga Instalasi Anda Hari Ini:</p>
                      <p className="text-7xl font-black text-white my-4">$297<span className="text-3xl text-slate-400">/bulan</span></p>
                      
                      <p className="text-lg text-slate-400 max-w-lg mx-auto p-4 bg-slate-800 rounded-md">
                        (Lebih murah dari gaji 1 desainer freelance lambat yang Anda bayar untuk membuat Anda frustrasi.)
                      </p>
                </div>
            </section>
            
            {/* Bagian Jaminan Gila */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto bg-yellow-400 text-slate-900 p-10 rounded-xl shadow-2xl shadow-yellow-400/30">
                    <h2 className="text-4xl md:text-5xl font-black text-center">
                        Jaminan Paling Gila yang Pernah Anda Dengar.
                    </h2>
                    <p className="text-center text-3xl font-bold mt-4">
                        Garansi 14 Hari: "Temukan Winner Atau Kami Bayar Anda $100"
                    </p>
                    <div className="bg-slate-900 text-white p-6 rounded-lg mt-8 text-center">
                        <p className="text-xl font-bold uppercase">Ini Bagian Pentingnya:</p>
                        <p className="text-lg mt-2">
                            Jika Anda lanjut berlangganan, dan dalam 14 hari ke depan Anda tidak menemukan <span className="font-bold text-yellow-400 underline">SATU "Angle Pemenang" BARU</span> yang profit...
                        </p>
                        <p className="text-xl font-bold mt-4">
                            ...Kirim email kepada kami. Kami tidak hanya akan mengembalikan $297 Anda.
                            <span className="block text-3xl mt-2 text-yellow-400">KAMI AKAN MEMBAYAR ANDA $100 TUNAI</span>
                            sebagai permintaan maaf karena telah membuang waktu Anda.
                        </p>
                    </div>
                    
                    <p className="text-2xl font-bold text-center mt-8">
                        Anda tidak mungkin rugi.
                        <span className="block text-red-700">Satu-satunya cara Anda rugi adalah dengan MENUTUP HALAMAN INI.</span>
                    </p>
                </div>
            </section>
            
            {/* [BARU] Bagian FAQ (Frequently Asked Questions) */}
            <section className="py-20 px-6 bg-slate-900">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-12">
                        Pertanyaan yang Sering Muncul
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="glass-card rounded-lg overflow-hidden">
                                <button onClick={() => toggleFaq(index)} className="faq-toggle flex justify-between items-center w-full p-6 text-left">
                                    <span className="text-xl font-bold text-slate-100">{faq.question}</span>
                                    <svg className={`faq-icon w-6 h-6 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                <div className="faq-content max-h-0 overflow-hidden px-6" style={{ maxHeight: openFaq === index ? '200px' : '0' }}>
                                    <p className="pb-6 text-slate-300">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Bagian Pilihan Terakhir (Versi 2: Kontras Kuat) */}
            <section className="py-20 px-6" id="instal">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black text-center">Anda Punya 2 Pilihan.</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20">
                        {/* Pilihan 1: Perajin (Rusak) - DIBUAT PUDAR & ABU-ABU */}
                        <div className="glass-card p-8 rounded-xl border-red-900 border-2 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                          <h3 className="text-3xl font-bold text-red-400">PILIHAN 1: JALAN PERAJIN (RUSAK)</h3>
                          <p className="text-lg text-slate-300 mt-4">
                            Tutup halaman ini. Kembali ke "Siklus Neraka". Kembali ke "feeling" Anda. Kembali membakar uang dan berharap "beruntung" bulan depan.
                          </p>
                          <div className="mt-6 h-2 w-full bg-red-900 rounded-full"></div>
                        </div>
                        
                        {/* Pilihan 2: Pabrik (Logis) - DIBUAT BERSINAR & BESAR */}
                        <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl shadow-cyan-400/60 transform md:scale-110 border-4 border-cyan-300">
                          <h3 className="text-3xl font-bold text-green-600">PILIHAN 2: JALAN PABRIK (LOGIS)</h3>
                          <p className="text-lg text-slate-700 mt-4">
                            Tekan tombol di bawah. Ambil Uji Coba 14 Hari <span className="font-bold">TANPA RISIKO</span>. Instal sistem Anda. Biarkan kami buktikan kami bisa mencetak "Winner" untuk Anda. Dan jika kami gagal, <span className="font-bold">kami bayar Anda.</span>
                          </p>
                          <div className="mt-6 h-2 w-full bg-green-500 rounded-full"></div>
                        </div>
                    </div>

                    <div className="mt-24 text-center">
                        <button onClick={onStart} className="cta-button font-black text-xl md:text-2xl uppercase py-5 px-12 rounded-lg shadow-2xl shadow-green-500/30 transition-all duration-300">
                          Instal Sistem Saya (Gratis 14 Hari)
                        </button>
                        <p className="mt-4 text-green-400 font-semibold text-lg">
                          Tanpa Kartu Kredit. Tanpa Risiko. Jaminan $100.
                        </p>
                    </div>
                </div>
            </section>
            
            {/* Footer */}
            <footer className="text-center py-12 px-6 border-t border-slate-800">
                <p className="text-slate-500">&copy; 2025 KreatifOS. Semua Hak Dilindungi.</p>
            </footer>
        </div>
        </>
    );
};
