"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Terintegrasi", "Transparan", "Otomatis", "Kolaboratif"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full" >
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="bg-white/70  rounded-3xl border border-white/40 shadow-xl px-6 py-12 md:px-16 md:py-16 flex gap-8 items-center justify-center flex-col max-w-4xl">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Sistem Informasi Manajemen Kegiatan{" "}
              <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-slate-800">Kegiatan Kerja</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold text-purple-600"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-slate-500 max-w-2xl text-center">
              Platform koordinasi kegiatan terpusat untuk mengurangi tumpang
              tindih agenda dan meningkatkan kepatuhan administrasi bukti dukung
              lintas tim kerja di BPS Kabupaten Flores Timur.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Link href="#fitur">
              <Button size="lg" className="gap-4" variant="outline">
                Pelajari Fitur <CalendarDays className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="gap-4">
                Mulai Sekarang <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
