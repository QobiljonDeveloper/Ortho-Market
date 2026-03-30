import { useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { useProducts } from './hooks/useProducts';
import { motion, AnimatePresence } from 'framer-motion';
import { TelegramAuthDebug } from './components/TelegramAuthDebug';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OrderDetails } from './components/OrderDetails';

// Telegram WebApp e'lon qilinishi (TypeScript uchun)
declare global {
  interface Window {
    Telegram?: { WebApp: any; };
  }
}

const DEV_MODE = true;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// 1. Forced React Query Cache Clear on Startup
queryClient.clear();

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { mutate: syncUser, isPending } = useAuth();
  const [initDataError, setInitDataError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
    }

    const initData = tg?.initData;
    console.log("System InitData found:", !!initData);

    if (initData) {
      // 3. Mandatory POST Auth Request: strictly first network request
      syncUser(initData, {
        onSuccess: () => setIsAuthenticated(true),
        onError: () => {
          if (DEV_MODE) setIsAuthenticated(true);
        }
      });
    } else {
      if (DEV_MODE) {
        console.warn("DEV_MODE: By-passing Telegram auth due to missing initData");
        setIsAuthenticated(true);
      } else {
        setInitDataError(true);
      }
    }
  }, []); // Run ONLY once on mount

  // 5. App-Level Guard: Lock UI and rendering until authentication finishes
  if (isPending || !isAuthenticated) {
    if (initDataError && !DEV_MODE) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
            <span className="text-4xl text-slate-400">🔒</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Tizimga kiring</h1>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed font-medium">
            Ilovani Telegram orqali oching
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center z-[100] relative">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#007AFF] rounded-full animate-spin mb-4 shadow-sm"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("Barchasi");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: products = [], isLoading: isLoadingProducts } = useProducts(
    selectedCategoryId || undefined,
    debouncedSearch || undefined
  );

  const filteredProducts = useMemo(() => products, [products]);

  return (
    <CartProvider>

      <Layout onSearch={setSearchTerm}>
        <CategoryBar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id, name) => {
            setSelectedCategoryId(id);
            setSelectedCategoryName(name);
          }}
        />

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div id="catalog" className="scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 px-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
                {debouncedSearch
                  ? `"${debouncedSearch}" bo'yicha natijalar`
                  : !selectedCategoryId ? "Barcha mahsulotlar" : selectedCategoryName
                }
              </h2>
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 items-stretch">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 h-full flex flex-col gap-3">
                    <div className="w-full aspect-square bg-[#F1F5F9] rounded-xl animate-pulse"></div>
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div>
                    <div className="h-6 bg-slate-100 rounded animate-pulse w-1/3 mt-auto"></div>
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full mt-2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 items-stretch"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product: any) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                  <span className="text-slate-400 text-4xl">📦</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-wide drop-shadow-sm">Mahsulot topilmadi</h3>
                <p className="text-slate-500 max-w-sm text-lg font-medium">
                  Ushbu turkumda hozircha mahsulotlar yo'q. Boshqa turkumni tanlab ko'ring.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSelectedCategoryName("Barchasi");
                    setSearchTerm("");
                  }}
                  className="mt-10 font-medium text-[#007AFF] hover:text-[#005bb5] bg-[#007AFF]/5 hover:bg-[#007AFF]/10 px-8 py-3 rounded-full transition-all border border-[#007AFF]/20"
                >
                  Barcha mahsulotlarni ko'rish
                </button>
              </motion.div>
            )}
          </div>
        </main>
      </Layout>
      <TelegramAuthDebug />
    </CartProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <Toaster
              richColors
              position="top-right"
              duration={2000}
              toastOptions={{
                className: 'font-[Inter] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100',
                style: { background: '#ffffff', color: '#0f172a' }
              }}
            />
            <AuthWrapper>
              <Routes>
                {/* Home Catalog Route */}
                <Route path="/" element={<AppContent />} />
                {/* Catch-all to Home if Product Details isn't ready yet or just fallback */}
                <Route path="*" element={<AppContent />} />
              </Routes>
              <OrderDetails />
            </AuthWrapper>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </BrowserRouter>
  );
}