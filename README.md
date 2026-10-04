# Kartuin 💳

**Find the credit card that actually fits your spending.**

Kartuin is an Indonesian cashback credit-card calculator. Tell it how much you spend per month across categories like dining, groceries, fuel, and online shopping, and it ranks real Indonesian cashback cards (HSBC Live+, UOB TMRW, DBS Live Fresh, Permata ShopCard, OCBC Nyala, BRI Easy Card) by how much cashback you'd actually earn — then uses Gemini to explain the top pick in plain language, including the fine print that usually gets buried (app-only transactions, minimum spend thresholds, monthly caps).

> Built as a submission for **Google Juara Vibe Coding Indonesia 2026** — one of 8 projects featured in a weekly challenge.

## Features

- 🎚️ Interactive sliders for 9 spending categories, with quick presets (Casual Spender, Family Spender, Power Online Shopper)
- 📊 Live-ranked cashback feed showing your best and worst-fit cards, with estimated monthly and annual returns
- 🔍 A card explorer to inspect any individual card's rate, requirements, and caveats
- ✨ "Analyze my spending" — a Gemini-powered second opinion that explains the top recommendation and its real-world catches, with a typewriter-style reveal
- 🌗 Dark/light mode

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS
- [Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`) for the natural-language recommendation, with an automatic mock fallback if no API key is configured or the request fails

## Getting started

```bash
npm install
```

Create a `.env.local` file in the project root with your own Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

(Get a key from [Google AI Studio](https://aistudio.google.com/apikey). Without a key, the app still works — it falls back to a built-in mock recommendation instead of calling Gemini.)

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Project structure

```
src/
  app/
    page.tsx              # main UI: sliders, ranked card feed, explorer, Gemini modal
    api/recommend/route.ts # Gemini-backed recommendation endpoint (with mock fallback)
    layout.tsx, globals.css
public/
  cards/                  # card artwork
```

## Notes

- Cashback rates, caps, and requirements shown for each card are illustrative, built for this demo rather than pulled from live bank data — don't use this as financial advice for a real card application.
- `.env.local` is gitignored; never commit your API key.
