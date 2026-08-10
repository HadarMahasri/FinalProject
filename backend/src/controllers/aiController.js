// בקר סוכן הבינה המלאכותית (AI Event Planner Assistant Controller)
// קובץ זה מנהל את האינטגרציה מול מודלי הבינה המלאכותית (Anthropic Claude) ומספק מנגנון גיבוי חכם
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// מנגנון חישוב אלגוריתמי מובנה לתכנון תקציב (מופעל במידה ואין מפתח API זמין או במקרה של תקלת רשת)
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

// מנוע ייעוץ מובנה בעברית לשאלות בצ'אט (מופעל במקרה של בעיית רשת או Quota מול API חיצוני)
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

// פונקציית התקשורת האסינכרונית בלייב מול ה-REST API של Anthropic Claude
async function callClaudeAPI(systemPrompt, userPrompt) {
  // 1. קריאת מפתח ה-API המוצפן מתוך משתני הסביבה (process.env)
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  const cleanKey = apiKey.trim();
  // 2. רשימת המודלים הנתמכים לפי סדר עדיפויות (בראשם claude-sonnet-4-6)
  const modelsToTry = [
    'claude-sonnet-4-6',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
    'claude-opus-4-6'
  ];

  for (const model of modelsToTry) {
    try {
      // 3. שליחת בקשת HTTP POST אסינכרונית ל-Endpoint הרשמי של Anthropic Messages
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
          system: systemPrompt, // הנחיית תפקיד ה-AI
          messages: [
            { role: 'user', content: userPrompt } // קלט המשתמש
          ]
        })
      });

      // 4. אם התשובה תקינה - מפרקים את ה-JSON ומחזירים את הטקסט
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

// 1. Controller function לתכנון תקציב וצ'ק-ליסט (POST /api/ai/plan)
async function getAIPlan(req, res) {
  try {
    // שליפת פרטי האירוע שהמשתמש מילא בטופס
    const { eventType, budget, guestCount, location } = req.body;

    const parsedBudget = Number(budget) || 50000;
    const parsedGuests = Number(guestCount) || 150;
    const type = eventType || 'אירוע משפחתי';

    // הנדסת פרומפט (Prompt Engineering) המנחה את ה-AI להחזיר JSON מובנה בלבד
    const systemPrompt = 'את/ה יועץ/ת תכנון אירועים ישראלי/ת מנוסה (EventHub Claude Agent). בהינתן פרטי אירוע, בנה/י תוכנית תקציב מפורטת בפורמט JSON בלבד התואם בדיוק לסכמה הבאה: { "summary": "...", "recommendedBreakdown": [{"category": "...", "recommendedAmount": 1000, "percentage": "45%"}], "adviceList": ["..."], "checklist": ["..."] }. החזר JSON בלבד ללא שום דיסקליימרים.';
    const userPrompt = `סוג אירוע: ${type}\nתקציב כולל: ₪${parsedBudget}\nכמות מוזמנים: ${parsedGuests}\nאזור: ${location || 'המרכז'}`;

    let plan;
    // א. פנייה בלייב למודל ה-Claude
    const rawResult = await callClaudeAPI(systemPrompt, userPrompt);

    if (rawResult) {
      try {
        // ב. ניקוי תגיות Markdown והמרת ה-JSON למבנה נתונים תקין
        const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
        plan = JSON.parse(cleanJson);
      } catch (e) {
        // ג. אם חלה שגיאה בפענוח - מפעילים את אלגוריתם ה-Fallback
        plan = buildFallbackPlan({ type, parsedBudget, parsedGuests, location });
      }
    } else {
      plan = buildFallbackPlan({ type, parsedBudget, parsedGuests, location });
    }

    // החזרת תשובת ה-JSON לדפדפן
    res.json(plan);
  } catch (error) {
    console.error('Error in aiController.getAIPlan:', error);
    res.status(500).json({ message: 'שגיאה ביצירת המלצת AI.' });
  }
}

// 2. Controller function לצ'אט הייעוץ החופשי (POST /api/ai/ask)
async function askAI(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'נא למלא שאלה עבור היועץ.' });
    }

    // הנדסת פרומפט המנחה את ה-AI לענות בצורה חמה ומפורטת בעברית
    const systemPrompt = 'את/ה יועץ/ת תכנון אירועים ישראלי/ת מומחה/ית ומנוסה מאוד (EventHub AI Agent מבית Anthropic Claude). ענה/י לשאלה בצורה מועילה, חמה, מפורטת ומעשית בעברית קולחת.';
    const userPrompt = prompt.trim();

    // א. פנייה בלייב ל-Claude
    let answer = await callClaudeAPI(systemPrompt, userPrompt);

    // ב. במידה ואין תשובה מה-API - הפעלת מנוע הידע המובנה
    if (!answer) {
      answer = buildSmartAdvice(userPrompt);
    }

    // החזרת בועת התשובה לדפדפן
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
