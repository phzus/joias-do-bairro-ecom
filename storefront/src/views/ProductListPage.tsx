'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useProducts, useCategories } from '@/lib/hooks';
import type { HttpTypes } from '@medusajs/types';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  highlighted?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, highlighted = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={highlighted ? 'mb-8 md:mb-12' : 'mb-12 md:mb-16'}
  >
    {highlighted && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 bg-[#c8102e]/10 border border-[#c8102e]/20 rounded-full px-4 py-1.5 mb-5"
      >
        <span className="w-2 h-2 rounded-full bg-[#c8102e] animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c8102e]">
          Compre agora
        </span>
      </motion.div>
    )}
    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#c8102e] mb-3">
      {subtitle}
    </p>
    <h2 className={`font-black uppercase tracking-tight text-white leading-none ${highlighted ? 'text-4xl md:text-6xl' : 'text-3xl md:text-5xl'}`}>
      {title}
    </h2>
    <div className={`mt-4 h-px bg-[#c8102e]/40 ${highlighted ? 'w-24' : 'w-16'}`} />
    {highlighted && (
      <p className="mt-4 text-xs md:text-sm text-zinc-500 max-w-lg">
        Edição limitada, qualidade premium. Joias do Bairro.
      </p>
    )}
  </motion.div>
);

const ProductsSectionHeader: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="relative mb-16 md:mb-24"
  >
    {/* Giant outlined watermark — purely decorative, reinforces "produtos" without competing for reading attention */}
    <span
      aria-hidden="true"
      className="pointer-events-none select-none absolute -top-6 md:-top-10 left-0 right-0 text-center text-[20vw] md:text-[9vw] font-black italic uppercase leading-none tracking-tighter text-transparent"
      style={{ WebkitTextStroke: '1px rgba(255,255,255,0.06)' }}
    >
      Produtos
    </span>

    <div className="relative flex flex-col items-center text-center pt-12 md:pt-16">
      <span className="inline-flex items-center gap-2 bg-[#c8102e]/10 border border-[#c8102e]/20 rounded-full px-4 py-1.5 mb-5">
        <span className="w-2 h-2 rounded-full bg-[#c8102e] animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">
          Arquivo Completo
        </span>
      </span>
      <h2 className="font-black uppercase italic tracking-tight text-white leading-none text-4xl md:text-6xl">
        Produtos
      </h2>
      <div className="mt-5 h-1 w-24 bg-[#c8102e]" />
    </div>
  </motion.div>
);

interface CategoryGroup {
  category: HttpTypes.StoreProductCategory;
  products: HttpTypes.StoreProduct[];
}

const StickerSection: React.FC<{ category: HttpTypes.StoreProductCategory, categoryProducts: HttpTypes.StoreProduct[], groupIdx: number }> = ({ category, categoryProducts, groupIdx }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section id={`category-${category.handle}`} className="relative">
      <div className="absolute -inset-x-4 -inset-y-8 md:-inset-x-6 md:-inset-y-12 bg-linear-to-b from-[#c8102e]/3 via-transparent to-transparent rounded-3xl pointer-events-none" />
      <div className="relative">
        <SectionHeader
          title={category.name}
          subtitle={`Drop ${String(groupIdx + 1).padStart(2, '0')} — Disponível`}
          highlighted
        />

        {/* Mobile Carousel */}
        <div className="block md:hidden relative -mx-4">
          <div className="overflow-hidden px-4" ref={emblaRef}>
            <div className="flex">
              {categoryProducts.map((product, idx) => (
                <div className="flex-[0_0_100%] min-w-0 pr-4" key={product.id}>
                  <ProductCard product={product} index={idx} featured />
                </div>
              ))}
            </div>
          </div>

          {categoryProducts.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-2 top-[40%] -translate-y-1/2 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:bg-[#c8102e] transition-colors z-10"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-2 top-[40%] -translate-y-1/2 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:bg-[#c8102e] transition-colors z-10"
                aria-label="Próximo"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categoryProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} featured />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductListPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const graffitiTextRef = useRef<HTMLHeadingElement>(null);
  const [cropScale, setCropScale] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('jdb-hero-crop');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 1, y: 1 };
  });
  const [videoVisible, setVideoVisible] = useState(() => {
    try { return !!localStorage.getItem('jdb-hero-crop'); } catch { return false; }
  });
  const { products, loading, error } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  const { groups, uncategorized } = useMemo(() => {
    if (!products.length || !categories.length) {
      return { groups: [] as CategoryGroup[], uncategorized: products };
    }

    const parentCategories = categories.filter(
      (cat) => !cat.parent_category_id
    );

    const groups: CategoryGroup[] = [];
    const categorizedProductIds = new Set<string>();

    for (const parentCat of parentCategories) {
      const categoryIds = new Set<string>([parentCat.id]);
      if (parentCat.category_children) {
        for (const child of parentCat.category_children) {
          categoryIds.add(child.id);
        }
      }

      const categoryProducts = products.filter((product) =>
        product.categories?.some((pc) => categoryIds.has(pc.id))
      );

      if (categoryProducts.length > 0) {
        groups.push({ category: parentCat, products: categoryProducts });
        categoryProducts.forEach((p) => categorizedProductIds.add(p.id));
      }
    }

    const PRIORITY_HANDLES = ['stickers', 'sticker', 'adesivos', 'adesivo'];

    groups.sort((a, b) => {
      const aHandle = a.category.handle?.toLowerCase() ?? '';
      const bHandle = b.category.handle?.toLowerCase() ?? '';
      const aPriority = PRIORITY_HANDLES.includes(aHandle) ? 0 : 1;
      const bPriority = PRIORITY_HANDLES.includes(bHandle) ? 0 : 1;
      return aPriority - bPriority;
    });

    const uncategorized = products.filter(
      (p) => !categorizedProductIds.has(p.id)
    );

    return { groups, uncategorized };
  }, [products, categories]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        }
      });

      heroTl.to(graffitiTextRef.current, {
        y: -100,
        scale: 0.9,
        opacity: 0,
        letterSpacing: "2em"
      }, 0);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const detectBars = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const W = Math.min(vw, 320);
      const H = Math.min(vh, 180);
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);

      const T = 20;
      const isBlack = (x: number, y: number) => {
        const i = (y * W + x) * 4;
        return data[i] < T && data[i + 1] < T && data[i + 2] < T;
      };
      const colAllBlack = (x: number) => {
        for (let y = 0; y < H; y++) if (!isBlack(x, y)) return false;
        return true;
      };
      const rowAllBlack = (y: number) => {
        for (let x = 0; x < W; x++) if (!isBlack(x, y)) return false;
        return true;
      };

      let left = 0;
      for (let x = 0; x < W >> 1; x++) { if (!colAllBlack(x)) { left = x; break; } }
      let right = W - 1;
      for (let x = W - 1; x > W >> 1; x--) { if (!colAllBlack(x)) { right = x; break; } }
      let top = 0;
      for (let y = 0; y < H >> 1; y++) { if (!rowAllBlack(y)) { top = y; break; } }
      let bottom = H - 1;
      for (let y = H - 1; y > H >> 1; y--) { if (!rowAllBlack(y)) { bottom = y; break; } }

      const contentW = right - left + 1;
      const contentH = bottom - top + 1;
      const scale = {
        x: contentW < W * 0.98 ? W / contentW : 1,
        y: contentH < H * 0.98 ? H / contentH : 1,
      };
      setCropScale(scale);
      setVideoVisible(true);
      try { localStorage.setItem('jdb-hero-crop', JSON.stringify(scale)); } catch {}
    };

    video.addEventListener('loadeddata', detectBars);
    if (video.readyState >= 2) detectBars();
    return () => video.removeEventListener('loadeddata', detectBars);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});

      const forcePlay = setInterval(() => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      }, 1000);

      return () => clearInterval(forcePlay);
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-[#050505] min-h-screen text-white carbon-pattern overflow-x-hidden">
      <div className="bg-flash fixed inset-0 opacity-0 pointer-events-none z-999" />

      <div className="relative">
        <section id="hero-section" className="relative w-full h-[80vh] md:min-h-screen flex items-center justify-center">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full overflow-hidden flex items-center justify-center transition-opacity duration-700 h-[80vh] md:h-auto md:w-screen ${videoVisible ? 'opacity-100' : 'opacity-0'}`}>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              onCanPlay={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {});
              }}
              onPause={(e) => {
                const video = e.currentTarget;
                video.play().catch(() => {});
              }}
              className="relative md:static left-[-11vw] md:left-auto h-full w-auto max-w-none md:max-w-full shrink-0 md:shrink-0 md:h-auto md:w-full pointer-events-none select-none"
              style={{
                transform: `scaleX(${cropScale.x}) scaleY(${cropScale.y})`,
                transformOrigin: 'center center',
              }}
            >
              <source src="/hero.webm" type="video/webm" />
              <source src="/hero.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="relative z-10 w-full flex flex-col items-center justify-center text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.55em] text-white/40 mb-3 md:mb-4"
            >
              LANÇAMENTO
            </motion.p>

            <h1
              ref={graffitiTextRef}
              className="font-black italic uppercase tracking-tight leading-none select-none w-full
                         text-[10vw] sm:text-[8vw] md:text-[7vw] lg:text-[6vw]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.42) 60%, rgba(255,255,255,0.15) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DROP #001
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.55em] text-white/40 mt-3 md:mt-4"
            >
              DISPONÍVEL
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 md:mt-10"
            >
              <button className="
                px-9 py-3 rounded-full
                border border-white/30 text-white
                text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em]
                bg-white/5 backdrop-blur-sm
                hover:bg-white hover:text-black hover:border-white
                transition-all duration-300
              ">
                ENTRE NA PRÉ-LISTA
              </button>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative z-10 space-y-16 md:space-y-24">
          {(loading || categoriesLoading) && (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-[#c8102e]" />
              <span className="ml-4 text-zinc-500 text-xs uppercase tracking-widest font-bold">Carregando Arquivo...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-[#c8102e] text-sm font-bold uppercase tracking-widest mb-4">Erro do Sistema</p>
              <p className="text-zinc-600 text-xs">{error}</p>
            </div>
          )}

          {!loading && !categoriesLoading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Nenhum produto no arquivo ainda</p>
            </div>
          )}

          {!loading && !categoriesLoading && !error && groups.map(({ category, products: categoryProducts }, groupIdx) => {
            const STICKER_HANDLES = ['stickers', 'sticker', 'adesivos', 'adesivo'];
            const isSticker = STICKER_HANDLES.includes(category.handle?.toLowerCase() ?? '');

            if (isSticker) {
              return (
                <StickerSection
                  key={category.id}
                  category={category}
                  categoryProducts={categoryProducts}
                  groupIdx={groupIdx}
                />
              );
            }

            return (
              <section key={category.id} id={`category-${category.handle}`}>
                <SectionHeader
                  title={category.name}
                  subtitle={`Coleção ${String(groupIdx + 1).padStart(2, '0')}`}
                />
                <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14">
                  {categoryProducts.map((product, idx) => (
                    <div key={product.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)]">
                      <ProductCard product={product} index={idx} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {!loading && !categoriesLoading && !error && uncategorized.length > 0 && (
            <section id="uncategorized-section" className="min-h-dvh flex flex-col justify-center">
              <ProductsSectionHeader />
              <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14">
                {uncategorized.map((product, idx) => (
                  <div key={product.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)]">
                    <ProductCard product={product} index={idx} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
