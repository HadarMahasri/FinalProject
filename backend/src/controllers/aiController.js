// Smart AI Event Planner Assistant Controller (Anthropic Claude 4.6 Live Integration)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function buildFallbackPlan({ type, parsedBudget, parsedGuests, location }) {
  const venueShare = Math.round(parsedBudget * 0.45);
  const cateringShare = Math.round(parsedBudget * 0.25);
  const photoShare = Math.round(parsedBudget * 0.10);
  const djShare = Math.round(parsedBudget * 0.08);
  const designShare = Math.round(parsedBudget * 0.07);
  const bufferShare = Math.round(parsedBudget * 0.05);

  return {
    summary: `תוכנית תקציב מומלצת עבור ${type} בתקציב ₪${parsedBudget.toLocaleString()}`,
    recommendedBreakdown: [
      { category: 'אולם / מקום לאירוע', recommendedAmount: venueShare, percentage: '45%' },
      { category: 'קייטרינג ומזון', recommendedAmount: cateringShare, percentage: '25%' },
      { category: 'צילום סטילס ווידאו', recommendedAmount: photoShare, percentage: '10%' },
      { category: 'מוזיקה ו-DJ', recommendedAmount: djShare, percentage: '8%' },
      { category: 'עיצוב ופרחים', recommendedAmount: designShare, percentage: '7%' },
      { category: 'רזרבה ובלתי צפוי', recommendedAmount: bufferShare, percentage: '5%' }
    ],
    adviceList: [
      `לסוג אירוע "${type}" עם ${parsedGuests} מוזמנים באזור ${location || 'המרכז'}, מומלץ לסגור מקום כ-6-9 חודשים מראש.`,
      `תקציב מוערך לאורח: ₪${Math.round(parsedBudget / parsedGuests)}`,
      `צלם ודיג'יי הם ספקים מבוקשים בסופי שבוע - מומלץ לשריין תאריך מיד לאחר סגירת האולם.`,
      `שמרנו רשת ביטחון של ₪${bufferShare.toLocaleString()} (5%) להוצאות בלתי צפויות.`
    ],
    checklist: [
      'הגדרת תקציב מסגרת ורשימת מוזמנים ראשונית',
      'תיאום סיור ב-2-3 גני/אולמות אירועים',
      'פגישה עם צלם וסגירת חבילת צילום',
      'פגישת מוזיקה עם DJ לבניית פלייליסט',
      'טעימות קייטרינג ובחירת תפריט finale'
    ]
  };
}

function buildSmartAdvice(prompt) {
  const p = prompt.toLowerCase();

  if (p.includes('שיר') || p.includes('מוזיקה') || p.includes('פלייליסט') || p.includes('dj') || p.includes('דיג')) {
    return `🎵 **המלצת מוזיקה ושירים לאירוע:**\n- **כניסה ואירועים מרגשים**: שירים קלאסיים ומרגשים כמו "חופה" של חנן בן ארי, "Perfect" של אד שירן, או "ניצחת איתי הכל".\n- **לרחבת הריקודים**: שילוב מקפיץ של מיינסטרים ישראלי (עומר אדם, עדן חסון), פופ בינלאומי (פארל וויליאמס, דואה ליפה) ורגאטון.\n- **טיפ זהב**: תאמו פלייליסט "שיר חובה" ו"שירים שאסור לנגן" מראש מול ה-DJ שלכם בקטלוג!`;
  }

  if (p.includes('צלם') || p.includes('צילום') || p.includes('וידאו') || p.includes('אלבום')) {
    return `📸 **טיפים לבחירת צלם לאירוע:**\n- **צוות הצילום**: לאירוע מעל 200 מוזמנים מומלץ לפחות 2 צלמי סטילס + צלם וידאו אחד.\n- **חבילה ותוספות**: בדקו האם החבילה כוללת אלבומים דיגיטליים, צילום מגנטים/בלוקים, וצילום רחפן.\n- **זמני אספקה**: ודאו שבחוזה מוגדר זמן אספקה שקוף לתמונות (עד 30-45 יום) ולאלבום המודפס.`;
  }

  if (p.includes('אולם') || p.includes('גן') || p.includes('מקום') || p.includes('מתחם')) {
    return `🏰 **דגשים קריטיים לסגירת מקום לאירוע:**\n- **רישוי ובטיחות**: ודאו שלמקום יש רישיון עסק בתוקף וביטוח צד ג'.\n- **שקיפות מחיר**: בדקו מה כולל המחיר למנה (תאורה, הגברה, מנקים, מאבטחים, שכר מלצרים ושירות).\n- **תפריט וטעימות**: אל תסגרו מקום לפני ערב טעימות מלא של הקייטרינג והתרשמות מאיכות הסאונד בלייב!`;
  }

  if (p.includes('תקציב') || p.includes('כסף') || p.includes('כלכלי') || p.includes('מחיר') || p.includes('עלות') || p.includes('טיפ')) {
    return `💰 **מדריך ניהול תקציב נכון לאירוע:**\n- **הגדרת תקרת תקציב קשיחה**: קבעו מראש את הסכום המקסימלי כולל 5% רזרבה לבלתי צפוי.\n- **חלוקה באחוזים**: 45% אולם/מקום, 25% קייטרינג, 10% צילום, 8% DJ, 7% עיצוב.\n- **מעקב בזמן אמת**: השתמשו במחשבון התקציב של EventHub כדי לעקוב אחר פניות מאושרות ומחירים מוסכמים!`;
  }

  return `✨ **טיפ מיועץ האירועים EventHub לגבי "${prompt}"**:\nכדי להבטיח אירוע מושלם, מומלץ תמיד:\n1. לפנות ל-2-3 ספקים מומלצים בקטלוג EventHub ולהשוות הצעות מחיר.\n2. לקרוא חוות דעת ודירוגים מאומתים מבעלי אירועים קודמים.\n3. לקבוע פגישת הכרות אישית מול הספק ולסגור חוזה שקוף עם מועדי תשלום מוגדרים.`;
}

// Call Anthropic Claude Live API with Exact Model IDs
async function callClaudeAPI(systemPrompt, userPrompt) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  const cleanKey = apiKey.trim();
  const modelsToTry = [
    'claude-sonnet-4-6',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
    'claude-opus-4-6'
  ];

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.content && data.content[0] && data.content[0].text) {
          console.log(`✅ Anthropic Claude API (${model}) responded live successfully!`);
          return data.content[0].text.trim();
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Claude API (${model}) response status ${response.status}:`, errData?.error?.message || response.statusText);
      }
    } catch (err) {
      console.warn(`Claude model ${model} execution error:`, err.message);
    }
  }

  return null;
}

async function getAIPlan(req, res) {
  try {
    const { eventType, budget, guestCount, location } = req.body;

    const parsedBudget = Number(budget) || 50000;
    const parsedGuests = Number(guestCount) || 150;
    const type = eventType || 'אירוע משפחתי';

    const systemPrompt = 'את/ה יועץ/ת תכנון אירועים ישראלי/ת מנוסה (EventHub Claude Agent). בהינתן פרטי אירוע, בנה/י תוכנית תקציב מפורטת בפורמט JSON בלבד התואם בדיוק לסכמה הבאה: { "summary": "...", "recommendedBreakdown": [{"category": "...", "recommendedAmount": 1000, "percentage": "45%"}], "adviceList": ["..."], "checklist": ["..."] }. החזר JSON בלבד ללא שום דיסקליימרים.';
    const userPrompt = `סוג אירוע: ${type}\nתקציב כולל: ₪${parsedBudget}\nכמות מוזמנים: ${parsedGuests}\nאזור: ${location || 'המרכז'}`;

    let plan;
    const rawResult = await callClaudeAPI(systemPrompt, userPrompt);

    if (rawResult) {
      try {
        const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
        plan = JSON.parse(cleanJson);
      } catch (e) {
        plan = buildFallbackPlan({ type, parsedBudget, parsedGuests, location });
      }
    } else {
      plan = buildFallbackPlan({ type, parsedBudget, parsedGuests, location });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error in aiController.getAIPlan:', error);
    res.status(500).json({ message: 'שגיאה ביצירת המלצת AI.' });
  }
}

async function askAI(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'נא למלא שאלה עבור היועץ.' });
    }

    const systemPrompt = 'את/ה יועץ/ת תכנון אירועים ישראלי/ת מומחה/ית ומנוסה מאוד (EventHub AI Agent מבית Anthropic Claude). ענה/י לשאלה בצורה מועילה, חמה, מפורטת ומעשית בעברית קולחת.';
    const userPrompt = prompt.trim();

    let answer = await callClaudeAPI(systemPrompt, userPrompt);

    if (!answer) {
      answer = buildSmartAdvice(userPrompt);
    }

    res.json({ answer });
  } catch (error) {
    console.error('Error in aiController.askAI:', error);
    res.status(500).json({ message: 'שגיאה במענה AI.' });
  }
}

module.exports = {
  getAIPlan,
  askAI
};
