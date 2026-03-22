"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Map as MapIcon, School, Users, 
  BookOpen, Star, Rocket, GraduationCap, Globe,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from './context/LanguageContext';

const CenterMapClient = dynamic(() => import('../components/MapPickerClient'), { 
  ssr: false,
  loading: () => <div className="h-[450px] bg-gray-100 animate-pulse rounded-[2.5rem]" />
});

const translations: any = {
  UZ: {
    heroTitle: "Kelajagingiz uchun eng yaxshi bilim maskanini toping",
    heroDesc: "Barcha o'quv markazlari yagona platformada. Solishtiring va ro'yxatdan o'ting.",
    searchPlaceholder: "Markaz, fan yoki manzil...",
    viewMap: "Markazlar xaritada",
    topCenters: "Top o'quv markazlari",
    stats: ["Markazlar", "O'quvchilar", "Kurslar", "Reyting"],
    addCenter: "Hoziroq qo'shiling",
    more: "Batafsil",
    allView: "Hammasini ko'rish",
    subject: "fan",
    loading: "Yuklanmoqda..."
  },
  // RU va EN lug'atlarini ham shu tarzda davom ettiring...
};

export default function MarketplacePage() {
  const { currentLang } = useLanguage();
  const t = translations[currentLang || 'UZ']; 
  const [searchTerm, setSearchTerm] = useState("");
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Ma'lumotlarni API'dan tortib olish
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await fetch('/api/market/centers');
        const data = await res.json();
        setCenters(data);
      } catch (err) {
        console.error("Xatolik:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCenters();
  }, []);

  // 2. Qidiruv mantiqi
  const filteredCenters = useMemo(() => {
    return centers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, centers]);

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-24 pb-20 pt-10">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3.5rem] py-24 px-8 text-center text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto space-y-10">
          <div className="inline-flex items-center gap-2 bg-white/20 px-6 py-2.5 rounded-full backdrop-blur-md text-sm font-bold border border-white/10">
            <Rocket size={18} className="text-blue-200" /> {t.addCenter}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            {t.heroTitle}
          </h1>
          <p className="text-blue-100 text-xl max-w-2xl mx-auto opacity-90 font-medium">
            {t.heroDesc}
          </p>

          <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-3 bg-white p-2.5 rounded-[2.5rem] shadow-2xl">
            <div className="flex-1 relative bg-gray-50 rounded-[2rem]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                className="w-full pl-14 pr-6 py-5 bg-transparent text-gray-800 outline-none font-bold placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-blue-600 text-white hover:bg-blue-700 px-10 py-5 rounded-[2rem] font-black transition-all flex items-center justify-center">
              <Globe size={24}/>
            </button>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard icon={School} value={loading ? "..." : `${centers.length}+`} label={t.stats[0]} color="blue" />
        <StatCard icon={Users} value="25k+" label={t.stats[1]} color="indigo" />
        <StatCard icon={BookOpen} value="400+" label={t.stats[2]} color="emerald" />
        <StatCard icon={Star} value="4.8" label={t.stats[3]} color="amber" />
      </div>

      {/* MAP SECTION */}
      <section className="space-y-10 scroll-mt-28">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-black text-gray-900 flex items-center gap-4">
            <MapIcon className="text-blue-600" size={36} /> {t.viewMap}
          </h2>
          <div className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-2xl font-black text-sm border border-blue-100 uppercase tracking-widest">
            Uzbekiston
          </div>
        </div>
        <div className="rounded-[3.5rem] overflow-hidden border-[16px] border-white shadow-2xl h-[550px]">
          {!loading && <CenterMapClient centers={centers} />}
        </div>
      </section>

      {/* TOP CENTERS GRID */}
      <section className="space-y-12">
        <div className="flex items-center justify-between border-b border-gray-100 pb-8">
          <h2 className="text-4xl font-black text-gray-900 flex items-center gap-4">
            <Star className="text-amber-500 fill-amber-500" size={36} /> {t.topCenters}
          </h2>
          <Link href="/all-centers" className="text-blue-600 font-black flex items-center gap-2 hover:translate-x-1 transition-transform bg-blue-50 px-6 py-3 rounded-2xl">
            {t.allView} <ArrowRight size={20} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredCenters.map((center) => (
              <CenterCard key={center.id} center={center} btnText={t.more} subjectLabel={t.subject} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// YORDAMCHI KOMPONENTLAR

function SkeletonCard() {
  return (
    <div className="h-[500px] bg-gray-100 animate-pulse rounded-[3.5rem]" />
  );
}

function StatCard({ icon: Icon, value, label, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600"
  };
  return (
    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
      <div className={`${colors[color]} p-6 rounded-3xl`}><Icon size={36} /></div>
      <div>
        <div className="text-4xl font-black text-gray-900">{value}</div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </div>
  );
}

function CenterCard({ center, btnText, subjectLabel }: any) {
  return (
    <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group">
      <div className="h-64 bg-slate-100 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
         <div className="absolute inset-0 flex items-center justify-center text-slate-300">
           <GraduationCap size={120} className="group-hover:scale-110 transition-transform duration-700 opacity-20" />
         </div>
         <div className="absolute top-8 left-8 z-20 bg-blue-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-lg">TOP RATED</div>
         <div className="absolute bottom-8 left-8 z-20 text-white font-black text-xl flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl">
           <Star size={24} className="text-amber-400 fill-amber-400" /> {center.rating || 5.0}
         </div>
      </div>
      <div className="p-10 space-y-8">
        <h3 className="text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{center.name}</h3>
        <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed h-14 text-lg">{center.desc || "O'quv markazi haqida ma'lumot mavjud emas."}</p>
        <div className="flex items-center gap-8 py-6 border-y border-gray-50">
          <div className="flex items-center gap-3 text-base font-black text-gray-700"><Users size={24} className="text-blue-500" /> {center._count?.students || 0}</div>
          <div className="flex items-center gap-3 text-base font-black text-gray-700"><BookOpen size={24} className="text-indigo-500" /> {center._count?.courses || 0} {subjectLabel}</div>
        </div>
        <Link href={`/center/${center.id}`} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 group-hover:bg-blue-600 transition-all shadow-xl">
          {btnText} <ArrowRight size={24} />
        </Link>
      </div>
    </div>
  );
}
