'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, AlertTriangle, Moon, Sun } from 'lucide-react';

// ─── Mock Cards Data ──────────────────────────────────────────────────────────

interface CardDef {
  id: string;
  name: string;
  issuer: string;
  image: string;
  cashback_rate: number;
  complexity_level: 'low' | 'medium' | 'high';
  minimum_spend: number;
  key_requirement: string;
  eligible_categories: string[];
  weaknesses: string[];
  meetsPreferences: string[];
}

const CARDS: CardDef[] = [
  {
    id: 'hsbc_live_plus', name: 'HSBC Live+ Card', issuer: 'HSBC',
    image: '/cards/hsbc-live+.png',
    cashback_rate: 0.08, complexity_level: 'medium', minimum_spend: 2000000,
    key_requirement: 'Min spend IDR 2,000,000/month via app',
    eligible_categories: ['dining', 'online_shopping', 'streaming'],
    weaknesses: ['Cashback capped at IDR 400.000/month', 'Requires HSBC mobile activation'],
    meetsPreferences: ['balanced', 'max rewards'],
  },
  {
    id: 'uob_tmrw', name: 'UOB TMRW Card', issuer: 'UOB',
    image: '/cards/uob-tmrw.png',
    cashback_rate: 0.06, complexity_level: 'low', minimum_spend: 1000000,
    key_requirement: 'Use TMRW app for transactions',
    eligible_categories: ['dining', 'online_shopping', 'fashion', 'streaming'],
    weaknesses: ['Only valid for TMRW app-linked purchases', 'Cap IDR 300k/month'],
    meetsPreferences: ['quick win', 'balanced', 'max rewards'],
  },
  {
    id: 'dbs_live_fresh', name: 'DBS Live Fresh Card', issuer: 'DBS',
    image: '/cards/dbs-live-fresh.png',
    cashback_rate: 0.05, complexity_level: 'low', minimum_spend: 1500000,
    key_requirement: 'Contactless or online spend only',
    eligible_categories: ['online_shopping', 'dining', 'groceries'],
    weaknesses: ['Physical POS transactions excluded', 'Lower cap than HSBC'],
    meetsPreferences: ['quick win', 'balanced', 'max rewards'],
  },
  {
    id: 'permata_shopcard', name: 'Permata ShopCard', issuer: 'Permata',
    image: '/cards/permata-shopcard.png',
    cashback_rate: 0.05, complexity_level: 'medium', minimum_spend: 3000000,
    key_requirement: 'Min IDR 3,000,000 spend at partner merchants',
    eligible_categories: ['online_shopping', 'fashion', 'groceries'],
    weaknesses: ['High min spend threshold', 'Limited merchant partners'],
    meetsPreferences: ['balanced', 'max rewards'],
  },
  {
    id: 'ocbc_nyala', name: 'OCBC Nyala Card', issuer: 'OCBC',
    image: '/cards/ocbc-nyala.png',
    cashback_rate: 0.03, complexity_level: 'low', minimum_spend: 500000,
    key_requirement: 'Link to Nyala savings account',
    eligible_categories: ['general', 'groceries', 'fuel'],
    weaknesses: ['Low cashback rate vs competitors', 'Account linking required'],
    meetsPreferences: ['quick win', 'balanced'],
  },
  {
    id: 'bri_easy_card', name: 'BRI Easy Card', issuer: 'BRI',
    image: '/cards/bri-easy.png',
    cashback_rate: 0.015, complexity_level: 'low', minimum_spend: 0,
    key_requirement: 'No minimum spend required',
    eligible_categories: ['general', 'groceries', 'fuel', 'healthcare'],
    weaknesses: ['Very low cashback rate', 'No category boosts available'],
    meetsPreferences: ['quick win'],
  },
];

const CATS = ['dining', 'groceries', 'fuel', 'online_shopping', 'travel', 'streaming', 'healthcare', 'fashion', 'general'] as const;
type Category = typeof CATS[number];
type SpendingProfile = Record<Category, number>;

const PRESETS: { name: string; profile: SpendingProfile }[] = [
  {
    name: '☕ Casual Spender',
    profile: { dining: 1000000, groceries: 1500000, fuel: 500000, online_shopping: 800000, travel: 0, streaming: 100000, healthcare: 200000, fashion: 300000, general: 600000 },
  },
  {
    name: '🏠 Family Spender',
    profile: { dining: 2000000, groceries: 4500000, fuel: 1500000, online_shopping: 2000000, travel: 1000000, streaming: 200000, healthcare: 1200000, fashion: 1000000, general: 1600000 },
  },
  {
    name: '🛒 Power Online Shopper',
    profile: { dining: 1500000, groceries: 1000000, fuel: 500000, online_shopping: 5000000, travel: 1000000, streaming: 300000, healthcare: 200000, fashion: 1500000, general: 1000000 },
  },
];

const MOCK_ADVICE = `## Analisis strategi kartu cashback

### Rekomendasi utama

Berdasarkan profil pengeluaran Anda, **HSBC Live+ Card** dan **UOB TMRW Card** menawarkan nilai terbaik. HSBC unggul untuk kategori dining dan online shopping dengan rate 8%, sementara UOB lebih fleksibel dengan syarat lebih rendah.

### Kenapa Permata dan BRI kurang optimal

- High minimum spend threshold di Permata tidak cocok untuk profil belanja Anda saat ini
- BRI Easy Card hanya efektif jika Anda menginginkan kartu tanpa syarat apapun

### Strategi jangka panjang

Gunakan **UOB TMRW** sebagai kartu utama harian karena kompleksitas rendah, lalu manfaatkan **HSBC Live+** khusus untuk transaksi dining dan belanja online agar memaksimalkan cashback 8%.

---

Evaluasi ulang setiap 6 bulan jika pola belanja berubah signifikan.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(amount: number) {
  return `IDR ${Math.round(amount).toLocaleString('en-US')}`;
}

function parseBold(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part}</strong>
      : part
  );
}

function parseMarkdown(text: string) {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    if (line.startsWith('#### ')) return <h4 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1.5">{line.slice(5)}</h4>;
    if (line.startsWith('### ')) return <h3 key={idx} className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-4 mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">{line.slice(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={idx} className="text-base font-extrabold text-slate-900 dark:text-slate-50 mt-5 mb-2">{line.slice(3)}</h2>;
    if (line.trim() === '---') return <hr key={idx} className="my-3 border-slate-200 dark:border-slate-800" />;
    if (line.startsWith('- ')) return <li key={idx} className="ml-4 list-disc text-xs text-slate-600 dark:text-slate-300 mb-1 leading-relaxed">{parseBold(line.slice(2))}</li>;
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^\d+/)?.[0] || '1';
      return (
        <div key={idx} className="flex gap-2 text-xs text-slate-600 dark:text-slate-300 mb-1.5 leading-relaxed">
          <span className="font-bold text-blue-500">{num}.</span>
          <span className="flex-1">{parseBold(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    }
    if (line.trim() === '') return <div key={idx} className="h-1.5" />;
    return <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">{parseBold(line)}</p>;
  });
}

interface RecommendationResult {
  card: CardDef;
  totalCashback: number;
  categoryBreakdown: Record<string, number>;
  minimumSpendMet: boolean;
  meetsPreference: boolean;
}

function getCardRecommendations(
  cards: CardDef[],
  spending: SpendingProfile,
  totalSpend: number,
  preference: string
): RecommendationResult[] {
  return cards
    .map(card => {
      const breakdown: Record<string, number> = {};
      let cashback = 0;
      for (const cat of CATS) {
        const spend = spending[cat] || 0;
        const eligible = card.eligible_categories.includes(cat) || card.eligible_categories.includes('general');
        breakdown[cat] = eligible ? spend * card.cashback_rate : 0;
        cashback += breakdown[cat];
      }
      const minimumSpendMet = totalSpend >= card.minimum_spend;
      if (!minimumSpendMet) cashback = 0;
      const meetsPreference = card.meetsPreferences.includes(preference);
      return { card, totalCashback: cashback, categoryBreakdown: breakdown, minimumSpendMet, meetsPreference };
    })
    .sort((a, b) => b.totalCashback - a.totalCashback);
}

function getStrongestCategory(result: RecommendationResult) {
  let strongestCat = 'None';
  let maxVal = 0;
  for (const [cat, val] of Object.entries(result.categoryBreakdown)) {
    if (val > maxVal) { maxVal = val; strongestCat = cat; }
  }
  if (maxVal === 0 && result.card.eligible_categories.length > 0) {
    strongestCat = result.card.eligible_categories[0];
  }
  return { name: strongestCat.replace('_', ' '), amount: maxVal };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Kartuin() {
  const [darkMode, setDarkMode] = useState(true);
  const preference = 'balanced';
  const [spending, setSpending] = useState<SpendingProfile>({
    dining: 1500000, groceries: 2000000, fuel: 1000000,
    online_shopping: 1500000, travel: 1000000, streaming: 200000,
    healthcare: 500000, fashion: 800000, general: 500000,
  });

  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiAdvice, setGeminiAdvice] = useState('');
  const [typedAdvice, setTypedAdvice] = useState('');
  const [showExplorer, setShowExplorer] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSpend = Object.values(spending).reduce((s, v) => s + v, 0);
  const recommendations = getCardRecommendations(CARDS, spending, totalSpend, preference);

  const handleSliderChange = (cat: Category, value: number) => {
    setSpending(prev => ({ ...prev, [cat]: value }));
  };

  const applyPreset = (profile: SpendingProfile) => setSpending(profile);

  // Typewriter effect: starts a new animation whenever geminiAdvice changes.
  useEffect(() => {
    if (!geminiAdvice) return;
    let i = 0;
    typingRef.current = setInterval(() => {
      i += 5;
      setTypedAdvice(geminiAdvice.slice(0, i));
      if (i >= geminiAdvice.length && typingRef.current) clearInterval(typingRef.current);
    }, 12);
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [geminiAdvice]);

  const handleRecommendForMe = async () => {
    setIsGeminiModalOpen(true);
    setGeminiLoading(true);
    setTypedAdvice('');
    setGeminiAdvice('');

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spendingProfile: { totalSpend, ...spending },
          recommendedCards: recommendations,
          preference,
        }),
      });
      const data = await response.json();
      if (data.recommendation) {
        setGeminiAdvice(data.recommendation);
      } else {
        throw new Error('No recommendation returned');
      }
    } catch {
      // Fallback to mock advice
      setGeminiAdvice(MOCK_ADVICE);
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className={`flex flex-col flex-1 min-h-screen ${darkMode ? 'dark bg-zinc-950 text-zinc-50' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col flex-1 gap-6">

        {/* Header */}
        <header className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
              Kartuin
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">
              Indonesian Cashback Calculator
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </header>

        {/* SECTION 1: Presets + Outlook + Sliders */}
        <section className="flex flex-col gap-4">

          {/* Presets */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 flex flex-col gap-3">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Your Spending</span>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset, idx) => {
                const isActive = CATS.every(k => spending[k] === preset.profile[k]);
                return (
                  <button
                    key={idx}
                    onClick={() => applyPreset(preset.profile)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${isActive
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-slate-500 dark:text-zinc-400'
                      }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
                Monthly Spending Distribution
              </span>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase block leading-none">Total Spend</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">{formatIDR(totalSpend)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {CATS.map(cat => (
                <div key={cat} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="capitalize text-slate-600 dark:text-zinc-400">{cat.replace('_', ' ')}</span>
                    <span className="text-slate-800 dark:text-zinc-200">{formatIDR(spending[cat])}</span>
                  </div>
                  <input
                    type="range" min="0" max="10000000" step="100000"
                    value={spending[cat]}
                    onChange={e => handleSliderChange(cat, parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>


        </section>

        {/* SECTION 2: Ranked Cashback Feed */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wider text-slate-500 dark:text-zinc-500 uppercase">
              Best Fits for Your Spending
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">Sorted from best to worst fit</span>
          </div>

          <div className="flex flex-col gap-3">
            {recommendations
              .filter((_, idx) => idx < 2 || idx === recommendations.length - 1)
              .map((result, idx) => {
                const strongestCat = getStrongestCategory(result);
                const isBottomCard = idx === 2;

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all duration-200 border-l-[6px] ${isBottomCard ? '!border-l-red-500' : '!border-l-emerald-500'} ${isBottomCard
                      ? 'opacity-70 border-red-500/20 hover:border-red-400 grayscale-[30%] hover:grayscale-0 hover:bg-red-500/[0.02]'
                      : 'border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-500/[0.03] dark:hover:bg-emerald-400/[0.04]'
                      }`}
                  >
                    <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">

                      {/* LEFT */}
                      <div className="flex-1 flex flex-col gap-2 text-left">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">{result.card.name}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">&bull; {result.card.issuer}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${result.card.complexity_level === 'low'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : result.card.complexity_level === 'medium'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                            {result.card.complexity_level} Rule
                          </span>
                          {!result.meetsPreference && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                              Secondary Filter
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                          {(result.card.cashback_rate * 100).toFixed(0)}% cashback on eligible spending.{' '}
                          {result.card.minimum_spend > 0
                            ? `Requires ${formatIDR(result.card.minimum_spend)} minimum spend — you ${result.minimumSpendMet ? 'fully meet' : 'DO NOT meet'} this.`
                            : 'No minimum monthly spending threshold.'}
                        </p>

                        <div className="flex flex-col gap-1 text-[11px] pt-1">

                          <div className="flex items-start gap-1">
                            <span className="font-semibold text-slate-400 dark:text-zinc-500">
                              You primarily gaining it from:
                            </span>

                            <span className="text-slate-800 dark:text-zinc-200 font-bold capitalize">
                              {strongestCat.name} ({formatIDR(strongestCat.amount)})
                            </span>
                          </div>

                          <div className="flex items-start gap-2 text-[11px] leading-relaxed">
                            <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-500" />

                            <span className="font-semibold text-slate-400 dark:text-zinc-500">
                              Active rule:
                            </span>

                            <span className="text-slate-700 dark:text-zinc-300 font-semibold flex-1">
                              {result.card.key_requirement}
                            </span>
                          </div>

                        </div>
                        <div className="text-[11px] flex items-start gap-1 text-red-500 dark:text-red-400/90 font-medium">
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>Caveat: {result.card.weaknesses[0]}</span>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex sm:flex-col justify-between sm:justify-center items-end sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-zinc-900 pt-3 sm:pt-0 sm:pl-4 min-w-[130px]">
                        <div>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase block leading-none">Est. Monthly Return</span>
                          <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-1 block">{formatIDR(result.totalCashback)}</span>
                        </div>
                        <div className="sm:mt-2">
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase block leading-none">Annual Yield</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">{formatIDR(result.totalCashback * 12)}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* SECTION 3: Explore Cards */}
        <section className="flex flex-col gap-3">

          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 text-left hover:border-slate-300 dark:hover:border-zinc-700 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                  Want to explore cards yourself?
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Browse individual cards without changing your recommendations.
                </p>
              </div>

              <span className="text-slate-400 dark:text-zinc-500 text-lg leading-none">
                {showExplorer ? '−' : '+'}
              </span>
            </div>
          </button>

          {showExplorer && (
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 flex flex-col gap-4">

              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-slate-700 dark:text-zinc-200"
              >
                <option value="">Select a card</option>

                {recommendations.map((result) => (
                  <option key={result.card.id} value={result.card.id}>
                    {result.card.name}
                  </option>
                ))}
              </select>

              {selectedCardId && (() => {
                const selected = recommendations.find(
                  r => r.card.id === selectedCardId
                );

                if (!selected) return null;

                const strongestCat = getStrongestCategory(selected);

                return (
                  <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-5 flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-1 flex flex-col gap-3 text-xs">
                      <h4 className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-tight">
                        {selected.card.name}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {(selected.card.cashback_rate * 100).toFixed(0)}% cashback on eligible spending.{' '}
                        {selected.card.minimum_spend > 0
                          ? `Requires ${formatIDR(selected.card.minimum_spend)} minimum spend.`
                          : 'No minimum monthly spending threshold.'}
                      </p>

                      <div className="flex items-start gap-1">
                        <span className="font-semibold text-slate-400 dark:text-zinc-500">
                          Best for:
                        </span>

                        <span className="text-slate-800 dark:text-zinc-200 font-bold capitalize">
                          {strongestCat.name}
                        </span>
                      </div>

                      <div className="flex items-start gap-1 text-[11px] leading-relaxed">
                        <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-500" />

                        <span className="font-semibold text-slate-400 dark:text-zinc-500">
                          Active rule:
                        </span>

                        <span className="text-slate-700 dark:text-zinc-300 font-semibold">
                          {selected.card.key_requirement}
                        </span>
                      </div>

                      <div className="flex items-start gap-1 text-[11px] leading-relaxed text-red-500 dark:text-red-400">

                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />

                        <span>
                          {selected.card.weaknesses[0]}
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-[240px] flex items-center justify-center">
                      <img
                        src={selected.card.image}
                        alt={selected.card.name}
                        className="h-36 object-contain drop-shadow-xl"
                      />
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

        </section>

        {/* SECTION 4: Gemini CTA */}
        <section className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/20 p-6 flex flex-col sm:flex-row items-center gap-6 justify-between text-left">
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100">Want a second opinion?</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Get a personalized breakdown based on your spending profile.
            </p>
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">Powered by Gemini</span>
          </div>
          <button
            onClick={handleRecommendForMe}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white dark:text-zinc-100 text-xs font-black transition tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Analyze my spending
          </button>
        </section>

      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-zinc-800 py-6 bg-white dark:bg-zinc-950 text-center text-[11px] text-slate-400 dark:text-zinc-500">
        <div className="max-w-2xl mx-auto px-4">
          <p>&copy; 2026 Kartuin.</p>
          <p>Find the card that actually fits.</p>
        </div>
      </footer>

      {/* GEMINI ADVISOR MODAL */}
      {isGeminiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[80vh] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden text-left">

            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-zinc-50">Cooking your advice</h3>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeminiModalOpen(false)}
                className="py-1 px-2 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold transition text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-white dark:bg-zinc-900/10">
              {geminiLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <div className="max-w-xs">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Analyzing your spending profile...</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">
                      Calculating category limits, statement overlaps, and fee exceptions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <div className="typing text-left font-sans select-text">
                    {parseMarkdown(typedAdvice)}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end bg-slate-50 dark:bg-zinc-900/50">
              <button
                onClick={() => setIsGeminiModalOpen(false)}
                className="py-1 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
              >
                Got it!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}