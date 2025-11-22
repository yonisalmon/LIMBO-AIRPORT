import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TRANSLATIONS & CONFIG --- //
const translations = {
    he: {
        title: "המזוודה של הנודד",
        subtitle: "מסע נרטיבי קצר אל תוך חפצים, זכרונות ושאלות.",
        packButton: "ארוז את המזוודה",
        generatingText: "אורז את חלומותיך ומאייר את החפצים...",
        generatingConclusionText: "מחתימים דרכונים...",
        journeyLogTitle: "יומן המסע",
        questionTitle: "שאלה",
        packedItemsTitle: "פריטים ארוזים",
        selectObjectInstruction: "בחר חפץ מהמזוודה כדי לענות.",
        answerPlaceholder: "כתוב את תשובתך כאן...",
        continueJourneyButton: "המשך במסע",
        newJourneyButton: "התחל מסע חדש",
        letterObjectName: "מכתב",
        letterObjectDescription: "מכתב מסתורי.",
        closeButton: "סגור",
        apiKeyRequired: "נדרש מפתח API",
        apiKeyDescription: "כדי להשתמש בתכונות היצירתיות, אנא בחר מפתח API. ודא שהוא משויך לפרויקט עם חיוב מופעל כדי למנוע שגיאות מכסה.",
        apiKeyLearnMore: "למידע נוסף על חיוב",
        apiKeySelectButton: "בחר מפתח API",
        initializing: "מאתחל...",
        errorGeneric: "המודל עמוס כרגע או שיש שגיאת רשת. אנא נסה שוב.",
        retryButton: "נסה שוב",
    },
    en: {
        title: "The Wanderer's Suitcase",
        subtitle: "A short narrative journey into objects, memories, and questions.",
        packButton: "Pack the Suitcase",
        generatingText: "Packing your dreams and illustrating the objects...",
        generatingConclusionText: "Stamping passports...",
        journeyLogTitle: "Journey Log",
        questionTitle: "Question",
        packedItemsTitle: "Packed Items",
        selectObjectInstruction: "Select an object from the suitcase to answer.",
        answerPlaceholder: "Write your answer here...",
        continueJourneyButton: "Continue the Journey",
        newJourneyButton: "Start a New Journey",
        letterObjectName: "Letter",
        letterObjectDescription: "A mysterious letter.",
        closeButton: "Close",
        apiKeyRequired: "API Key Required",
        apiKeyDescription: "To use the generative features, please select an API key. Ensure it's from a project with billing enabled to avoid quota errors.",
        apiKeyLearnMore: "Learn more about billing",
        apiKeySelectButton: "Select API Key",
        initializing: "Initializing...",
        errorGeneric: "The model is currently overloaded or there is a network error. Please try again.",
        retryButton: "Try Again",
    },
    ar: {
        title: "حقيبة الهائم",
        subtitle: "رحلة سردية قصيرة إلى عالم الأشياء والذكريات والأسئلة.",
        packButton: "احزم الحقيبة",
        generatingText: "جاري حزم أحلامك ورسم أغراضك...",
        generatingConclusionText: "ختم جوازات السفر...",
        journeyLogTitle: "سجل الرحلة",
        questionTitle: "سؤال",
        packedItemsTitle: "الأغراض المحزومة",
        selectObjectInstruction: "اختر غرضًا من الحقيبة للإجابة.",
        answerPlaceholder: "اكتب إجابتك هنا...",
        continueJourneyButton: "واصل الرحلة",
        newJourneyButton: "ابدأ رحلة جديدة",
        letterObjectName: "رسالة",
        letterObjectDescription: "رسالة غامضة.",
        closeButton: "إغلاق",
        apiKeyRequired: "مفتاح API مطلوب",
        apiKeyDescription: "لاستخدام الميزات التوليدية، يرجى تحديد مفتاح API. تأكد من أنه من مشروع تم تمكين الفوترة فيه لتجنب أخطاء الحصص.",
        apiKeyLearnMore: "تعرف على المزيد حول الفوترة",
        apiKeySelectButton: "حدد مفتاح API",
        initializing: "جار التهيئة...",
        errorGeneric: "النموذج مثقل حاليًا أو هناك خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
        retryButton: "حاول مرة أخرى",
    }
};

const archetypesInternal: Record<ArchetypeKey, Record<Language, string>> = {
    wanderer: { he: 'נווד קוסמופוליטי', en: 'Cosmopolitan Nomad', ar: 'رحالة عالمي' },
    migrant: { he: 'מהגר עבודה', en: 'Migrant Worker', ar: 'عامل مهاجر' },
    exile: { he: 'גולה/מגורש', en: 'Exile/Expelled', ar: 'منفي/مطرود' },
    immigrant: { he: 'עולה (אידאליסט לאומי)', en: 'Immigrant (National Idealist)', ar: 'مهاجر (مثالي قومي)' }
};

// Specific Israeli/Cultural objects for each archetype
const archetypeSpecificObjects: Record<ArchetypeKey, string[]> = {
    migrant: [ // Worker / עבודה
        "אישור העסקה",
        "ספל קפה / חבילת קפה שחור של עלית",
        "כרטיס ביקור",
        "חולצת סוף מסלול",
        "ספר ילדים",
        "גביע קידוש",
        "תצלום משפחתי ממוסגר",
        "עניבה או ג'קט"
    ],
    exile: [ // Refugee / פליט / מגורש
        "מפתח ישן על חוט",
        "מסמך אישור שהייה",
        "שקית עם זרעים",
        "בובה ישנה",
        "פמוטים",
        "תמונה משפחתית פשוטה",
        "מצפן",
        "מטפחת"
    ],
    wanderer: [ // Nomad / נווד
        "דרכון מלא חותמות",
        "לפטופ",
        "סוללה ניידת",
        "ספר 'קיצור תולדות האנושות'",
        "מילון עברית-ספרדית",
        "שקית במבה",
        "צילום פולארויד",
        "גומייה לשיער"
    ],
    immigrant: [ // Idealist / אידיאליסט
        "אישור קבלה לתוכנית התיישבות",
        "מחברת ועט",
        "תנך ישן",
        "דגל",
        "שקית עם אדמה או מלח",
        "תצלום משפחתי",
        "ספר של א.ד. גורדון",
        "כובע טמבל או כובע עבודה"
    ]
};

const archetypeMapping: Record<string, ArchetypeKey> = {
    'archetype-expelled': 'exile',
    'archetype-worker': 'migrant',
    'archetype-immigrant': 'immigrant',
    'archetype-nomad': 'wanderer'
};


const flowchart: Record<string, {
    question: Record<Language, string>;
    options: { answer: Record<Language, string>; next: string; }[];
}> = {
    'Q1': { question: { he: "ארזת לבד?", en: "Did you pack alone?", ar: "هل حزمت أمتعتك وحدك؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q2' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q3' }] },
    'Q2': { question: { he: "עסקים או שעשוע?", en: "Business or pleasure?", ar: "عمل أم ترفيه؟" }, options: [{ answer: { he: "עסקים", en: "Business", ar: "عمل" }, next: 'Q4' }, { answer: { he: "שעשוע", en: "Pleasure", ar: "ترفيه" }, next: 'Q5' }] },
    'Q3': { question: { he: "מישהו העביר לך משהו?", en: "Did someone pass something to you?", ar: "هل أعطاك أحدهم شيئاً؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q6' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q7' }] },
    'Q4': { question: { he: "מהר או לאט?", en: "Fast or slow?", ar: "بسرعة أم ببطء؟" }, options: [{ answer: { he: "מהר", en: "Fast", ar: "بسرعة" }, next: 'Q8' }, { answer: { he: "לאט", en: "Slow", ar: "ببطء" }, next: 'Q9' }] },
    'Q5': { question: { he: "רואה חדשות?", en: "Do you watch the news?", ar: "هل تشاهد الأخبار؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q8' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q10' }] },
    'Q6': { question: { he: "גורל או בחירה חופשית?", en: "Destiny or free will?", ar: "القدر أم حرية الإرادة؟" }, options: [{ answer: { he: "גורל", en: "Destiny", ar: "القدر" }, next: 'Q9' }, { answer: { he: "בחירה", en: "Free Will", ar: "حرية الإرادة" }, next: 'Q11' }] },
    'Q7': { question: { he: "בוכה בסרטים?", en: "Do you cry at movies?", ar: "هل تبكي في الأفلام؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q10' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q11' }] },
    'Q8': { question: { he: "בורח מ- או הולך ל-?", en: "Running from, or going to?", ar: "تهرب من أم تذهب إلى؟" }, options: [{ answer: { he: "בורח מ-", en: "Running from", ar: "أهرب من" }, next: 'Q12' }, { answer: { he: "הולך ל-", en: "Going to", ar: "أذهب إلى" }, next: 'Q13' }] },
    'Q9': { question: { he: "נפרדו ממך פעם?", en: "Has anyone ever left you?", ar: "هل تركك أحد من قبل؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q12' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q14' }] },
    'Q10': { question: { he: "מרגיש/ה אשמה?", en: "Do you feel guilty?", ar: "هل تشعر بالذنب؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q13' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q15' }] },
    'Q11': { question: { he: "אזרח/ית של...?", en: "A citizen of...?", ar: "مواطن...؟" }, options: [{ answer: { he: "מדינה", en: "A country", ar: "دولة" }, next: 'Q14' }, { answer: { he: "העולם", en: "The world", ar: "العالم" }, next: 'Q15' }] },
    'Q12': { question: { he: "מאוכזב/ת?", en: "Are you disappointed?", ar: "هل أنت خائب الأمل؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q16' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q17' }] },
    'Q13': { question: { he: "זוכר/ת איך הגעת לכאן?", en: "Do you remember how you got here?", ar: "هل تتذكر كيف وصلت إلى هنا؟" }, options: [{ answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q16' }, { answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q18' }] },
    'Q14': { question: { he: "מאמינ/ה?", en: "Are you a believer?", ar: "هل أنت مؤمن؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q17' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q19' }] },
    'Q15': { question: { he: "כיוון אחד או הלוך חזור?", en: "One way or round trip?", ar: "اتجاه واحد أم ذهاب وعودة؟" }, options: [{ answer: { he: "כיוון אחד", en: "One way", ar: "اتجاه واحد" }, next: 'Q18' }, { answer: { he: "הלוך חזור", en: "Round trip", ar: "ذهاب وعودة" }, next: 'Q19' }] },
    'Q16': { question: { he: "השמש תזרח מחר?", en: "Will the sun rise tomorrow?", ar: "هل ستشرق الشمس غداً؟" }, options: [{ answer: { he: "לא בטוח", en: "Not sure", ar: "لست متأكداً" }, next: 'Q20' }, { answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q21' }] },
    'Q17': { question: { he: "הזיכרון שלך אמין?", en: "Is your memory reliable?", ar: "هل ذاكرتك موثوقة؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q20' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q22' }] },
    'Q18': { question: { he: "המסע או היעד?", en: "The journey or the destination?", ar: "الرحلة أم الوجهة؟" }, options: [{ answer: { he: "המסע", en: "The journey", ar: "الرحلة" }, next: 'Q21' }, { answer: { he: "היעד", en: "The destination", ar: "الوجهة" }, next: 'Q23' }] },
    'Q19': { question: { he: "לבד או בחברה?", en: "Alone or with others?", ar: "بمفردك أم مع آخرين؟" }, options: [{ answer: { he: "לבד", en: "Alone", ar: "بمفردي" }, next: 'Q22' }, { answer: { he: "בחברה", en: "With others", ar: "مع آخرين" }, next: 'Q23' }] },
    'Q20': { question: { he: "ויתרת על משהו יקר?", en: "Did you give up something precious?", ar: "هل تخليت عن شيء ثمين؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q24' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q25' }] },
    'Q21': { question: { he: "יש לך בית לחזור אליו?", en: "Do you have a home to return to?", ar: "هل لديك منزل تعود إليه؟" }, options: [{ answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q24' }, { answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q26' }] },
    'Q22': { question: { he: "האם אתה אופטימי?", en: "Are you optimistic?", ar: "هل أنت متفائل؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q25' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q27' }] },
    'Q23': { question: { he: "יש עליך משהו חד?", en: "Do you have something sharp on you?", ar: "هل تحمل شيئاً حاداً؟" }, options: [{ answer: { he: "לא", en: "No", ar: "لا" }, next: 'Q26' }, { answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'Q27' }] },
    'Q24': { question: { he: "האם הגבולות שלך ברורים?", en: "Are your boundaries clear?", ar: "هل حدودك واضحة؟" }, options: [{ answer: { he: "לא", en: "No", ar: "لا" }, next: 'archetype-expelled' }, { answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'archetype-worker' }] },
    'Q25': { question: { he: "ים או אדמה?", en: "Sea or land?", ar: "بحر أم يابسة؟" }, options: [{ answer: { he: "אדמה", en: "Land", ar: "يابسة" }, next: 'archetype-immigrant' }, { answer: { he: "ים", en: "Sea", ar: "بحر" }, next: 'archetype-nomad' }] },
    'Q26': { question: { he: "טוב או עוד יותר טוב?", en: "Good, or even better?", ar: "جيد أم أفضل؟" }, options: [{ answer: { he: "עוד יותר טוב", en: "Even better", ar: "أفضل" }, next: 'archetype-expelled' }, { answer: { he: "טוב", en: "Good", ar: "جيد" }, next: 'archetype-nomad' }] },
    'Q27': { question: { he: "המטרה מקדשת את האמצעים?", en: "Does the end justify the means?", ar: "هل الغاية تبرر الوسيلة؟" }, options: [{ answer: { he: "כן", en: "Yes", ar: "نعم" }, next: 'archetype-immigrant' }, { answer: { he: "לא", en: "No", ar: "لا" }, next: 'archetype-worker' }] }
};

// --- TYPES --- //
type Language = 'he' | 'en' | 'ar';

type GameObject = {
  id: number;
  name: string;
  englishName: string; // Added for reliable image generation fallback
  description: string;
  image: string;
  position: { x: number; y: number };
  isLetter?: boolean;
  visualPrompt?: string;
};

type GameData = {
  objects: Omit<GameObject, 'id' | 'position' | 'image'>[];
  questions: string[];
  letter: {
    content: string;
    from: string;
  };
};

type ConclusionData = {
    approvalText: string;
    stampImage: string;
};

type GamePhase = 'questionnaire' | 'generating' | 'playing' | 'answering' | 'letter' | 'generating-conclusion' | 'conclusion';
type ArchetypeKey = 'wanderer' | 'migrant' | 'exile' | 'immigrant';
type JourneyEntry = { question: string; answer: string; };

// --- HELPER: RETRY LOGIC --- //
// Utility function to retry async operations on 503 errors
async function callWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
    try {
        return await fn();
    } catch (error: any) {
        const isOverloaded = 
            error?.status === 503 || 
            error?.code === 503 || 
            error?.error?.code === 503 ||
            (error?.message && (error.message.includes('overloaded') || error.message.includes('UNAVAILABLE')));
            
        const isRateLimit = error?.status === 429 || error?.code === 429;

        if (retries > 0 && (isOverloaded || isRateLimit)) {
            console.warn(`API overloaded or rate limited (${error?.status || 'error'}). Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callWithRetry(fn, retries - 1, delay * 1.5);
        }
        throw error;
    }
}

// --- MAIN APP COMPONENT --- //
const App = () => {
  const [language, setLanguage] = useState<Language>('he');
  const [uiStrings, setUiStrings] = useState(translations.he);
  const [gamePhase, setGamePhase] = useState<GamePhase>('questionnaire');
  const [currentQuestionId, setCurrentQuestionId] = useState('Q1');
  const [journeyPath, setJourneyPath] = useState<JourneyEntry[]>([]);
  const [archetype, setArchetype] = useState<ArchetypeKey | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [usedObjectIds, setUsedObjectIds] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedObject, setSelectedObject] = useState<GameObject | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [conclusionData, setConclusionData] = useState<ConclusionData | null>(null);
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const suitcaseRef = useRef<HTMLDivElement>(null);
  const draggedObjectRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  const restartGame = () => {
    setGamePhase('questionnaire');
    setCurrentQuestionId('Q1');
    setJourneyPath([]);
    setArchetype(null);
    setGameData(null);
    setObjects([]);
    setUsedObjectIds([]);
    setCurrentQuestionIndex(0);
    setSelectedObject(null);
    setAnswers([]);
    setCurrentAnswer('');
    setConclusionData(null);
    setError(null);
  };
  
  useEffect(() => {
    setUiStrings(translations[language]);
    document.documentElement.lang = language;
    document.documentElement.dir = (language === 'ar' || language === 'he') ? 'rtl' : 'ltr';
    if (gamePhase === 'questionnaire' && !error) {
        restartGame();
    }
  }, [language]);

  useEffect(() => {
    const checkApiKey = async () => {
        try {
            // @ts-ignore
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsKeyReady(hasKey);
        } catch (e) {
            console.error("Error checking for API key:", e);
            setIsKeyReady(false);
        } finally {
            setIsCheckingKey(false);
        }
    };
    checkApiKey();
  }, []);


  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    setError(uiStrings.errorGeneric);
  };

  const handleRetry = () => {
      setError(null);
      console.log("Retrying operation...", gamePhase);
      if (gamePhase === 'generating' && archetype) {
          generateGame(archetype, journeyPath);
      } else if (gamePhase === 'generating-conclusion') {
          generateConclusion();
      } else {
          console.warn("Retry fallback: Clearing error state.");
      }
  };

  // --- GAME LOGIC --- //
  const getGameGenerationPrompt = (lang: Language, archetype: string, journeySummary: string) => {
    const prompts = {
        he: `בהתבסס על ארכיטיפ סמוי של "${archetype}" ועל מסע הבחירות שלו: "${journeySummary}", צור חווית משחק עבור "המזוודה של הנודד". הטון צריך להיות פואטי, מינימליסטי, ובהשראת העולם המלנכולי והקסום של טובה ינסון (המומינים). כל התוכן הטקסטואלי שאתה יוצר (שמות, תיאורים, שאלות, מכתב) חייב להיות בעברית (למעט שדות שצוינו באנגלית). עליך להגיב עם אובייקט JSON בלבד, התואם במדויק לסכמה הבאה.`,
        en: `Based on a hidden archetype of "${archetype}" and their journey of choices: "${journeySummary}", create a game experience for "The Wanderer's Suitcase". The tone should be poetic, minimalist, and inspired by the melancholic and magical world of Tove Jansson (the Moomins). All textual content you create (names, descriptions, questions, letter) must be in English. You must respond with only a JSON object, exactly matching the following schema.`,
        ar: `بناءً على نموذج أصلي مخفي لـ "${archetype}" ورحلة اختياراته: "${journeySummary}"، قم بإنشاء تجربة لعبة لـ "حقيبة الهائم". يجب أن تكون النبرة شاعرية، بسيطة، ومستوحاة من عالم توف يانسون (المومين) الحزين والساحر. كل المحتوى النصي الذي تنشئه (أسماء، أوصاف، أسئلة، رسالة) يجب أن يكون باللغة العربية. يجب أن ترد بكائن JSON فقط، مطابق تمامًا للمخطط التالي.`
    };
    return prompts[lang];
  };

  const generateGame = async (archetype: ArchetypeKey, finalJourneyPath: JourneyEntry[]) => {
    setGamePhase('generating');
    setError(null);
    const journeySummary = finalJourneyPath.map(entry => `${entry.question} -> ${entry.answer}`).join('; ');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const translatedArchetype = archetypesInternal[archetype][language];
      const prompt = getGameGenerationPrompt(language, translatedArchetype, journeySummary);
      
      const specificList = archetypeSpecificObjects[archetype].join(", ");

      const objectDescriptions = { 
          he: `בחר בדיוק 6 פריטים מהרשימה הספציפית הזו: [${specificList}]. עבור השדה 'name', השתמש בשם המדויק של החפץ כפי שהוא מופיע ברשימה (אל תמציא שם פואטי). עבור 'englishName' תן את תרגום שם החפץ לאנגלית. עבור 'description', תן תיאור פואטי ובעל עומק רגשי בעברית. עבור 'visualPrompt' תן תיאור פיזי קצר של החפץ באנגלית בלבד עבור מחולל תמונות.`,
          en: `Select exactly 6 items from this specific list: [${specificList}]. For 'name', use the exact name. For 'englishName', use the English name. For 'description', provide a poetic description. For 'visualPrompt', provide a short visual description in English.`,
          ar: `اختر بالضبط 6 عناصر من هذه القائمة: [${specificList}]. بالنسبة لـ 'name' استخدم الاسم الدقيق. بالنسبة لـ 'englishName' استخدم الاسم بالإنجليزية. بالنسبة لـ 'description' قدم وصفًا شعريًا. بالنسبة لـ 'visualPrompt' قدم وصفًا مرئيًا بالإنجليزية.`
      };
      const questionDescriptions = { he: "רשימה של בדיוק 4 שאלות אינטרוספקטיביות ופואטיות בעברית.", en: "A list of exactly 4 introspective, poetic questions.", ar: "قائمة من 4 أسئلة استبطانية وشاعرية." };
      
      const genResponse = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                  objects: {
                    type: Type.ARRAY,
                    description: objectDescriptions[language],
                    items: { 
                        type: Type.OBJECT, 
                        properties: { 
                            name: { type: Type.STRING, description: "The exact name from the provided list in the target language." }, 
                            englishName: { type: Type.STRING, description: "The name of the object translated to English (crucial for image generation)." },
                            description: { type: Type.STRING, description: "A poetic description in the target language." },
                            visualPrompt: { type: Type.STRING, description: "A short visual description of the object in English for an image generator. Keep it simple and physical." }
                        }, 
                        required: ['name', 'englishName', 'description', 'visualPrompt'] 
                    }
                  },
                  questions: { type: Type.ARRAY, description: questionDescriptions[language], items: { type: Type.STRING } },
                  letter: {
                    type: Type.OBJECT,
                    description: 'A personal, touching letter in the target language from someone close, saying goodbye.',
                    properties: { content: { type: Type.STRING }, from: { type: Type.STRING } }, required: ['content', 'from']
                  }
                },
                required: ['objects', 'questions', 'letter']
              },
        },
      }));

      const data: GameData = JSON.parse(genResponse.text!);

      // Style: Tove Jansson / Nordic Storybook Style
      // "Soft hand-drawn ink sketch of [object]. Minimalist storybook style. White background. No shading."
      const createSafePrompt = (desc: string) => `Soft hand-drawn ink sketch of ${desc}. Minimalist storybook style. White background. Clean lines. High quality.`;
      
      const letterImagePrompt = `Soft hand-drawn ink sketch of a sealed envelope. Minimalist storybook style. White background.`;
      
      const safeGenerateImage = async (prompt: string, fallbackPrompt: string | null, aspectRatio: '1:1' | '16:9' = '1:1') => {
          // Using Nano Banana 2 (gemini-3-pro-image-preview) as requested
          try {
              return await callWithRetry(() => ai.models.generateContent({ 
                  model: 'gemini-3-pro-image-preview', 
                  contents: { parts: [{ text: prompt }] },
                  config: { 
                      imageConfig: { 
                          aspectRatio: aspectRatio === '16:9' ? '16:9' : '1:1',
                          imageSize: '1K'
                      }
                  }
              }), 1);
          } catch (e: any) {
              // If the first prompt failed (likely due to safety on the description), try the fallback (simple name)
              if (fallbackPrompt) {
                  console.warn("Primary prompt failed, trying fallback prompt...", fallbackPrompt);
                   try {
                      return await callWithRetry(() => ai.models.generateContent({ 
                          model: 'gemini-3-pro-image-preview', 
                          contents: { parts: [{ text: fallbackPrompt }] },
                          config: { 
                              imageConfig: { 
                                  aspectRatio: aspectRatio === '16:9' ? '16:9' : '1:1',
                                  imageSize: '1K'
                              }
                          }
                      }), 1);
                  } catch (fallbackError) {
                      console.warn("Fallback prompt also failed.");
                  }
              }
              
              const isBillingError = e?.status === 400 || e?.code === 400 || (e?.message && (e.message.includes('billing') || e.message.includes('accessible to billed users') || e.message.includes('INVALID_ARGUMENT')));
              if (isBillingError) {
                  console.warn("Image generation billing/permission error, using placeholder.", e);
                  return null;
              }
              console.warn("Image generation failed (safety or other), using placeholder.", e);
              return null;
          }
      };

      // Throttled image generation
      const generatedImages = [];
      for (let i = 0; i < data.objects.length; i++) {
          const obj = data.objects[i];
          const visual = obj.visualPrompt || obj.englishName || obj.name;
          const primaryPrompt = createSafePrompt(visual);
          
          // Fallback MUST use englishName if available, otherwise name. 
          const fallbackName = obj.englishName || obj.name; 
          const fallbackPrompt = createSafePrompt(fallbackName); 

          const res = await safeGenerateImage(primaryPrompt, fallbackPrompt, '1:1');
          
          // Parse Gemini 3 Pro Image response (inlineData)
          let imageBase64 = null;
          if (res?.candidates?.[0]?.content?.parts) {
             for (const part of res.candidates[0].content.parts) {
                 if (part.inlineData) {
                     imageBase64 = part.inlineData.data;
                     break;
                 }
             }
          }

          // Cloud Scribble Placeholder
          const placeholderSvg = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur in='SourceGraphic' stdDeviation='2'/%3E%3C/filter%3E%3Cpath d='M20,50 Q25,25 50,30 Q75,15 80,40 Q100,50 85,75 Q70,95 50,85 Q25,95 15,70 Q-5,50 20,50 Z' fill='none' stroke='%23FFFFFF' stroke-width='2' opacity='0.6' filter='url(%23blur)'/%3E%3C/svg%3E";
          
          generatedImages.push(imageBase64 ? `data:image/png;base64,${imageBase64}` : placeholderSvg);
          await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2s delay to prevent rate limits
      }
      
      const letterRes = await safeGenerateImage(letterImagePrompt, null, '16:9');
      let letterImageBase64 = null;
      if (letterRes?.candidates?.[0]?.content?.parts) {
          for (const part of letterRes.candidates[0].content.parts) {
              if (part.inlineData) {
                  letterImageBase64 = part.inlineData.data;
                  break;
              }
          }
      }

      const letterPlaceholderSvg = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect x='10' y='10' width='80' height='40' fill='none' stroke='%23FFFFFF' stroke-width='2' stroke-dasharray='5,5' opacity='0.7'/%3E%3Ctext x='50' y='35' font-family='serif' font-size='20' text-anchor='middle' fill='%23FFFFFF' opacity='0.7'%3E✉%3C/text%3E%3C/svg%3E";
      const letterImage = letterImageBase64
          ? `data:image/png;base64,${letterImageBase64}`
          : letterPlaceholderSvg;


      const placedRects: {x: number, y: number, width: number, height: number}[] = [];
      
      // Reduced collision percent (22x30) to allow tighter packing and prevent "giving up" (overlapping at 0,0).
      // Visual size is handled by CSS.
      const objectCollisionWidth = 22, objectCollisionHeight = 30; 
      
      // Letter is fixed at bottom right
      const letterWidthPercent = 23, letterHeightPercent = 18;
      const letterX = 100 - letterWidthPercent - 5; // 72%
      const letterY = 100 - letterHeightPercent - 5; // 77%
      placedRects.push({ x: letterX, y: letterY, width: letterWidthPercent, height: letterHeightPercent });

      const newObjects: GameObject[] = data.objects.map((obj, i) => {
        let position = { x: 5, y: 5 }; // Default fallback
        let overlaps = true, attempts = 0;
        const maxAttempts = 200; // More attempts to find a spot

        while (overlaps && attempts < maxAttempts) {
            const potentialX = Math.random() * (100 - objectCollisionWidth);
            const potentialY = Math.random() * (100 - objectCollisionHeight);
            const newRect = { x: potentialX, y: potentialY, width: objectCollisionWidth, height: objectCollisionHeight };
            
            overlaps = placedRects.some(rect => 
                newRect.x < rect.x + rect.width && 
                newRect.x + newRect.width > rect.x && 
                newRect.y < rect.y + rect.height && 
                newRect.y + newRect.height > rect.y
            );

            if (!overlaps) {
                position = { x: potentialX, y: potentialY };
                placedRects.push(newRect);
            }
            attempts++;
        }
        return { ...obj, id: i, image: generatedImages[i], position };
      });

      newObjects.push({ id: data.objects.length, name: uiStrings.letterObjectName, englishName: "Letter", description: uiStrings.letterObjectDescription, image: letterImage, position: { x: letterX + letterWidthPercent / 2, y: letterY + letterHeightPercent / 2 }, isLetter: true });

      setObjects(newObjects);
      setGameData(data);
      setGamePhase('playing');
    } catch (error) {
      handleApiError(error);
    }
  };
  
    const generateConclusion = async () => {
        if (!gameData || !archetype) return;

        setGamePhase('generating-conclusion');
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const translatedArchetype = archetypesInternal[archetype][language];
            
            const initialJourney = journeyPath.map(e => `${e.question} -> ${e.answer}`).join('; ');
            const journeySummary = `The traveler is a "${translatedArchetype}". Initial choices: "${initialJourney}". Their answers in the suitcase: ${answers.join('; ')}.`;
            
            const getConclusionPrompt = (lang: Language, summary: string) => {
                 const prompts = {
                    he: `המסע של המטייל מסוכם כך: ${summary}. אל תחזור על המילים שלו ואל תסכם את דבריו. כתוב לו ברכת דרך קצרה, רוחנית ועמוקה לדרכון. הברכה צריכה לנבוע מהרוח של הדברים שהוא בחר וכתב, ולא מהמילוליות שלהם. תן לו צידה לדרך לנשמה, רגע של חסד לפני ההמשך. הטקסט צריך להיות בן 1-2 משפטים בעברית. השב *אך ורק* עם אובייקט JSON המכיל את השדה "approvalText".`,
                    en: `The traveler's journey is summarized here: ${summary}. Do not repeat their words or summarize them. Write a short, spiritual, and deep blessing for their passport. The blessing should stem from the spirit of their choices, not their literal words. Give them provisions for the soul for the road ahead, a moment of grace. Text should be 1-2 sentences in English. Respond *only* with a JSON object containing the "approvalText" field.`,
                    ar: `تُلخص رحلة المسافر كالتالي: ${summary}. لا تكرر كلماته ولا تلخصها. اكتب له مباركة قصيرة وروحانية وعميقة لجواز السفر. يجب أن تنبع المباركة من روح اختياراته، وليس من حرفيتها. امنحه زادًا للروح لطريقه القادم، لحظة من السكينة. يجب أن يكون النص من جملة إلى جملتين باللغة العربية. أجب *فقط* بكائن JSON يحتوي على حقل "approvalText".`
                };
                return prompts[lang];
            }

            const conclusionTextPrompt = getConclusionPrompt(language, journeySummary);
            // High contrast stamp prompt
            const stampImagePrompt = `A single, minimalist, circular passport stamp design on a white background. Black ink. Abstract symbol of a bird or open door. High contrast. No text.`;

            const textResponse = await callWithRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: conclusionTextPrompt, config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { approvalText: { type: Type.STRING } }, required: ['approvalText'] } } }));
            
            let stampUrl = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23000000' stroke-width='3'/%3E%3Ctext x='50' y='55' font-family='serif' font-size='14' text-anchor='middle' fill='%23000000' transform='rotate(-15 50 50)'%3EAPPROVED%3C/text%3E%3C/svg%3E";
            
            try {
                // Using Gemini 3 Pro Image Preview for the stamp as well
                 const imageResponse = await callWithRetry(() => ai.models.generateContent({ 
                     model: 'gemini-3-pro-image-preview', 
                     contents: { parts: [{ text: stampImagePrompt }] },
                     config: { 
                          imageConfig: { 
                              aspectRatio: '1:1',
                              imageSize: '1K'
                          }
                      }
                 }), 1);
                 
                let stampBase64 = null;
                if (imageResponse?.candidates?.[0]?.content?.parts) {
                    for (const part of imageResponse.candidates[0].content.parts) {
                        if (part.inlineData) {
                            stampBase64 = part.inlineData.data;
                            break;
                        }
                    }
                }

                if (stampBase64) stampUrl = `data:image/png;base64,${stampBase64}`;
            } catch (e: any) {
                 console.warn("Stamp generation failed, using fallback.", e);
            }

            const textData = JSON.parse(textResponse.text!);

            setConclusionData({ approvalText: textData.approvalText, stampImage: stampUrl });
            setGamePhase('conclusion');

        } catch (error) {
            handleApiError(error);
        }
    };

  const handleFlowchartAnswer = (nextId: string, question: string, answer: string) => {
    const newJourneyPath = [...journeyPath, { question, answer }];
    setJourneyPath(newJourneyPath);

    if (nextId.startsWith('archetype-')) {
        const archetypeKey = archetypeMapping[nextId];
        if (archetypeKey) {
            setArchetype(archetypeKey);
            generateGame(archetypeKey, newJourneyPath);
        }
    } else {
        setCurrentQuestionId(nextId);
    }
  };

  const handleSelectObject = (obj: GameObject) => {
    if (obj.isLetter) {
        setGamePhase('letter');
        return;
    }
    if (gamePhase === 'playing' || gamePhase === 'answering') {
      setSelectedObject(obj);
      setGamePhase('answering');
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim() || !selectedObject) return;
    setAnswers([...answers, currentAnswer]);
    setUsedObjectIds([...usedObjectIds, selectedObject.id]);
    setCurrentAnswer('');
    setSelectedObject(null);
    if (currentQuestionIndex < (gameData?.questions.length ?? 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setGamePhase('playing');
    } else {
      setTimeout(generateConclusion, 50);
    }
  };

  const handleSelectKey = async () => {
        try {
            // @ts-ignore
            await window.aistudio.openSelectKey();
            setIsKeyReady(true);
        } catch (e) {
            console.error("Key selection dialog was closed or failed.", e);
        }
    };

  // --- DRAG AND DROP LOGIC --- //
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
    const objElement = e.currentTarget;
    const rect = objElement.getBoundingClientRect();
    draggedObjectRef.current = { id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    isDraggingRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    objElement.style.cursor = 'grabbing';
    objElement.style.zIndex = '100';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedObjectRef.current || !suitcaseRef.current) return;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) { isDraggingRef.current = true; }
    if (isDraggingRef.current) {
        const { id, offsetX, offsetY } = draggedObjectRef.current;
        const suitcaseRect = suitcaseRef.current.getBoundingClientRect();
        const objEl = document.getElementById(`object-${id}`);
        const objectWidth = objEl?.clientWidth || 150;
        const objectHeight = objEl?.clientHeight || 150;
        const newX = e.clientX - suitcaseRect.left - offsetX;
        const newY = e.clientY - suitcaseRect.top - offsetY;
        const clampedX = Math.max(0, Math.min(newX, suitcaseRect.width - objectWidth));
        const clampedY = Math.max(0, Math.min(newY, suitcaseRect.height - objectHeight));
        setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, position: { x: (clampedX / suitcaseRect.width) * 100, y: (clampedY / suitcaseRect.height) * 100 } } : obj));
    }
  };
  
  const handleMouseUp = () => {
    if (draggedObjectRef.current) {
        if (!isDraggingRef.current) {
            const clickedObject = objects.find(obj => obj.id === draggedObjectRef.current?.id);
            if (clickedObject) handleSelectObject(clickedObject);
        }
        const objElement = document.getElementById(`object-${draggedObjectRef.current.id}`);
        if(objElement) { objElement.style.cursor = 'grab'; objElement.style.zIndex = '10'; }
    }
    draggedObjectRef.current = null;
    isDraggingRef.current = false;
  };

  // --- RENDER FUNCTIONS --- //
  const renderSelectKeyPrompt = () => (
    <div className="initial-screen">
        <div className="initial-container" style={{textAlign: 'center', gap: '25px'}}>
            <h2>{uiStrings.apiKeyRequired}</h2>
            <p>{uiStrings.apiKeyDescription}</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer">
                {uiStrings.apiKeyLearnMore}
            </a>
            <button onClick={handleSelectKey}>{uiStrings.apiKeySelectButton}</button>
        </div>
    </div>
  );

  const renderQuestionnaire = () => {
    const currentQNode = flowchart[currentQuestionId];
    if (!currentQNode) return null;

    return (
        <div className="initial-screen">
            <div className="initial-container">
                <div className="language-selection">
                    <button onClick={() => setLanguage('en')} className={language === 'en' ? 'selected' : ''}>English</button>
                    <button onClick={() => setLanguage('he')} className={language === 'he' ? 'selected' : ''}>עברית</button>
                    <button onClick={() => setLanguage('ar')} className={language === 'ar' ? 'selected' : ''}>العربية</button>
                </div>

                <div className="questionnaire-content" key={currentQuestionId}>
                    <p className="questionnaire-question">{currentQNode.question[language]}</p>
                    <div className="questionnaire-options">
                        {currentQNode.options.map((opt, idx) => (
                            <button key={idx} onClick={() => handleFlowchartAnswer(opt.next, currentQNode.question[language], opt.answer[language])}>
                                {opt.answer[language]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


  const renderGeneratingScreen = () => (
    <div className="generating-screen">
        {error ? (
            <div className="initial-container" style={{borderColor: '#ff6b6b', boxShadow: '0 0 15px rgba(255, 107, 107, 0.3)'}}>
                <h3 style={{color: '#ff6b6b'}}>!</h3>
                <p>{error}</p>
                <button onClick={handleRetry}>{uiStrings.retryButton}</button>
                <button className="secondary" onClick={restartGame} style={{marginTop: '10px', fontSize: '0.9rem', border: 'none', background: 'none', color: 'var(--text-primary)', opacity: 0.7}}>{uiStrings.newJourneyButton}</button>
            </div>
        ) : (
            <>
                {gamePhase === 'generating-conclusion' ? (
                    <div className="abstract-loader-container">
                         <svg className="stamp-loader" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <rect x="35" y="20" width="30" height="10" fill="var(--glow-primary-transparent)" rx="2" />
                            <rect x="45" y="30" width="10" height="30" fill="var(--glow-primary-transparent)" />
                            <rect x="30" y="60" width="40" height="10" fill="var(--glow-primary-transparent)" rx="2" />
                            <circle cx="50" cy="85" r="10" fill="none" stroke="var(--glow-primary)" strokeWidth="2" strokeDasharray="3,3" opacity="0.5">
                                <animate attributeName="r" from="5" to="15" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                    </div>
                ) : (
                    <div className="abstract-loader-container">
                        <svg className="abstract-loader" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 10 A 40 40 0 1 1 10 50" stroke="var(--glow-primary-transparent)" strokeWidth="3" fill="none" strokeDasharray="5,10" />
                            <circle cx="50" cy="50" r="25" fill="none" stroke="var(--glow-primary-transparent)" strokeWidth="1" />
                            <path d="M50,20 L50,80 M20,50 L80,50" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                            <g transform="translate(50,50)">
                                <g style={{ animation: 'spin 12s linear infinite' }}>
                                    <path d="M0 -30 L 10 0 L -10 0 Z" fill="var(--glow-primary-transparent)"/>
                                    <circle cx="0" cy="35" r="3" fill="var(--glow-primary-transparent)" />
                                </g>
                                <g style={{ animation: 'spin-reverse 18s linear infinite' }}>
                                    <path d="M-40 0 L -30 10 L -30 -10 Z" fill="rgba(255,255,255,0.2)"/>
                                </g>
                            </g>
                        </svg>
                    </div>
                )}
                <p>{gamePhase === 'generating' ? uiStrings.generatingText : uiStrings.generatingConclusionText}</p>
            </>
        )}
    </div>
  );

  const renderGame = () => (
    <div className="game-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="main-game-area">
          {gameData && (
              <div className="question-display">
                  <h3>{uiStrings.questionTitle} {currentQuestionIndex + 1}/{gameData.questions.length}</h3>
                  <p>{gameData.questions[currentQuestionIndex]}</p>
              </div>
          )}

          <div ref={suitcaseRef} style={suitcaseFrameStyle}>
            <div style={suitcaseHandleStyle}></div>
            <div style={{...suitcaseCornerStyle, top: 0, left: 0}}></div>
            <div style={{...suitcaseCornerStyle, top: 0, right: 0, transform: 'rotate(90deg)'}}></div>
            <div style={{...suitcaseCornerStyle, bottom: 0, left: 0, transform: 'rotate(-90deg)'}}></div>
            <div style={{...suitcaseCornerStyle, bottom: 0, right: 0, transform: 'rotate(180deg)'}}></div>

            <div className="suitcase-interior-styled">
              {objects.filter(o => !usedObjectIds.includes(o.id)).map((obj, i) => 
                obj.isLetter ? (
                    <img key={obj.id} id={`object-${obj.id}`} src={obj.image} alt={obj.name} className="suitcase-object-img letter-object" style={{ position: 'absolute', left: `${obj.position.x}%`, top: `${obj.position.y}%`, transform: 'translate(-50%, -50%)', animationDelay: `${1.5 + i * 0.1}s` }} onClick={() => handleSelectObject(obj)} />
                ) : (
                    <div key={obj.id} id={`object-${obj.id}`} className="suitcase-object-container" style={{ left: `${obj.position.x}%`, top: `${obj.position.y}%`, position: 'absolute', cursor: 'grab', animationDelay: `${1.5 + i * 0.1}s` }} onMouseDown={(e) => handleMouseDown(e, obj.id)}>
                    <img src={obj.image} alt={obj.name} className="suitcase-object-img"/>
                    <p className="suitcase-object-name">{obj.name}</p>
                    </div>
                )
              )}
            </div>

            {usedObjectIds.length > 0 && (
                <div className="packed-items-tray">
                    <h4>{uiStrings.packedItemsTitle}</h4>
                    <div>
                        {objects.filter(o => usedObjectIds.includes(o.id)).map(obj => (
                            <img key={`packed-${obj.id}`} src={obj.image} alt={obj.name} title={obj.name} />
                        ))}
                    </div>
                </div>
            )}
          </div>
      </div>
    </div>
  );
  
  const renderAnsweringModal = () => selectedObject && (
    <div className="answering-modal-overlay" onClick={() => { setSelectedObject(null); setGamePhase('playing'); }}>
        <div className="answering-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedObject.name}</h2>
            <div className="selected-object-display">
                <img src={selectedObject.image} alt={selectedObject.name}/>
                <p><i>{selectedObject.description}</i></p>
            </div>
            <textarea
                placeholder={uiStrings.answerPlaceholder}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={5}
            />
            <div className="answering-modal-buttons">
                 <button onClick={handleAnswerSubmit} disabled={!currentAnswer.trim()}>{uiStrings.continueJourneyButton}</button>
                 <button className="secondary" onClick={() => { setSelectedObject(null); setGamePhase('playing'); }}>{uiStrings.closeButton}</button>
            </div>
        </div>
    </div>
  );


   const renderLetterModal = () => (
    <div className="letter-modal-overlay" onClick={() => setGamePhase('playing')}>
        <div className="letter-modal" onClick={(e) => e.stopPropagation()}>
            <p>{gameData?.letter.content}</p>
            <p className="signature">- {gameData?.letter.from}</p>
            <button onClick={() => setGamePhase('playing')}>{uiStrings.closeButton}</button>
        </div>
    </div>
  );
  
    const renderConclusionModal = () => conclusionData && (
        <div className="conclusion-overlay">
            <div className="passport-page">
                <div className="passport-text">
                    <h2>PASSAGE CONFIRMED</h2>
                    <p>{conclusionData.approvalText}</p>
                    <div className="signature-container">
                        <svg width="150" height="60" viewBox="0 0 150 60" className="signature-svg">
                             <path d="M10,40 Q40,10 60,40 T120,30 T140,40" fill="none" stroke="var(--glow-primary-transparent)" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
                <div className="passport-stamp">
                    <img src={conclusionData.stampImage} alt="Approval Stamp" />
                </div>
            </div>
            <button onClick={restartGame}>{uiStrings.newJourneyButton}</button>
        </div>
    );

  if (isCheckingKey) {
    return <div className="generating-screen"><p>{uiStrings.initializing}</p></div>;
  }

  if (!isKeyReady) {
      return renderSelectKeyPrompt();
  }

  return (
    <main>
      <div className={`phase-container ${gamePhase === 'questionnaire' ? 'active' : ''}`}>
        {renderQuestionnaire()}
      </div>
      <div className={`phase-container ${gamePhase === 'generating' || gamePhase === 'generating-conclusion' ? 'active' : ''}`}>
        {renderGeneratingScreen()}
      </div>
      <div className={`phase-container ${gamePhase === 'playing' || gamePhase === 'answering' ? 'active' : ''}`}>
        {renderGame()}
      </div>
      {gamePhase === 'answering' && renderAnsweringModal()}
      {gamePhase === 'letter' && renderLetterModal()}
      {gamePhase === 'conclusion' && renderConclusionModal()}
    </main>
  );
};

const suitcaseFrameStyle: React.CSSProperties = { position: 'relative', width: '90vw', maxWidth: '800px', height: '60vh', maxHeight: '550px', border: '1px solid var(--glow-primary-transparent)', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '20px', boxShadow: '0 0 25px rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' };
const suitcaseHandleStyle: React.CSSProperties = { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '25%', height: '30px', border: '1px solid var(--glow-primary-transparent)', borderBottom: 'none', backgroundColor: 'var(--background-dark)', borderRadius: '15px 15px 0 0' };
const suitcaseCornerStyle: React.CSSProperties = { position: 'absolute', width: '25px', height: '25px', border: '5px solid var(--glow-primary-transparent)', borderRadius: '50%', borderLeftColor: 'transparent', borderBottomColor: 'transparent', };

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}