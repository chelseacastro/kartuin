import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SpendingProfile {
  totalSpend: number;
  [category: string]: number;
}

interface RecommendedCard {
  id: string;
  name: string;
  minimum_spend: number;
  eligible_categories: string[];
  key_requirement?: string;
}

interface CashbackCalculationResult {
  card: RecommendedCard;
  totalCashback: number;
}

// Indonesian Rupiah Formatting Helper
function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates a highly personalized, concise consumer fintech recommendation.
 */
function generateMockRecommendation(
  spending: SpendingProfile,
  recommendations: CashbackCalculationResult[]
): string {
  const topResult = recommendations[0];
  if (!topResult) return "No card recommendations available.";

  const card = topResult.card;
  const isUob = card.id === 'uob_tmrw';
  const isHsbc = card.id === 'hsbc_live_plus';
  const isDbs = card.id === 'dbs_live_fresh';
  const isPermata = card.id === 'permata_shopcard';
  const isMayapada = card.id === 'mayapada_signature';
  const isOcbc = card.id === 'ocbc_nyala';
  const isBri = card.id === 'bri_easy_card';

  let description = "";
  let caveat = "";

  if (isHsbc) {
    description = `**HSBC Live+** is probably your best fit because your monthly spending naturally unlocks its strongest cashback categories like dining and groceries, while keeping the experience straightforward without needing extra app tasks or rotating categories.`;
    caveat = `Just make sure you consistently meet the monthly spending threshold of **${formatIDR(card.minimum_spend)}** to qualify for the highest cashback rate.`;
  } else if (isUob) {
    description = `**UOB TMRW** is your optimal match to squeeze out maximum cashback. Since you are willing to manage an optimized strategy, its high rates for categories like ${card.eligible_categories.slice(0, 3).join(' and ')} will reward your efforts handsomely.`;
    caveat = `You'll need to complete 2 QRIS transactions and 2 bill payments in the mobile app monthly, and ensure your monthly cashback doesn't fall below Rp 50.000 to avoid voiding the rewards.`;
  } else if (isDbs) {
    description = `**DBS Live Fresh** is an excellent choice tailored to your online footprint. Your shopping patterns align directly with its focus on ecommerce and digital payments, yielding a clean, high return on your online purchases.`;
    caveat = `To keep the premium rate active, make sure you execute at least 5 offline transactions and remember to complete the manual monthly SMS claim.`;
  } else if (isPermata) {
    description = `**Permata Shopcard** is your strongest candidate because it splits rewards evenly across your online shopping and general offline spends, offering a highly balanced and flexible safety net for mixed transactions.`;
    caveat = `Ensure your total monthly spending remains above **${formatIDR(card.minimum_spend)}** so that your accumulated cashback isn't completely voided.`;
  } else if (isMayapada) {
    description = `**Mayapada Signature** fits your lifestyle perfectly by offering robust cashback on everyday family essentials like groceries, fuel, and healthcare without requiring you to jump through complex digital app loops.`;
    caveat = `Keep your total monthly statement spend above **${formatIDR(card.minimum_spend)}** to qualify for the full cashback value.`;
  } else if (isOcbc) {
    description = `**OCBC Nyala** offers a calm, simple baseline option. It is best if you prefer passive rewards for online shopping and streaming subscriptions, without having to actively optimize rotating categories.`;
    caveat = `You'll need to sustain a monthly spend of **${formatIDR(card.minimum_spend)}** to activate the cashback benefits.`;
  } else if (isBri) {
    description = `**BRI Easy Card** is a great, beginner-friendly starting point. It fits light spending habits perfectly, rewarding grocery and fuel fills automatically without any minimum monthly spend pressure.`;
    caveat = `Keep in mind the card has a very low cashback rate and a modest monthly cap, meaning it is best for smaller transaction sizes.`;
  } else {
    description = `**${card.name}** is your strongest match. Its reward categories directly match your high expenses in ${card.eligible_categories.join(' and ')}, offering a solid return relative to other credit portfolios.`;
    caveat = `Be mindful of its active qualifier: ${card.key_requirement || 'maintain minimum monthly spend'}.`;
  }

  return `${description}\n\n⚠️ ${caveat}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spendingProfile, recommendedCards } = body as {
      spendingProfile: SpendingProfile;
      recommendedCards: CashbackCalculationResult[];
    };

    if (!spendingProfile || !recommendedCards || recommendedCards.length === 0) {
      return NextResponse.json(
        { error: 'Missing spending profile or card recommendations' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const topCardResult = recommendedCards[0];
        const prompt = `
You are a premium cashback credit card recommendation assistant for Indonesian users.

The user has already seen cashback comparisons, estimated rewards, category breakdowns, and card details in the UI.

Your job is to recommend the single strongest card based on the user's spending profile and explain the recommendation clearly and confidently.

Tone:
- concise, modern, and trustworthy
- sound like premium fintech or digital banking app copy
- practical and helpful without sounding robotic
- slightly opinionated and decisive
- optimized for mobile readability

Formatting rules:
- Maximum 2 short paragraphs
- First paragraph = recommendation + reasoning
- Second paragraph = caveat only
- Start caveat paragraph with ⚠️
- No headers
- No bullet points
- No markdown formatting
- No long explanations
- No chatbot filler language

Behavior rules:
- Recommend ONLY one card
- Do not compare multiple cards
- Do not repeat cashback calculations already shown in the UI
- Prioritize realistic usability over theoretical optimization
- Mention the most important real-world requirement, activation condition, or transaction limitation that affects cashback eligibility
- Be specific about restrictions such as app-only transactions, online-only eligibility, partner merchants, contactless spend, or account linking
- Mention complexity if the card requires behavioral effort to maximize rewards
- Avoid generic financial advice
- Avoid sounding uncertain or overly cautious
- Do not invent benefits or simplify important restrictions
- Never describe a card as straightforward, simple, or low-effort if cashback eligibility depends on app usage, transaction channels, merchant restrictions, or activation requirements
- If a card has app-only, online-only, or merchant-specific conditions, explicitly mention them in the caveat
- NEVER describe a card as straightforward, simple, effortless, or low-maintenance if cashback eligibility depends on app usage, merchant restrictions, activation steps, transaction channels, or conditional spending requirements
- Treat app-only, online-only, merchant-only, or contactless-only cashback conditions as major caveats, not minor details

Available recommendation data:

Top recommended card:
${JSON.stringify(topCardResult, null, 2)}

User spending profile:
${JSON.stringify(spendingProfile, null, 2)}

Important:
- ONLY recommend cards explicitly provided in the recommendation data
- NEVER invent card names, issuers, benefits, or cashback mechanics
- Base the explanation strictly on the provided card fields

Preferred style example:

“HSBC Live+ is probably your best fit because your monthly dining and grocery spending aligns naturally with its strongest cashback categories. It also delivers strong rewards

⚠️ The higher cashback rate only applies if you consistently meet the monthly spending threshold through eligible app-based transactions, so offline purchases may not fully qualify.`;

        const response = await model.generateContent(prompt);
        const text = response.response.text();

        return NextResponse.json({ recommendation: text.trim(), isMock: false });
      } catch (geminiError: unknown) {
        console.error('Gemini API Error, falling back to mock:', geminiError);
        const message = geminiError instanceof Error ? geminiError.message : 'Unknown Gemini error';
        const mockRecommendation = generateMockRecommendation(spendingProfile, recommendedCards);
        return NextResponse.json({ recommendation: mockRecommendation, isMock: true, error: message });
      }
    } else {
      const mockRecommendation = generateMockRecommendation(spendingProfile, recommendedCards);
      return NextResponse.json({ recommendation: mockRecommendation, isMock: true });
    }
  } catch (error: unknown) {
    console.error('API Handler Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
