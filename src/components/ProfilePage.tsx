import { useState } from 'react';
import { ArrowLeft, Phone, User, Lock, Edit2, Globe, History, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderHistory } from './OrderHistory';
import { useAuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';
import { toast } from 'sonner';

interface ProfilePageProps {
    open: boolean;
    onClose: () => void;
}

export function ProfilePage({ open, onClose }: ProfilePageProps) {
    const { user, setUser } = useAuthContext();
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [editPhoneValue, setEditPhoneValue] = useState("");
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const tgFullName = user?.fullName || "Foydalanuvchi";

    const initials = tgFullName
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^\d+]/g, '');
        if (!val.startsWith('+998')) {
            val = '+998';
        }
        if (val.length > 13) {
            val = val.slice(0, 13);
        }
        setEditPhoneValue(val);
    };

    const handleSavePhone = async () => {
        if (!user) return;

        if (editPhoneValue.length < 13) {
            toast.error("Telefon raqamni to'liq kiriting");
            return;
        }

        setIsSavingPhone(true);
        try {
            const payload = {
                telegramId: user.telegramId || "0",
                fullName: user.fullName,
                username: user.username,
                phone: editPhoneValue,
                email: user.email || null,
                language: user.language,
                photoUrl: user.photoUrl
            };
            await updateUserProfile(payload);

            setUser({ ...user, phone: editPhoneValue });
            setIsEditingPhone(false);
            toast.success("Telefon raqam muvaffaqiyatli saqlandi! ✅");
        } catch (error) {
            console.error("Phone update failed", error);
            toast.error("Telefon raqamni saqlashda xatolik yuz berdi");
        } finally {
            setIsSavingPhone(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col w-full h-full overflow-y-auto font-sans"
                    >
                        {/* Header Bar */}
                        <div className="flex items-center justify-between p-4 sticky top-0 bg-[#F8FAFC]/90 backdrop-blur-md z-10 border-b border-slate-200/50">
                            <button
                                onClick={onClose}
                                className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 transition-colors text-slate-700"
                            >
                                <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
                            </button>
                            <span className="font-bold text-slate-900 tracking-tight text-lg">Profil</span>
                            <div className="w-10"></div>
                        </div>

                        <div className="px-5 pb-8 pt-8 flex-1 flex flex-col max-w-lg mx-auto w-full">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center mb-10">
                                <div className="w-28 h-28 rounded-full mb-4 relative drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)] flex items-center justify-center p-2 bg-white/60 backdrop-blur-xl border-2 border-white shadow-[inset_0_2px_8px_rgba(255,255,255,0.8)]">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] relative z-10">
                                        {user?.photoUrl && !imageError ? (
                                            <img
                                                src={user.photoUrl}
                                                alt="User Avatar"
                                                className="w-full h-full object-cover transition-opacity duration-500 opacity-0"
                                                onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <span className="text-[#007AFF] text-[40px] font-black tracking-tight drop-shadow-sm">
                                                {initials}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center relative flex items-center gap-2">
                                        {tgFullName}
                                    </h1>
                                    {user?.username && (
                                        <span className="text-slate-500 font-medium mt-1">@{user.username}</span>
                                    )}
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden mb-6 relative">

                                {/* Locked Name Row */}
                                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                        <User className="w-5 h-5" strokeWidth={1.5} />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center min-h-[40px]">
                                        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">Ism familiya</span>
                                        <div className="flex items-center justify-between pointer-events-none">
                                            <span className="text-[15px] font-semibold text-slate-500">
                                                {tgFullName}
                                            </span>
                                            <Lock className="w-4 h-4 text-slate-300" strokeWidth={2} />
                                        </div>
                                    </div>
                                </div>

                                {/* Editable Phone Row */}
                                <div className="p-4 border-b border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center text-[#007AFF] shrink-0">
                                        <Phone className="w-5 h-5" strokeWidth={1.5} />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center min-h-[40px]">
                                        <span className="text-[11px] font-bold uppercase text-[#007AFF] tracking-wider mb-0.5">Telefon raqam</span>

                                        {isEditingPhone ? (
                                            <div className="flex flex-row items-center gap-2 w-full mt-1">
                                                <input
                                                    type="tel"
                                                    value={editPhoneValue}
                                                    onChange={handlePhoneChange}
                                                    disabled={isSavingPhone}
                                                    className="flex-1 min-w-0 bg-white border border-[#007AFF]/50 rounded-xl px-3 py-2 outline-none text-sm font-semibold text-slate-900 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all shadow-sm disabled:opacity-70 disabled:bg-slate-50"
                                                    placeholder="+998"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleSavePhone}
                                                    disabled={isSavingPhone}
                                                    className="px-3 py-2 bg-[#007AFF] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#005bb5] transition-colors shrink-0 min-w-[80px] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    {isSavingPhone ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        "Saqlash"
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[15px] font-semibold ${!user?.phone ? "text-slate-400 italic" : "text-slate-900"}`}>
                                                    {user?.phone || "Kiritilmagan"}
                                                </span>
                                                <button
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-bold transition-colors shrink-0"
                                                    onClick={() => {
                                                        setEditPhoneValue(user?.phone || "+998");
                                                        setIsEditingPhone(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                    O'zgartirish
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Language Row */}
                                <div className="p-4 border-b border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:text-[#007AFF] group-hover:bg-[#007AFF]/5 transition-colors">
                                        <Globe className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">Til (Language)</span>
                                        <span className="text-[15px] font-semibold text-slate-900">
                                            {user?.language === 1 ? "Русский" :
                                                user?.language === 2 ? "English" : "O'zbekcha"}
                                        </span>
                                    </div>
                                </div>

                                {/* Order History Shortcut */}
                                <div
                                    className="p-4 flex items-center gap-4 bg-slate-50/50 border-t border-slate-100 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.99] transition-all cursor-pointer group select-none"
                                    onClick={() => setIsHistoryOpen(true)}
                                >
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-center text-[#007AFF] shrink-0 group-hover:bg-[#007AFF]/5 transition-colors">
                                        <History className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">Sotuvlar</span>
                                        <span className="text-[15px] font-semibold text-slate-900 group-hover:text-[#007AFF] transition-colors">Buyurtmalar tarixi</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100/50 group-hover:bg-[#007AFF]/10 flex items-center justify-center text-slate-400 group-hover:text-[#007AFF] transition-colors shrink-0">
                                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                                    </div>
                                </div>

                            </div>

                            <p className="text-center text-[11px] text-slate-400 mt-2 font-medium px-4 leading-relaxed">
                                Sizning ism va familiyangiz xavfsizlik maqsadida Telegram orqali avtomatik tasdiqlangan va o'zgartirilmaydi.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <OrderHistory open={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        </>
    );
}
