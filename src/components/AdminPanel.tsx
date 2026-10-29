import React, { useState, useMemo } from 'react';
import { 
  Shield, KeyRound, PlusCircle, Edit3, Trash2, CloudUpload, 
  Download, Upload, LogOut, CheckCircle, AlertCircle, RefreshCw, 
  Database, Image as ImageIcon, Sparkles, X, Check, Wand2, Layers
} from 'lucide-react';
import { DictionaryEntry, ThemeMode } from '../types/dictionary';
import { firebaseService, allAvailableSeedEntries } from '../services/firebaseService';
import { aiService } from '../services/aiService';

interface AdminPanelProps {
  isAdminLoggedIn: boolean;
  onLogin: (pwd: string) => boolean;
  onLogout: () => void;
  entries: Record<string, DictionaryEntry>;
  currentAdminPassword: string;
  onOpenPasswordModal: () => void;
  onAddOrUpdateEntry: (entry: Omit<DictionaryEntry, 'id'>, id?: string) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onBackToUserView: () => void;
  theme?: ThemeMode;
}

const CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: 'လူပုဂ္ဂိုလ်များ', label: 'လူပုဂ္ဂိုလ်များ (People)' },
  { id: 'နေရာဒေသများ', label: 'နေရာဒေသများ (Places)' },
  { id: 'ဝေါဟာရနှင့် သမ္မာတရားများ', label: 'ဝေါဟာရနှင့် သမ္မာတရား (Theology/Doctrine)' },
  { id: 'ဝတ်ပြုကိုးကွယ်မှု', label: 'ဝတ်ပြုကိုးကွယ်မှု (Worship & Tabernacle)' },
  { id: 'ပွဲတော်နှင့် အခမ်းအနား', label: 'ပွဲတော်နှင့် အခမ်းအနား (Feasts & Celebrations)' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdminLoggedIn,
  onLogin,
  onLogout,
  entries,
  currentAdminPassword,
  onOpenPasswordModal,
  onAddOrUpdateEntry,
  onDeleteEntry,
  onRefreshData,
  onBackToUserView,
  theme = 'light',
}) => {
  // Login State
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('လူပုဂ္ဂိုလ်များ');
  const [imageUrl, setImageUrl] = useState('');
  const [meaning, setMeaning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Auto Seeding State
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<{ current: number; total: number; msg: string } | null>(null);
  const [seedResultMessage, setSeedResultMessage] = useState<{
    added: number;
    titles: string[];
    isAI: boolean;
  } | null>(null);

  // In-app Delete Confirmation Modal
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; title: string } | null>(null);

  // Admin filter search
  const [adminSearch, setAdminSearch] = useState('');

  // Calculate unadded curated candidates
  const unaddedCandidates = useMemo(() => {
    const existingTitles = new Set(
      Object.values(entries)
        .filter(Boolean)
        .map(e => e.title?.trim().toLowerCase())
    );
    return allAvailableSeedEntries.filter(
      item => !existingTitles.has(item.title.trim().toLowerCase())
    );
  }, [entries]);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLogin(passwordInput);
    if (!success) {
      setLoginError('Admin Password မှားယွင်းနေပါသည်။ ("iamo" ဖြင့် ဝင်ရောက်ပါ)');
    } else {
      setPasswordInput('');
    }
  };

  // Start Edit
  const handleEdit = (id: string, entry: DictionaryEntry) => {
    setEditId(id);
    setTitle(entry.title || '');
    setCategory(entry.category || 'လူပုဂ္ဂိုလ်များ');
    setImageUrl(entry.imageUrl || '');
    setMeaning(entry.meaning || '');
    setFormSuccessMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Form
  const handleResetForm = () => {
    setEditId(null);
    setTitle('');
    setCategory('လူပုဂ္ဂိုလ်များ');
    setImageUrl('');
    setMeaning('');
    setFormSuccessMessage('');
  };

  // Submit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meaning.trim()) {
      alert('ခေါင်းစဉ်နှင့် အဓိပ္ပာယ်ရှင်းလင်းချက်ကို ထည့်သွင်းပေးပါ');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddOrUpdateEntry({
        title: title.trim(),
        category,
        imageUrl: imageUrl.trim(),
        meaning: meaning.trim()
      }, editId || undefined);

      setFormSuccessMessage(editId ? 'အချက်အလက် ပြင်ဆင်ပြီးပါပြီ!' : 'အချက်အလက်အသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ!');
      setTimeout(() => setFormSuccessMessage(''), 4000);
      handleResetForm();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Continuous / Infinite Auto Upload:
   * 1. If curated entries exist, upload them.
   * 2. When curated are exhausted, AI (Gemini 3.8-flash) generates 20 brand-new unique Bible words and uploads them!
   * Can be clicked repeatedly!
   */
  const handleAutoSeed = async () => {
    if (isSeeding) return;

    setIsSeeding(true);
    setSeedResultMessage(null);

    try {
      const existingTitles = Object.values(entries).map(e => e.title);

      if (unaddedCandidates.length > 0) {
        // Upload from curated candidate list
        setSeedProgress({ current: 0, total: 20, msg: 'Curated စကားလုံးများကို စစ်ဆေးနေပါသည်...' });
        const res = await firebaseService.seedBibleData(20, (cur, tot, msg) => {
          setSeedProgress({ current: cur, total: tot, msg });
        });
        await onRefreshData();
        setSeedResultMessage({
          added: res.added,
          titles: res.addedTitles,
          isAI: false
        });
      } else {
        // Generate with Gemini AI dynamically!
        setSeedProgress({ current: 1, total: 20, msg: 'Gemini AI မှ သမ္မာကျမ်းစာ စကားလုံးအသစ် ၂၀ ကို ရေးသားရှာဖွေနေပါသည်...' });
        const aiBatch = await aiService.generateBatch(20, existingTitles);

        const addedTitles: string[] = [];
        for (let i = 0; i < aiBatch.length; i++) {
          const item = aiBatch[i];
          setSeedProgress({ current: i + 1, total: aiBatch.length, msg: `Firebase သို့ တင်သွင်းနေပါသည်: ${item.title}` });
          await firebaseService.addEntry(item);
          addedTitles.push(item.title);
        }

        await onRefreshData();
        setSeedResultMessage({
          added: addedTitles.length,
          titles: addedTitles,
          isAI: true
        });
      }
    } catch (err: any) {
      console.error('Seeding error:', err);
      alert('Upload လုပ်စဉ် အမှားဖြစ်ပေါ်ပါသည်: ' + err.message);
    } finally {
      setIsSeeding(false);
      setSeedProgress(null);
    }
  };

  // In-app Delete Execution
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await onDeleteEntry(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch (err: any) {
      alert('ဖျက်ရန် မအောင်မြင်ပါ: ' + err.message);
    }
  };

  // Export database as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bible_dictionary_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const keys = Object.keys(json);
        for (const key of keys) {
          const item = json[key];
          if (item && item.title && item.meaning) {
            await firebaseService.addEntry(item);
          }
        }
        await onRefreshData();
        setFormSuccessMessage(`Backup မှ အချက်အလက် ${keys.length} ခု တင်သွင်းပြီးပါပြီ!`);
        setTimeout(() => setFormSuccessMessage(''), 4000);
      } catch (err: any) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // If not logged in, show Admin Login Box
  if (!isAdminLoggedIn) {
    return (
      <div className={`max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl shadow-xl border animate-in fade-in ${
        theme === 'sepia'
          ? 'bg-[#f7eedb] border-[#ebd7b5]'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm ${
          theme === 'sepia'
            ? 'bg-[#ebd5b0] text-amber-900'
            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
        }`}>
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-1">
          Admin Dashboard ဝင်ရောက်ရန်
        </h2>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-6">
          Admin Password <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"iamo"</strong> ဖြင့် ဝင်ရောက်နိုင်ပါသည်။
        </p>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Admin password (ဥပမာ - iamo)"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow transition cursor-pointer"
          >
            Login ဝင်မည်
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onBackToUserView}
            className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
          >
            ← အဘိဓာန်ရှာဖွေမှု မျက်နှာပြင်သို့ ပြန်သွားမည်
          </button>
        </div>
      </div>
    );
  }

  // Filter admin entries
  const entryKeys = Object.keys(entries);
  const filteredKeys = entryKeys.filter((k) => {
    const item = entries[k];
    if (!adminSearch) return true;
    const q = adminSearch.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.meaning?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white shadow-lg">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control Panel (Authenticated)</span>
          </span>
          <h2 className="text-lg sm:text-xl font-bold mt-0.5">
            သမ္မာကျမ်းစာ အဘိဓာန် ဒေတာ စီမံခန့်ခွဲမှု
          </h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            Firebase Cloud Database နှင့် ချိတ်ဆက်ထားပါသည် (လက်ရှိ Database ထဲတွင် စုစုပေါင်း <strong>{entryKeys.length}</strong> ပုဒ် ရှိပါသည်)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenPasswordModal}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 border border-indigo-500/40 transition cursor-pointer shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Password ပြောင်းမည်</span>
          </button>

          <button
            onClick={onBackToUserView}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 transition cursor-pointer"
          >
            <span>User View သို့ သွားမည်</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ထွက်မည်</span>
          </button>
        </div>
      </div>

      {/* AUTO UPLOAD 20 BIBLE WORDS ACTION CARD (CONTINUOUS & AI-POWERED) */}
      <div className={`relative overflow-hidden p-6 rounded-3xl border-2 shadow-md ${
        theme === 'sepia'
          ? 'bg-[#f7eedb] border-amber-600/40'
          : 'bg-gradient-to-br from-amber-500/10 via-indigo-50/50 to-slate-50 dark:from-amber-950/20 dark:via-indigo-950/30 dark:to-slate-800 border-amber-300 dark:border-amber-700/60'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  စကားလုံး ၂၀ အလိုအလျောက် Upload ပြုလုပ်ခြင်း (Continuous AI-Powered)
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  <span>အကန့်အသတ်မရှိ အကြိမ်ကြိမ် နှိပ်၍ရပါသည်</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                ဤခလုတ်ကို နှိပ်လိုက်တိုင်း Database ထဲတွင် မရှိသေးသော သမ္မာကျမ်းစာ စကားလုံးအသစ် ၂၀ ကို မူရင်းဟေဗြဲ/ဂရိ Strong's နံပါတ်၊ ကျမ်းကိုးကားချက်များနှင့်တကွ Firebase သို့ အလိုအလျောက် တိုက်ရိုက် Upload လုပ်ပေးမည် ဖြစ်ပါသည်။ (One-time မဟုတ်ဘဲ အကြိမ်ကြိမ် နှိပ်၍ သမ္မာကျမ်းစာ စကားလုံးများကို တိုးချဲ့နိုင်ပါသည်)
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={handleAutoSeed}
              disabled={isSeeding}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-98 disabled:opacity-60"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>စကားလုံး ၂၀ ကို Upload လုပ်နေပါသည်...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-5 h-5 stroke-[2.5]" />
                  <span>စကားလုံး ၂၀ အလိုအလျောက် Upload လုပ်မည်</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Upload Progress Indicator */}
        {isSeeding && seedProgress && (
          <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-inner space-y-2 animate-in fade-in">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{seedProgress.msg}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                {seedProgress.current} / {seedProgress.total} ({(Math.round((seedProgress.current / seedProgress.total) * 100))}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(seedProgress.current / seedProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Result Box */}
        {seedResultMessage && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {seedResultMessage.isAI ? 'Gemini AI မှ စကားလုံးသစ် ' : ''}{seedResultMessage.added} ပုဒ်ကို Firebase Database သို့ အောင်မြင်စွာ Upload လုပ်ပြီးပါပြီ!
                </span>
              </div>
              <button
                onClick={() => setSeedResultMessage(null)}
                className="p-1 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {seedResultMessage.titles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {seedResultMessage.titles.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-semibold border border-emerald-200 dark:border-emerald-700/50"
                  >
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Form */}
      <div className={`p-6 rounded-3xl shadow-sm border ${
        theme === 'sepia'
          ? 'bg-[#f7eedb] border-[#ebd7b5]'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {editId ? (
              <>
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>အချက်အလက် ပြင်ဆင်ရန်</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Data အသစ် ကိုယ်တိုင် ထည့်သွင်းရန်</span>
              </>
            )}
          </h3>
          {editId && (
            <button
              onClick={handleResetForm}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>မလုပ်တော့ပါ</span>
            </button>
          )}
        </div>

        {formSuccessMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ခေါင်းစဉ် (Title) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ဥပမာ - ဗက်သလီဟင်၊ ဒါဝဒ်..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                အမျိုးအစား (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>ပုံ URL (Image URL - ရွေးချယ်နိုင်သည်)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              အဓိပ္ပာယ်ရှင်းလင်းချက် (Meaning) *
            </label>
            <textarea
              rows={6}
              required
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="မူရင်း အင်္ဂလိပ်/ဟေဗြဲ/ဂရိ စကားလုံးများ၊ အဓိပ္ပာယ်ရှင်းလင်းချက်၊ ကျမ်းစာကိုးကားချက်များကို ပြည့်စုံစွာ ရေးသားပါ..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-normal"
            ></textarea>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>လုပ်ဆောင်နေပါသည်...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>{editId ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'Firebase သို့ Upload ပြုလုပ်မည်'}</span>
                </>
              )}
            </button>

            {editId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="py-3 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Database Management & Existing Data Table */}
      <div className={`p-6 rounded-3xl shadow-sm border space-y-4 ${
        theme === 'sepia'
          ? 'bg-[#f7eedb] border-[#ebd7b5]'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              ရှိနှင့်ပြီးသား Data စာရင်း
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              {filteredKeys.length} ပုဒ်
            </span>
          </div>

          {/* Backup / Export / Import Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Backup JSON ဒေါင်းလုဒ်ဆွဲမည်"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Search within Admin List */}
        <div>
          <input
            type="text"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            placeholder="စာရင်းထဲတွင် စကားလုံး ရှာဖွေပါ..."
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Entries List */}
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredKeys.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">
              Data တစ်စုံတစ်ရာ မတွေ့ရှိပါ။
            </p>
          ) : (
            filteredKeys.map((key) => {
              const item = entries[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {item.title?.charAt(0) || 'က'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.title}
                        </h4>
                        {item.category && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                        {item.meaning}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(key, item)}
                      className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="ပြင်ဆင်မည်"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate({ id: key, title: item.title })}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="ဖျက်မည်"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                အချက်အလက် ဖျက်ရန် သေချာပါသလား?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong className="text-slate-800 dark:text-slate-200">"{deleteCandidate.title}"</strong> ကို Firebase Database မှ ဖျက်လိုက်ပါမည်။
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                ဖျက်မည်
              </button>
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                မဖျက်ပါ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
