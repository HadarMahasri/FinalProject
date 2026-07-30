// Smart AI Event Planner Assistant Controller

async function getAIPlan(req, res) {
  try {
    const { eventType, budget, guestCount, location } = req.body;

    const parsedBudget = Number(budget) || 50000;
    const parsedGuests = Number(guestCount) || 150;
    const type = eventType || 'אירוע משפחתי';

    // Calculate realistic recommended budget split
    const venueShare = Math.round(parsedBudget * 0.45);
    const cateringShare = Math.round(parsedBudget * 0.25);
    const photoShare = Math.round(parsedBudget * 0.10);
    const djShare = Math.round(parsedBudget * 0.08);
    const designShare = Math.round(parsedBudget * 0.07);
    const bufferShare = Math.round(parsedBudget * 0.05);

    const adviceList = [
      `לסוג אירוע "${type}" עם ${parsedGuests} מוזמנים באזור ${location || 'המרכז'}, מומלץ לסגור מקום כ-6-9 חודשים מראש.`,
      `תקציב מוערך לאורח: ₪${Math.round(parsedBudget / parsedGuests)}`,
      `צלם ודיג'יי הם ספקים מבוקשים בסופי שבוע - מומלץ לשריין תאריך מיד לאחר סגירת האולם.`,
      `שמרנו רשת ביטחון של ₪${bufferShare.toLocaleString()} (5%) להוצאות בלתי צפויות.`
    ];

    const recommendedBreakdown = [
      { category: 'אולם / מקום לאירוע', recommendedAmount: venueShare, percentage: '45%' },
      { category: 'קייטרינג ומזון', recommendedAmount: cateringShare, percentage: '25%' },
      { category: 'צילום סטילס ווידאו', recommendedAmount: photoShare, percentage: '10%' },
      { category: 'מוזיקה ו-DJ', recommendedAmount: djShare, percentage: '8%' },
      { category: 'עיצוב ופרחים', recommendedAmount: designShare, percentage: '7%' },
      { category: 'רזרבה ובלתי צפוי', recommendedAmount: bufferShare, percentage: '5%' }
    ];

    const checklist = [
      'הגדרת תקציב מסגרת ורשימת מוזמנים ראשונית',
      'תיאום סיור ב-2-3 גני/אולמות אירועים',
      'פגישה עם צלם וסגירת חבילת צילום',
      'פגישת מוזיקה עם DJ לבניית פלייליסט',
      'טעימות קייטרינג ובחירת תפריט finale'
    ];

    res.json({
      summary: `תוכנית חכמה שיוצרה על ידי AI עבור ${type} בתקציב ₪${parsedBudget.toLocaleString()}`,
      recommendedBreakdown,
      adviceList,
      checklist
    });

  } catch (error) {
    console.error('Error in aiController.getAIPlan:', error);
    res.status(500).json({ message: 'שגיאה ביצירת המלצת AI.' });
  }
}

module.exports = {
  getAIPlan
};
