// Matiur's AI knowledge brain: language auto-detection + a comprehensive
// keyword-intent knowledge base covering FALAH's fabrics, sizing, shipping,
// payments, policies, wholesale and product care — in bn / en / hi / ur.

export type Lang = 'bn' | 'en' | 'hi' | 'ur';

export type ProductInfo = {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  category?: string;
  basePrice?: number;
  price?: number;
  fabric?: string;
  description?: string;
};

type Answer = Record<Lang, string>;

export function findProductInText(text: string, products: ProductInfo[]): ProductInfo | null {
  const s = text.toLowerCase();
  for (const p of products) {
    const title = (p.title ?? p.name ?? '').toLowerCase();
    if (title && s.includes(title)) return p;
  }
  return null;
}

export function detectLang(text: string): Lang {
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali script
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari
  if (/[\u0600-\u06FF]/.test(text)) return 'ur'; // Arabic/Urdu script
  return 'en';
}

// English keyword detection: match on word boundaries for latin script to
// avoid false hits inside longer words.
function hasEn(s: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, 'i').test(s));
}

type Intent = {
  match: (s: string) => boolean;
  answer: Answer;
};

const INTENTS: Intent[] = [
  // ---------- FABRICS ----------
  {
    match: (s) =>
      hasEn(s, ['cherry', 'dubai cherry']) || s.includes('চেরি') || s.includes('चेरी') || s.includes('چیری'),
    answer: {
      bn: 'আমাদের দুবাই চেরি ফ্যাব্রিক খুবই জনপ্রিয় — এটি মসৃণ, হালকা ঝিলিকদার এবং পড়ে খুব সুন্দর দেখায়। গরমে আরামদায়ক, ভাঁজ পড়ে না এমন কাপড়। ধোয়ার নিয়ম: ঠান্ডা পানিতে হালকা ডিটারজেন্ট দিয়ে হাতে ধুবেন, রোদে দিলে ছায়ায় শুকাবেন। ট্রান্সপারেন্সি নিয়ে চিন্তা নেই — আমাদের চেরি আবায়া পুরোপুরি non-transparent, তবে চাইলে ভেতরে লাইনিং নেওয়া যায়।',
      en: 'Our Dubai Cherry fabric is one of our most loved materials — smooth, softly lustrous and drapes beautifully. It is comfortable in warm weather and resists wrinkles. Wash care: hand-wash in cold water with a mild detergent and dry in shade to keep the shine. Our Cherry abayas are fully non-transparent; inner lining is available on request.',
      hi: 'हमारा दुबई चेरी फैब्रिक बहुत लोकप्रिय है — चिकना, हल्की चमक वाला और बहुत सुंदर फैलता है। गर्मी में आरामदायक, कपड़े पर झुर्रियाँ कम पड़ती हैं। धुलाई: ठंडे पानी में हल्के डिटर्जेंट से हाथ से धोएँ और छाया में सुखाएँ। हमारी चेरी अबाया पूरी तरह non-transparent है; चाहें तो अंदर लाइनिंग ले सकते हैं।',
      ur: 'ہمارا دبئی چیری فیبرک بہت مقبول ہے — ہموار، نرم چمکدار اور خوبصورتی سے گرتا ہے۔ گرمی میں آرام دہ، سلوٹ کم پڑتے ہیں۔ دھلائی: ٹھنڈے پانی میں ہلکے ڈٹرجنٹ سے ہاتھ سے دھوئیں اور سایہ میں خشک کریں۔ ہماری چیری عبا مکمل غیر شفاف ہے؛ چاہیں تو اندر لائننگ لے سکتے ہیں۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['nida', 'al mas', 'almas']) || s.includes('নিদা') || s.includes('নিদা') || s.includes('अलमास') || s.includes('نیضا'),
    answer: {
      bn: 'নিদা ও আলমাস — দুটিই প্রিমিয়াম কোরিয়ান-স্টাইল কাপড়। নিদা একটু মোটা ও ম্যাট ফিনিশ, দৈনন্দিন পরার জন্য সেরা; আলমাস মসৃণ, নরম ও হালকা ঝলমলে, অনুষ্ঠানের জন্য আদর্শ। দুটিই নন-ট্রান্সপারেন্ট। মেশিনে না ধুয়ে হাতে ধোয়া ভালো; স্টিম আয়রন ব্যবহার করুন।',
      en: 'Nida and Almas are both premium Korean-style fabrics. Nida is slightly thicker with a matte finish — perfect for daily wear; Almas is smoother, softer with a gentle sheen, ideal for occasions. Both are non-transparent. Hand-wash rather than machine-wash and use a steam iron.',
      hi: 'निदा और अलमास — दोनों प्रीमियम कोरियन-स्टाइल कपड़े। निदा थोड़ा मोटा और मैट फिनिश, रोज़ पहनने के लिए बढ़िया; अलमास चिकना, मुलायम और हल्की चमक वाला, अवसरों के लिए आदर्श। दोनों non-transparent। मशीन से नहीं, हाथ से धोएँ और स्टीम आयरन इस्तेमाल करें।',
      ur: 'نیضا اور الماس — دونوں پریمیم کورین طرز کے فیبرک۔ نیضا کچھ موٹا اور میٹ فنش، روزانہ پہننے کے لیے بہترین؛ الماس ہموار، نرم اور ہلکی چمک والا، تقاریب کے لیے مثالی۔ دونوں غیر شفاف۔ مشین سے نہیں، ہاتھ سے دھوئیں اور سٹیم آئرن استعمال کریں۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['firdous', 'firdaus', 'velvet', 'organza', 'satin', 'georgette', 'cotton', 'fabric', 'cloth', 'kapar', 'material']) ||
      s.includes('ফিরদৌস') || s.includes('ভেলভেট') || s.includes('অর্গানজা') || s.includes('স্যাটিন') || s.includes('জর্জেট') || s.includes('কটন') || s.includes('কাপড়') ||
      s.includes('फिरदौस') || s.includes('कपड़ा') || s.includes('सूती') ||
      s.includes('فریدوس') || s.includes('فیبرک') || s.includes('کپڑا') || s.includes('مال'),
    answer: {
      bn: 'আমরা অনেক ধরনের প্রিমিয়াম ফ্যাব্রিকে আবায়া বানাই: দুবাই চেরি (মসৃণ, ঝলমলে), নিদা (ম্যাট, রোজকার), আলমাস (নরম ঝলক), ফিরদৌস (মোটা, শীতে ভালো), ভেলভেট (শীতকালের ধনী লুক), অর্গানজা (ওভারলেয়ার), স্যাটিন ও জর্জেট (ভাঁজ পড়ে সুন্দর), এবং পিওর কটন (গরমে সবচেয়ে আরাম)। সবই non-transparent। প্রতিটির ডিটেইল জানতে চাইলে বলুন — যেমন "চেরি কেমন?" বা "কটন গরমে কেমন?"',
      en: 'We craft abayas in many premium fabrics: Dubai Cherry (smooth, lustrous), Nida (matte, everyday), Almas (soft sheen), Firdous (thicker, great in winter), Velvet (rich winter look), Organza (layer/overlay), Satin & Georgette (beautiful drape), and Pure Cotton (coolest in summer). All are non-transparent. Ask me about any one — like "How is Cherry?" or "Is cotton good for summer?"',
      hi: 'हम कई प्रीमियम फैब्रिक में अबाया बनाते हैं: दुबई चेरी (चिकनी, चमकदार), निदा (मैट, रोज़), अलमास (नरम चमक), फिरदौस (मोटा, सर्दी के लिए), वेलवेट (सर्दी का रिच लुक), ऑर्गेन्ज़ा (लेयर), सैटिन और जॉर्जेट (सुंदर फैलाव), और प्योर कॉटन (गर्मी में सबसे आराम)। सभी non-transparent। किसी एक के बारे में पूछें — जैसे "चेरी कैसी है?" या "कॉटन गर्मी में कैसा?"',
      ur: 'ہم کئی پریمیم فیبرک میں عبا بناتے ہیں: دبئی چیری (ہموار، چمکدار)، نیضا (میٹ، روزانہ)، الماس (نرم چمک)، فریدوس (موٹا، سردیوں کے لیے)، ویلوٹ (سردیوں کا رچ لک)، اورگنزا (لیئر)، ساٹن اور جارجیٹ (خوبصورت گری)، اور پیور کاٹن (گرمی میں سب سے آرام دہ)۔ سب غیر شفاف۔ کسی ایک کے بارے میں پوچھیں — جیسے "چیری کیسی ہے؟" یا "کاٹن گرمی میں کیسا؟"',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['wash', 'care', 'iron', 'laundry', 'maintain']) ||
      s.includes('ধোয়া') || s.includes('ওয়াশ') || s.includes('আয়রন') || s.includes('যত্ন') ||
      s.includes('धोना') || s.includes('आयरन') || s.includes('देखभाल') ||
      s.includes('دھونا') || s.includes('آئرن') || s.includes('دیکھ بھال'),
    answer: {
      bn: 'যত্নের টিপস: প্রতিটি ফ্যাব্রিকের জন্য ঠান্ডা পানিতে হাতে ধোয়া সবচেয়ে ভালো। চেরি/নিদা/আলমাস — মৃদু ডিটারজেন্ট, ভিজে অবস্থায় না ভাঁজ করা, ছায়ায় শুকানো। ভেলভেট ব্রাশ করবেন না, স্টিম দিয়ে ভাঁজ মেলান। অর্গানজা/স্যাটিন — ড্রাই-ক্লিন ভালো। কটন — সহজ, নিয়মিত ধোয়া যায়। সব কাপড়ে ব্লিচ নিষেধ।',
      en: 'Care tips: For every fabric, hand-washing in cold water is best. Cherry/Nida/Almas — mild detergent, do not fold while wet, dry in shade. Velvet — do not brush, release creases with steam. Organza/Satin — dry-cleaning is preferable. Cotton — easy, regular washing is fine. Never use bleach on any of them.',
      hi: 'देखभाल: हर फैब्रिक के लिए ठंडे पानी में हाथ से धोना सबसे अच्छा। चेरी/निदा/अलमास — हल्का डिटर्जेंट, गीला कपड़ा न तोड़ें, छाया में सुखाएँ। वेलवेट — ब्रश न करें, स्टीम से सिलवट मिटाएँ। ऑर्गेन्ज़ा/सैटिन — ड्राई-क्लीन बेहतर। कॉटन — आसान, रोज़ धो सकते हैं। किसी पर भी ब्लीच नहीं।',
      ur: 'دیکھ بھال: ہر فیبرک کے لیے ٹھنڈے پانی میں ہاتھ سے دھونا بہترین۔ چیری/نیضا/الماس — ہلکا ڈٹرجنٹ، گیلا کپڑا نہ توڑیں، سایہ میں خشک کریں۔ ویلوٹ — برش نہ کریں، سٹیم سے سلوٹ دور کریں۔ اورگنزا/ساٹن — ڈرائی کلین بہتر۔ کاٹن — آسان، باقاعدہ دھل سکتا ہے۔ کسی پر بھی بلیچ نہیں۔',
    },
  },

  // ---------- SIZING ----------
  {
    match: (s) =>
      hasEn(s, ['size', 'sizing', 'fit', 'height', 'length', 'chart', 'measure']) ||
      s.includes('সাইজ') || s.includes('উচ্চতা') || s.includes('লম্বা') || s.includes('মাপ') || s.includes('ফিট') ||
      s.includes('साइज़') || s.includes('ऊँचाई') || s.includes('लंबाई') || s.includes('नाप') ||
      s.includes('سائز') || s.includes('قد') || s.includes('لمبائی') || s.includes('ناپ'),
    answer: {
      bn: 'সাইজিংয়ে আমরা আপনার উচ্চতা অনুযায়ী পরামর্শ দিই:\n• ৫২" (৪\'৮") → সাইজ ৫২\n• ৫৪" (৪\'১০") → সাইজ ৫৪\n• ৫৬" (৫\'০") → সাইজ ৫৬\n• ৫৮" (৫\'২") → সাইজ ৫৮\nপ্রোডাক্ট পেজে "আমার সাইজ খুঁজুন" টুলও আছে। বুক/চেস্টের ঢিলেঢালা ফিট, আরামদায়ক হাতা — প্রার্থনা ও দৈনন্দিন ব্যবহারের উপযোগী। প্রেগন্যান্সি-ফ্রেন্ডলি ঢিলে ফিটও পাওয়া যায়। চাইলে নিজের মাপ (লম্বা, বুক, হাতা) দিয়ে কাস্টম টেইলারিং নিতে পারেন — অর্ডার ফর্মেই সুযোগ আছে!',
      en: 'We recommend sizes by height:\n• 52" (4\'8") → Size 52\n• 54" (4\'10") → Size 54\n• 56" (5\'0") → Size 56\n• 58" (5\'2") → Size 58\nThere is also a "Find My Size" tool on each product page. Chest fits are relaxed and comfortable, sleeves are easy for prayer and daily use, and loose maternity/nursing-friendly fits are available. You can also give your own measurements (length, chest, sleeve) for custom tailoring — the order form supports it!',
      hi: 'हम ऊँचाई के हिसाब से साइज़ सुझाते हैं:\n• 52" (4\'8") → साइज़ 52\n• 54" (4\'10") → साइज़ 54\n• 56" (5\'0") → साइज़ 56\n• 58" (5\'2") → साइज़ 58\nहर प्रोडक्ट पेज पर "मेरा साइज़ खोजें" टूल भी है। चेस्ट फिट ढीला और आरामदायक, बाजू प्रार्थना और रोज़ के लिए आसान, और ढीले प्रेगनेंसी-फ्रेंडली फिट भी उपलब्ध। अपने नाप (लंबाई, छाती, बाजू) देकर कस्टम टेलरिंग भी ले सकते हैं — ऑर्डर फॉर्म में ही सुविधा है!',
      ur: 'ہم قد کے مطابق سائز تجویز کرتے ہیں:\n• 52" (4\'8") → سائز 52\n• 54" (4\'10") → سائز 54\n• 56" (5\'0") → سائز 56\n• 58" (5\'2") → سائز 58\nہر پروڈکٹ پیج پر "میرا سائز تلاش کریں" ٹول بھی ہے۔ چیسٹ فٹ ڈھیلا اور آرام دہ، آستینیں نماز اور روزمرہ کے لیے آسان، اور ڈھیلے پریگننسی فرینڈلی فٹ بھی دستیاب۔ اپنے ناپ (لمبائی، چیسٹ، آستین) دے کر کسٹم ٹیلرنگ بھی لے سکتے ہیں — آرڈر فارم میں یہ سہولت موجود ہے!',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['custom', 'tailor', 'stitch', 'measurement', 'alter']) ||
      s.includes('কাস্টম') || s.includes('টেইলর') || s.includes('সেলাই') ||
      s.includes('कस्टम') || s.includes('टेलर') || s.includes('सिलाई') ||
      s.includes('کسٹم') || s.includes('ٹیلر') || s.includes('سلائی'),
    answer: {
      bn: 'কাস্টম টেইলারিং আমাদের বিশেষত্ব! অর্ডার করার সময় আপনি লম্বা, বুক এবং হাতার মাপ লিখে দিতে পারবেন — সেই অনুযায়ী কাপড় কাটা হবে। গলার ডিজাইন বা হাতার স্টাইলের ছবি আপলোড করার সুযোগও আছে। রঙের পছন্দও জানাতে পারেন। কাস্টম অর্ডারে ২-৩ দিন বেশি সময় লাগে।',
      en: 'Custom tailoring is our speciality! While ordering you can enter your length, chest and sleeve measurements — the fabric will be cut exactly to those. You can even upload a photo of your preferred neck design or sleeve style, and mention your colour preference. Custom orders take 2-3 extra days.',
      hi: 'कस्टम टेलरिंग हमारी विशेषता है! ऑर्डर करते समय आप लंबाई, छाती और बाजू के नाप भर सकते हैं — उसी हिसाब से कपड़ा काटा जाएगा। गले के डिज़ाइन या बाजू के स्टाइल की फोटो अपलोड करने का विकल्प भी है, और रंग की पसंद भी बता सकते हैं। कस्टम ऑर्डर में 2-3 दिन अतिरिक्त लगते हैं।',
      ur: 'کسٹم ٹیلرنگ ہماری خصوصیت ہے! آرڈر کرتے وقت آپ لمبائی، چیسٹ اور آستین کے ناپ بھر سکتے ہیں — اسی حساب سے کپڑا کاٹا جائے گا۔ گلا ڈیزائن یا آستین اسٹائل کی تصویر اپلوڈ کرنے کا آپشن بھی ہے، اور رنگ کی پسند بھی بتا سکتے ہیں۔ کسٹم آرڈر میں 2-3 دن اضافی لگتے ہیں۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['maternity', 'nursing', 'pregnan', 'breastfeed']) ||
      s.includes('প্রেগন্যান্সি') || s.includes('গর্ভবতী') || s.includes('স্তন্যদান') ||
      s.includes('प्रेगनेंसी') || s.includes('गर्भवती') || s.includes('स्तनपान') ||
      s.includes('حاملہ') || s.includes('دوہت') || s.includes('نرسنگ'),
    answer: {
      bn: 'হ্যাঁ, আমরা প্রেগন্যান্সি ও নার্সিং-ফ্রেন্ডলি আবায়া বানাই — ঢিলে বুক, ওপরের দিকে বাটন/ওপেন স্টাইল এবং ফ্লেয়ার স্কার্ট ডিজাইন করা যায়। অর্ডারের সময় কাস্টম নোটে লিখে দিন, আমরা সেভাবে সেলাই করব।',
      en: 'Yes, we make maternity and nursing-friendly abayas — relaxed chest, front open/button styles and flared skirts can be tailored on request. Just mention it in the custom note while ordering and we will stitch accordingly.',
      hi: 'हाँ, हम प्रेगनेंसी और नर्सिंग-फ्रेंडली अबाया बनाते हैं — ढीली छाती, आगे बटन/ओपन स्टाइल और फ्लेयर स्कर्ट माँगने पर बन जाती है। ऑर्डर करते समय कस्टम नोट में लिख दें, हम उसी तरह सिलेंगे।',
      ur: 'جی ہاں، ہم پریگننسی اور نرسنگ فرینڈلی عبا بناتے ہیں — ڈھیلا چیسٹ، سامنے بٹن/اوپن اسٹائل اور فلئیرڈ اسکرٹ طلب پر بن سکتے ہیں۔ آرڈر کے وقت کسٹم نوٹ میں لکھ دیں، ہم اسی طرح سلائیں گے۔',
    },
  },

  // ---------- SHIPPING & LOGISTICS ----------
  {
    match: (s) =>
      hasEn(s, ['ship', 'shipping', 'deliver', 'delivery', 'courier', 'charge', 'days', 'reach', 'village', 'pincode', 'pin', 'india post', 'bluedart', 'delhivery', 'dtdc']) ||
      s.includes('ডেলিভারি') || s.includes('শিপিং') || s.includes('কুরিয়ার') || s.includes('গ্রাম') || s.includes('পিন') ||
      s.includes('डिलीवरी') || s.includes('शिपिंग') || s.includes('कूरियर') || s.includes('गाँव') || s.includes('पिन') ||
      s.includes('ڈیلیوری') || s.includes('شپنگ') || s.includes('کوریئر') || s.includes('گاؤں') || s.includes('پن'),
    answer: {
      bn: 'ডেলিভারি সম্পর্কে বিস্তারিত:\n• পশ্চিমবঙ্গ: শিপিং ₹৫০, সাধারণত ৩-৫ দিনে পৌঁছে যায়।\n• ভারতের অন্য রাজ্য: ₹৯০-₹১২০, সাধারণত ৫-৮ দিন।\nগ্রাম ও সব পিনকোডে পৌঁছে দিই — India Post, BlueDart, Delhivery ও DTDC-র মাধ্যমে। অর্ডারের পর কুরিয়ার নাম ও ট্র্যাকিং নম্বর আপনাকে জানিয়ে দেওয়া হবে, সাইটের "Track Order" দিয়ে লাইভ অবস্থান দেখতে পারবেন।',
      en: 'Shipping details:\n• West Bengal: ₹50 shipping, usually delivered in 3-5 days.\n• Rest of India: ₹90-₹120, usually 5-8 days.\nWe deliver to villages and every pincode via India Post, BlueDart, Delhivery and DTDC. After your order you will get the courier name and tracking number, and you can follow it live using "Track Order" on the site.',
      hi: 'शिपिंग विवरण:\n• पश्चिम बंगाल: ₹50 शिपिंग, आमतौर पर 3-5 दिन में।\n• बाकी भारत: ₹90-₹120, आमतौर पर 5-8 दिन।\nहम India Post, BlueDart, Delhivery और DTDC से गाँव और हर पिनकोड तक डिलीवरी करते हैं। ऑर्डर के बाद कूरियर का नाम और ट्रैकिंग नंबर मिलेगा, साइट के "Track Order" से लाइव देख सकते हैं।',
      ur: 'شپنگ کی تفصیل:\n• مغربی بنگال: ₹50 شپنگ، عام طور پر 3-5 دن میں۔\n• باقی ہندوستان: ₹90-₹120، عام طور پر 5-8 دن۔\nہم India Post، BlueDart، Delhivery اور DTDC کے ذریعے گاؤں اور ہر پن کوڈ تک ڈیلیوری کرتے ہیں۔ آرڈر کے بعد کوریئر کا نام اور ٹریکنگ نمبر ملے گا، سائٹ کے "Track Order" سے لائیو دیکھ سکتے ہیں۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['track', 'tracking', 'awb', 'where is my order', 'order status']) ||
      s.includes('ট্র্যাক') || s.includes('কোথায় আমার') || s.includes('অর্ডার স্ট্যাটাস') ||
      s.includes('ट्रैक') || s.includes('मेरा ऑर्डर कहाँ') || s.includes('ऑर्डर स्थिति') ||
      s.includes('ٹریک') || s.includes('میرا آرڈر کہاں') || s.includes('آرڈر اسٹیٹس'),
    answer: {
      bn: 'অর্ডার ট্র্যাক করা খুব সহজ: হোমপেজের ওপরে "Track Order" বোতামে ক্লিক করে আপনার Order ID (যেমন ORD-...) বা ফোন নম্বর দিন। প্যাকেজ শিপ হওয়ার পর কুরিয়ারের নাম, AWB/ট্র্যাকিং নম্বর ও ডাইরেক্ট ট্র্যাকিং লিংক সেখানে দেখতে পাবেন।',
      en: 'Tracking is easy: click "Track Order" at the top of the homepage and enter your Order ID (like ORD-...) or your phone number. Once shipped, you will see the courier name, AWB/tracking number and a direct tracking link there.',
      hi: 'ट्रैक करना आसान है: होमपेज के ऊपर "Track Order" पर क्लिक करें और अपनी Order ID (जैसे ORD-...) या फोन नंबर डालें। शिप होने के बाद कूरियर का नाम, AWB/ट्रैकिंग नंबर और सीधा ट्रैकिंग लिंक वहीं दिखेगा।',
      ur: 'ٹریکنگ آسان ہے: ہوم پیج کے اوپر "Track Order" پر کلک کریں اور اپنی Order ID (جیسے ORD-...) یا فون نمبر ڈالیں۔ شپ ہونے کے بعد کوریئر کا نام، AWB/ٹریکنگ نمبر اور سیدھا ٹریکنگ لنک وہیں نظر آئے گا۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['cancel', 'change my order', 'modify', 'address change']) ||
      s.includes('বাতিল') || s.includes('পরিবর্তন') || s.includes('ঠিকানা বদল') ||
      s.includes('रद्द') || s.includes('बदलना') || s.includes('पता बदल') ||
      s.includes('کینسل') || s.includes('منسوخ') || s.includes('تبدیلی') || s.includes('پتہ بدل'),
    answer: {
      bn: 'অর্ডার বাতিল/পরিবর্তন: প্যাকেজ শিপ হওয়ার আগে পর্যন্ত অর্ডার বাতিল বা ঠিকানা পরিবর্তন করা যায় — হোয়াটসঅ্যাপে (+91 9332376959) Order ID দিয়ে জানান। শিপ হওয়ার পরে বাতিল সম্ভব নয়, তবে ডেলিভারির পর ৭ দিনের রিটার্ন পলিসি প্রযোজ্য।',
      en: 'Cancellation & changes: you can cancel or change the delivery address any time before your parcel ships — message us on WhatsApp (+91 9332376959) with your Order ID. Once shipped, cancellation is not possible, but our 7-day return policy still applies after delivery.',
      hi: 'रद्द/बदलाव: पार्सल शिप होने से पहले तक ऑर्डर रद्द या पता बदला जा सकता है — WhatsApp (+91 9332376959) पर Order ID के साथ बताएँ। शिप होने के बाद रद्द नहीं होगा, लेकिन डिलीवरी के बाद 7-दिन की रिटर्न पॉलिसी लागू।',
      ur: 'کینسل/تبدیلی: پارسل شپ ہونے سے پہلے تک آرڈر کینسل یا پتہ بدلا جا سکتا ہے — WhatsApp (+91 9332376959) پر Order ID کے ساتھ بتائیں۔ شپ ہونے کے بعد کینسل ممکن نہیں، لیکن ڈیلیوری کے بعد 7 دن کی ریٹرن پالیسی لاگو ہے۔',
    },
  },

  // ---------- PAYMENTS & DISCOUNTS ----------
  {
    match: (s) =>
      hasEn(s, ['pay', 'payment', 'cod', 'cash on', 'upi', 'gpay', 'phonepe', 'bank', 'transfer', 'advance']) ||
      s.includes('পেমেন্ট') || s.includes('অগ্রিম') || s.includes('ক্যাশ') ||
      s.includes('भुगतान') || s.includes('अग्रिम') || s.includes('कैश') ||
      s.includes('ادائیگی') || s.includes('ادھار') || s.includes('کیش'),
    answer: {
      bn: 'পেমেন্টের সুবিধা:\n• ক্যাশ অন ডেলিভারি (COD) — পণ্য হাতে পেয়ে টাকা দিন (ছোট COD চার্জ প্রযোজ্য)।\n• প্রিপেইড: PhonePe/GPay — +91 9332376959, অথবা সরাসরি ব্যাংক ট্রান্সফার — পাঞ্জাব ন্যাশনাল ব্যাংক, অ্যাকাউন্ট হোল্ডার: Sultana Parvin।\nপ্রিপেইডে পেমেন্ট করে UTR/ট্রানজেকশন নম্বর ও স্ক্রিনশট অর্ডার ফর্মে দিলেই হবে। প্রিপেইডে সাধারণত ছোট ডিসকাউন্টও পাওয়া যায় — কুপন কোড চেক করুন!',
      en: 'Payment options:\n• Cash on Delivery (COD) — pay when the parcel arrives (small COD charge applies).\n• Prepaid: PhonePe/GPay on +91 9332376959, or direct bank transfer to Punjab National Bank (account holder: Sultana Parvin).\nAfter paying, just enter the UTR/transaction number and upload the screenshot in the order form. Prepaid orders often get a small discount — do check the coupon field!',
      hi: 'भुगतान विकल्प:\n• कैश ऑन डिलीवरी (COD) — पार्सल आने पर भुगतान (छोटा COD चार्ज लागू)।\n• प्रीपेड: PhonePe/GPay +91 9332376959 पर, या सीधा बैंक ट्रांसफर पंजाब नेशनल बैंक में (खाताधारक: Sultana Parvin)।\nभुगतान के बाद UTR/ट्रांज़ैक्शन नंबर और स्क्रीनशॉट ऑर्डर फॉर्म में दे दें। प्रीपेड पर अक्सर छोटी छूट मिलती है — कूपन ज़रूर देखें!',
      ur: 'ادائیگی کے آپشن:\n• کیش آن ڈیلیوری (COD) — پارسل آنے پر ادائیگی (معمولی COD چارجز لاگو)۔\n• پری پیڈ: PhonePe/GPay +91 9332376959 پر، یا براہِ راست بینک ٹرانسفر پنجاب نیشنل بینک میں (اکاؤنٹ ہولڈر: Sultana Parvin)۔\nادائیگی کے بعد UTR/ٹرانزکشن نمبر اور اسکرین شاٹ آرڈر فارم میں دے دیں۔ پری پیڈ پر اکثر معمولی رعایت ملتی ہے — کوپن ضرور دیکھیں!',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['coupon', 'promo', 'discount', 'offer', 'code falah', 'falah10']) ||
      s.includes('কুপন') || s.includes('প্রোমো') || s.includes('ছাড়') || s.includes('ডিসকাউন্ট') || s.includes('অফার') ||
      s.includes('कूपन') || s.includes('प्रोमो') || s.includes('छूट') || s.includes('डिस्काउंट') || s.includes('ऑफर') ||
      s.includes('کوپن') || s.includes('پرومو') || s.includes('رعایت') || s.includes('ڈسکاؤنٹ') || s.includes('آفر'),
    answer: {
      bn: 'ডিসকাউন্টের জন্য চেকআউটে "প্রোমো কোড" ঘরে কোডটি লিখে Apply চাপুন — যেমন FALAH10 (১০% ছাড়)। সব চালু অফার জানতে হোয়াটসঅ্যাপে মেসেজ করতে পারেন। ঈদ, রমজান ও বিশেষ উপলক্ষে বড় ডিসকাউন্ট চালু হয়!',
      en: 'For discounts, type your code in the "Promo Code" box at checkout and tap Apply — for example FALAH10 (10% off). Message us on WhatsApp to know every active offer. Bigger discounts run during Eid, Ramadan and special occasions!',
      hi: 'छूट के लिए चेकआउट पर "प्रोमो कोड" बॉक्स में कोड डालकर Apply दबाएँ — जैसे FALAH10 (10% छूट)। सभी चालू ऑफर जानने के लिए WhatsApp पर मैसेज करें। ईद, रमज़ान और खास मौकों पर बड़ी छूट चलती है!',
      ur: 'رعایت کے لیے چیک آؤٹ پر "پرومو کوڈ" باکس میں کوڈ لکھ کر Apply دبائیں — مثلاً FALAH10 (10% رعایت)۔ تمام جاری آفرز جاننے کے لیے واٹس ایپ پر میسج کریں۔ عید، رمضان اور خاص مواقع پر بڑی رعایتیں ہوتی ہیں!',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['invoice', 'receipt', 'bill', 'pdf']) ||
      s.includes('ইনভয়েস') || s.includes('রশিদ') || s.includes('বিল') ||
      s.includes('इनवॉइस') || s.includes('रसीद') || s.includes('बिल') ||
      s.includes('انوائس') || s.includes('رسید') || s.includes('بل'),
    answer: {
      bn: 'অর্ডার কনফার্ম হওয়ার পরই "Download PDF Invoice" বোতাম পাবেন — সেখানে Order ID, পণ্য, শিপিং, ডিসকাউন্ট ও টোটালসহ পূর্ণ ক্যাশ মেমো ডাউনলোড হয়। অ্যাডমিন থেকেও আপনার অর্ডারের ইনভয়েস বানানো হয় প্রয়োজনে।',
      en: 'Right after your order is confirmed you get a "Download PDF Invoice" button — it generates a full cash memo with Order ID, items, shipping, discount and totals. We can also issue an invoice for any past order from our side if needed.',
      hi: 'ऑर्डर कन्फर्म होते ही "Download PDF Invoice" बटन मिलता है — उसमें Order ID, आइटम, शिपिंग, छूट और टोटल सहित पूरी कैश मेमो डाउनलोड होती है। ज़रूरत पर पुराने ऑर्डर का इनवॉइस हमारी तरफ से भी बन जाता है।',
      ur: 'آرڈر کانفرم ہوتے ہی "Download PDF Invoice" بٹن ملتا ہے — اس میں Order ID، آئٹمز، شپنگ، رعایت اور ٹوٹل سمیت مکمل کیش میمو ڈاؤن لوڈ ہوتی ہے۔ ضرورت پر پرانے آرڈر کی انوائس ہماری طرف سے بھی بن جاتی ہے۔',
    },
  },

  // ---------- RETURNS & POLICIES ----------
  {
    match: (s) =>
      hasEn(s, ['return', 'exchange', 'refund', 'replace', 'money back']) ||
      s.includes('রিটার্ন') || s.includes('এক্সচেঞ্জ') || s.includes('ফেরত') || s.includes('রিফান্ড') ||
      s.includes('रिटर्न') || s.includes('एक्सचेंज') || s.includes('वापसी') || s.includes('रिफंड') ||
      s.includes('ریٹرن') || s.includes('ایکسچینج') || s.includes('واپسی') || s.includes('رقم واپس'),
    answer: {
      bn: 'রিটার্ন/এক্সচেঞ্জ পলিসি: ডেলিভারির ৭ দিনের মধ্যে ত্রুটিপূর্ণ পণ্য বা ভুল কাটিংয়ের ক্ষেত্রে রিটার্ন/রিপ্লেসমেন্ট গ্রহণ করা হয়। বাধ্যতামূলক: আনবক্সিং ভিডিও — পার্সেল খোলার সময় ভিডিও করতে হবে। সাইটের "Request Return" ফর্মে Order ID ও কারণ লিখে জমা দিন, আর আনবক্সিং ভিডিও WhatsApp-এ (+91 9332376959) পাঠান। রিফান্ড অনুমোদনের পর ৫-৭ দিনে ফেরত দেওয়া হয়।',
      en: 'Return/Exchange policy: returns or replacements are accepted within 7 days of delivery for defective products or wrong cutting. A mandatory unboxing video is required — record while opening the parcel. Submit the "Request Return" form on the site with your Order ID and reason, and send the unboxing video to WhatsApp (+91 9332376959). Approved refunds are processed within 5-7 days.',
      hi: 'रिटर्न/एक्सचेंज पॉलिसी: डिलीवरी के 7 दिन के भीतर खराब उत्पाद या गलत कटिंग पर रिटर्न/रिप्लेसमेंट स्वीकार्य है। अनबॉक्सिंग वीडियो अनिवार्य है — पार्सल खोलते समय रिकॉर्ड करें। साइट के "Request Return" फॉर्म में Order ID और कारण भरें, और अनबॉक्सिंग वीडियो WhatsApp (+91 9332376959) पर भेजें। स्वीकृत रिफंड 5-7 दिन में वापस होता है।',
      ur: 'ریٹرن/ایکسچینج پالیسی: ڈیلیوری کے 7 دن کے اندر خراب پروڈکٹ یا غلط کٹنگ پر ریٹرن/ریپلیسمنٹ قبول ہے۔ ان باکسنگ ویڈیو لازمی ہے — پارسل کھولتے وقت ریکارڈ کریں۔ سائٹ کے "Request Return" فارم میں Order ID اور وجہ درج کریں، اور ان باکسنگ ویڈیو WhatsApp (+91 9332376959) پر بھیجیں۔ منظور شدہ رقوم 5-7 دن میں واپس ہوتی ہیں۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['unbox', 'video', 'damage', 'damaged', 'broken', 'claim']) ||
      s.includes('আনবক্সিং') || s.includes('ভিডিও') || s.includes('ক্ষতিগ্রস্ত') || s.includes('ভাঙা') ||
      s.includes('अनबॉक्सिंग') || s.includes('वीडियो') || s.includes('क्षतिग्रस्त') || s.includes('टूटा') ||
      s.includes('ان باکسنگ') || s.includes('ویڈیو') || s.includes('ٹوٹا') || s.includes('نقصان'),
    answer: {
      bn: 'ক্ষতিগ্রস্ত পণ্যের দাবি: পার্সেল খোলার সম্পূর্ণ ভিডিও (আনবক্সিং ভিডিও) ছাড়া কোনো দাবি গ্রহণ করা হয় না — এটি কুরিয়ারের জবাবদিহিতার প্রমাণ। ভিডিওতে পার্সেলের লেবেলসহ শুরু থেকে শেষ পর্যন্ত দেখাতে হবে। ভিডিও WhatsApp-এ পাঠান, আমরা ২৪-৪৮ ঘণ্টায় সমাধান দিই।',
      en: 'Damage claims: a complete unboxing video (recorded while opening the parcel) is mandatory for any damage claim — it is the proof of courier responsibility. The video must show the parcel with its label from start to finish. Send it on WhatsApp and we resolve within 24-48 hours.',
      hi: 'क्षति का दावा: किसी भी क्षतिग्रस्त उत्पाद के दावे के लिए पूरा अनबॉक्सिंग वीडियो (पार्सल खोलते समय रिकॉर्डेड) अनिवार्य है — यह कूरियर ज़िम्मेदारी का प्रमाण है। वीडियो में लेबल सहित पार्सल शुरू से अंत तक दिखाना होगा। वीडियो WhatsApp पर भेजें, हम 24-48 घंटे में समाधान देते हैं।',
      ur: 'ڈمیج کلیئم: کسی بھی خراب پروڈکٹ کے دعوے کے لیے مکمل ان باکسنگ ویڈیو (پارسل کھولتے ہوئے ریکارڈ شدہ) لازمی ہے — یہ کوریئر ذمہ داری کا ثبوت ہے۔ ویڈیو میں لیبل سمیت پارسل شروع سے آخر تک دکھانا ہوگا۔ ویڈیو WhatsApp پر بھیجیں، ہم 24-48 گھنٹے میں حل دیتے ہیں۔',
    },
  },

  // ---------- WHOLESALE ----------
  {
    match: (s) =>
      hasEn(s, ['wholesale', 'bulk', 'resell', 'reseller', 'dealer', 'shop owner', 'margin']) ||
      s.includes('থোক') || s.includes('রিসেলার') || s.includes('ডিলার') || s.includes('বাল্ক') ||
      s.includes('थोक') || s.includes('रीसेलर') || s.includes('डीलर') || s.includes('बल्क') ||
      s.includes('تھوک') || s.includes('ری سیلر') || s.includes('ڈیلر') || s.includes('بلک'),
    answer: {
      bn: 'থোক ও রিসেলিং: সর্বনিম্ন অর্ডার সাধারণত ৬-১০ পিস। রিসেলারদের জন্য বিশেষ থোক রেট, আগেভাগে নতুন ডিজাইনের অ্যাক্সেস এবং নিয়মিত স্টক সাপোর্ট আছে। কলকাতার নিজস্ব প্রোডাকশন হাব থেকে কাস্টম ম্যানুফ্যাকচারিংও করা যায় — আপনার লেবেলে বানিয়ে দিতে পারি। বিস্তারিত দাম জানতে WhatsApp-এ (+91 9332376959) কথা বলুন।',
      en: 'Wholesale & reselling: minimum order is usually 6-10 pieces. Resellers get special wholesale rates, early access to new designs and steady stock support. Custom manufacturing is possible from our own Kolkata production hub — we can even stitch under your label. Message us on WhatsApp (+91 9332376959) for exact rates.',
      hi: 'थोक और रीसेलिंग: न्यूनतम ऑर्डर आमतौर पर 6-10 पीस। रीसेलर्स को विशेष थोक रेट, नए डिज़ाइन की जल्दी एक्सेस और लगातार स्टॉक सपोर्ट मिलता है। हमारे कोलकाता प्रोडक्शन हब से कस्टम मैन्युफैक्चरिंग भी होती है — आपके लेबल पर भी सिल सकते हैं। सटीक रेट के लिए WhatsApp (+91 9332376959) पर बात करें।',
      ur: 'تھوک اور ری سیلنگ: کم از کم آرڈر عام طور پر 6-10 پیس۔ ری سیلرز کو خاص تھوک ریٹ، نئے ڈیزائنز کی پہلے رسائی اور مستقل اسٹاک سپورٹ ملتی ہے۔ ہمارے کولکاتا پروڈکشن ہب سے کسٹم مینوفیکچرنگ بھی ہوتی ہے — آپ کے لیبل پر بھی سل سکتے ہیں۔ درست ریٹ کے لیے WhatsApp (+91 9332376959) پر بات کریں۔',
    },
  },

  // ---------- STORE / TRUST ----------
  {
    match: (s) =>
      hasEn(s, ['who are you', 'about', 'falah', 'kolkata', 'store', 'shop', 'company', 'brand', 'trust', 'genuine', 'real']) ||
      s.includes('কে আপনারা') || s.includes('ফালাহ') || s.includes('কলকাতা') || s.includes('দোকান') || s.includes('আসল') ||
      s.includes('कौन हैं आप') || s.includes('फालाह') || s.includes('कोलकाता') || s.includes('दुकान') || s.includes('असली') ||
      s.includes('آپ کون') || s.includes('فلاح') || s.includes('کولکاتا') || s.includes('دکان') || s.includes('اصل'),
    answer: {
      bn: 'আসসালামু আলাইকুম! আমি মতিউর — team by FALAH । FALAH কলকাতা-ভিত্তিক একটি বিশ্বস্ত মোডেস্ট ইসলামিক পোশাক ব্র্যান্ড — প্রিমিয়াম আবায়া, বোরকা, খিমার ও হিজাব সেট, কাস্টম সাইজিং এবং সারা ভারতে ডেলিভারি। নিজস্ব প্রোডাকশন হাব থাকায দাম ন্যায্য এবং মান নিয়ন্ত্রিত। শত শত সন্তুষ্ট কাস্টমার আমাদের বিশ্বস্ততার প্রমাণ।',
      en: 'Assalamu Alaikum! I am Matiur, team by FALAH. FALAH is a trusted modest Islamic apparel brand based in Kolkata — premium abayas, borkhas, khimars and hijab sets, with custom sizing and delivery across India. Having our own production hub keeps prices fair and quality controlled. Hundreds of happy customers vouch for us.',
      hi: 'आससालामु अलैकुम! मैं मतिउर, team by FALAH । FALAH कोलकाता आधारित एक भरोसेमंद मोडेस्ट इस्लामिक पोशाक ब्रांड है — प्रीमियम अबाया, बुर्का, खिमार और हिजाब सेट, कस्टम साइज़िंग और पूरे भारत में डिलीवरी। अपना प्रोडक्शन हब होने से दाम उचित और गुणवत्ता नियंत्रित रहती है। सैकड़ों संतुष्ट ग्राहक हमारी पहचान हैं।',
      ur: 'السلام علیکم! میں مطیع اللہ، team by FALAH ہوں۔ FALAH کولکاتا میں قائم ایک مستند مڈسٹ اِسلامی لباس برانڈ ہے — پریمیم عبا، برقعہ، خمار اور حجاب سیٹ، کسٹم سائزنگ اور پورے ہندوستان میں ڈیلیوری۔ اپنا پروڈکشن ہب ہونے سے قیمت منصفانہ اور کوالٹی کنٹرولڈ رہتی ہے۔ سینکڑوں مطمئن گاہک ہماری پہچان ہیں۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['contact', 'phone', 'call', 'whatsapp', 'number', 'support', 'help line']) ||
      s.includes('যোগাযোগ') || s.includes('ফোন') || s.includes('হোয়াটসঅ্যাপ') || s.includes('সাপোর্ট') ||
      s.includes('संपर्क') || s.includes('फोन') || s.includes('व्हाट्सएप') || s.includes('सपोर्ट') ||
      s.includes('رابطہ') || s.includes('فون') || s.includes('واٹس ایپ') || s.includes('سپورٹ'),
    answer: {
      bn: 'যোগাযোগ: WhatsApp/কল — +91 9332376959 (অর্ডার ও সাপোর্ট)। সকাল ১০টা থেকে রাত ৯টা পর্যন্ত উত্তর দিই, ইনশাআল্লাহ। চ্যাটের "Talk to Human" বোতাম চাপলেই সরাসরি হোয়াটসঅ্যাপ খুলে যাবে।',
      en: 'Contact: WhatsApp/call +91 9332376959 (orders & support). We reply from 10 AM to 9 PM, InshaAllah. The "Talk to Human" button in this chat opens WhatsApp directly.',
      hi: 'संपर्क: WhatsApp/कॉल +91 9332376959 (ऑर्डर और सपोर्ट)। सुबह 10 बजे से रात 9 बजे तक जवाब देते हैं, इंशाअल्लाह। इस चैट का "Talk to Human" बटन सीधे WhatsApp खोल देगा।',
      ur: 'رابطہ: WhatsApp/کال +91 9332376959 (آرڈرز اور سپورٹ)۔ صبح 10 بجے سے رات 9 بجے تک جواب دیتے ہیں، ان شاء اللہ۔ اس چیٹ کا "Talk to Human" بٹن سیدھا واٹس ایپ کھول دے گا۔',
    },
  },

  // ---------- PRODUCT AVAILABILITY ----------
  {
    match: (s) =>
      hasEn(s, ['stock', 'available', 'out of', 'back in', 'restock', 'sold out']) ||
      s.includes('স্টক') || s.includes('পাওয়া যায়') || s.includes('ফিরবে') ||
      s.includes('स्टॉक') || s.includes('उपलब्ध') || s.includes('वापस आएगा') ||
      s.includes('اسٹاک') || s.includes('دستیاب') || s.includes('واپس آئے'),
    answer: {
      bn: 'যে পণ্যে "স্টক শেষ" লেখা আছে, সেটি আপাতত অর্ডার করা যাবে না। সাধারণত ১-২ সপ্তাহের মধ্যে স্টকে ফিরে আসে। চাইলে হোয়াটসঅ্যাপে (+91 9332376959) জানিয়ে রাখুন — ফিরলেই আমরা জানিয়ে দেব, ইনশাআল্লাহ।',
      en: 'Products marked "Out of Stock" cannot be ordered right now. They usually return within 1-2 weeks. Message us on WhatsApp (+91 9332376959) to be notified the moment they are back, InshaAllah.',
      hi: 'जिन प्रोडक्ट पर "स्टॉक खत्म" लिखा है, वे अभी ऑर्डर नहीं हो सकते। आमतौर पर 1-2 हफ़्ते में वापस आ जाते हैं। WhatsApp (+91 9332376959) पर बता दें — वापस आते ही सूचित कर देंगे, इंशाअल्लाह।',
      ur: 'جن پروڈکٹس پر "اسٹاک ختم" لکھا ہے وہ ابھی آرڈر نہیں ہو سکتیں۔ عام طور پر 1-2 ہفتوں میں واپس آ جاتی ہیں۔ WhatsApp (+91 9332376959) پر بتا دیں — واپس آتے ہی خبر کر دیں گے، ان شاء اللہ۔',
    },
  },

  // ---------- SOCIAL / GREETINGS / MANNERS ----------
  {
    match: (s) =>
      hasEn(s, ['salam', 'assalam', 'hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste']) ||
      s.includes('আসসালামু') || s.includes('সালাম') || s.includes('হ্যালো') || s.includes('কেমন আছেন') ||
      s.includes('नमस्ते') || s.includes('हैलो') || s.includes('कैसे हैं') || s.includes('सलाम') ||
      s.includes('سلام') || s.includes('ہیلو') || s.includes('کیسے ہیں'),
    answer: {
      bn: 'ওয়া আলাইকুমুস সালাম! আমি মতিউর — team by FALAH । আপনি কেমন আছেন? আবায়া, সাইজ, ডেলিভারি বা পেমেন্ট — যেকোনো বিষয়ে খুশি মনে জিজ্ঞেস করুন।',
      en: 'Wa Alaikumus Salam! I am Matiur, team by FALAH. How are you today? Ask me anything about abayas, sizing, delivery or payments.',
      hi: 'वा अलैकुमुस सलाम! मैं मतिउर, team by FALAH । आप कैसे हैं? अबाया, साइज़, डिलीवरी या भुगतान — कुछ भी पूछिए।',
      ur: 'وعلیکم السلام! میں مطیع اللہ، team by FALAH ہوں۔ آپ کیسے ہیں؟ عبا، سائز، ڈیلیوری یا ادائیگی — کچھ بھی پوچھیں۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['thank', 'shukran', 'jazak', 'thanks', 'great', 'nice', 'good job']) ||
      s.includes('ধন্যবাদ') || s.includes('জাযাক') || s.includes('ভালো লেগেছে') ||
      s.includes('धन्यवाद') || s.includes('शुक्रिया') || s.includes('जजाक') || s.includes('अच्छा लगा') ||
      s.includes('شکریہ') || s.includes('جزاک') || s.includes('پسند آیا'),
    answer: {
      bn: 'ওয়া জাযাকুমুল্লাহু খাইরান! আমি মতিউর — team by FALAH । আমাদের দোয়া ও সাপোর্টের জন্য সবসময় পাশে থাকুন। আবার কিছু জানতে চাইলে বলবেন!',
      en: 'Wa Jazakumullahu Khairan! I am Matiur, team by FALAH. Thank you for your kind words. Keep us in your duas — and ask me anytime you need help!',
      hi: 'वा जज़ाकुमुल्लाहु खैरन! मैं मतिउर, team by FALAH । आपके प्यारे शब्दों के लिए शुक्रिया। हमें दुआओं में याद रखें — मदद चाहिए तो कभी भी पूछें!',
      ur: 'وجزا کم اللہ خیرا! میں مطیع اللہ، team by FALAH ہوں۔ آپ کے پیارے الفاظ کا شکریہ۔ دعاؤں میں یاد رکھیے — مدد چاہیے تو کبھی بھی پوچھیے!',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['bye', 'goodbye', 'see you', 'allah hafiz', 'khoda hafiz']) ||
      s.includes('বিদায়') || s.includes('আল্লাহ হাফেজ') || s.includes('খোদা হাফেজ') ||
      s.includes('अलविदा') || s.includes('अल्लाह हाफ़िज़') || s.includes('ख़ुदा हाफ़िज़') ||
      s.includes('خدا حافظ') || s.includes('اللہ حافظ') || s.includes('الوداع'),
    answer: {
      bn: 'আল্লাহ হাফেজ! আমি মতিউর — team by FALAH । যেকোনো সময় প্রয়োজন হলে ফিরে আসবেন, আমরা সবসময় পাশে আছি। শুভকামনা ও দোয়া রইল।',
      en: 'Allah Hafiz! I am Matiur, team by FALAH. Come back anytime you need anything — we are always here for you. Best wishes and duas!',
      hi: 'अल्लाह हाफ़िज़! मैं मतिउर, team by FALAH । कभी भी ज़रूरत हो तो लौट आइए — हम हमेशा आपके साथ हैं। शुभकामनाएँ और दुआएँ!',
      ur: 'اللہ حافظ! میں مطیع اللہ، team by FALAH ہوں۔ جب بھی ضرورت ہو واپس آئیں — ہم ہمیشہ آپ کے ساتھ ہیں۔ نیک تمنائیں اور دعائیں!',
    },
  },

  // ---------- "APU" ADDRESSING / MALE CUSTOMER CORRECTION ----------
  {
    match: (s) =>
      hasEn(s, ['i am a man', 'i am male', 'i am brother', 'main aadmi', 'main mard', 'main bhai']) ||
      s.includes('আমি ছেলে') || s.includes('আমি পুরুষ') || s.includes('আপু না') || s.includes('ভাই বলুন') || s.includes('আমি ভাই') ||
      s.includes('मैं लड़का') || s.includes('मैं पुरुष') || s.includes('अपू नहीं') || s.includes('भाई कहें') || s.includes('मैं भाई') ||
      s.includes('میں لڑکا') || s.includes('میں مرد') || s.includes('اپو نہیں') || s.includes('بھائی کہیں') || s.includes('میں بھائی'),
    answer: {
      bn: 'মাআফ করবেন ভাই! আমি মতিউর — team by FALAH । ভুলে "আপু" বলে ফেলেছি, দুঃখিত। এখন থেকে আপনাকে ভাই বলেই সম্বোধন করব, ইনশাআল্লাহ। আপনার জন্য আমাদের নেট ক্যাপ, টুপি এবং ভাইদের জন্য বিশেষ প্রোডাক্টও দেখতে পারেন। আর কী জানতে চান?',
      en: 'My apologies, brother! I am Matiur, team by FALAH. Sorry for calling you "Apu" by mistake. From now on I will address you as brother, InshaAllah. You may also like our prayer caps and products made for brothers. Anything else I can help with?',
      hi: 'माफ़ करें भाई! मैं मतिउर, team by FALAH । गलती से "अपू" कह दिया, क्षमा करें। अब से आपको भाई ही कहूँगा, इंशाअल्लाह। आपके लिए हमारे टोपी और भाइयों के प्रोडक्ट भी देख सकते हैं। और कुछ मदद करूँ?',
      ur: 'معاف کریں بھائی! میں مطیع اللہ، team by FALAH ہوں۔ غلطی سے "اپو" کہہ دیا، معذرت۔ اب آپ کو بھائی ہی کہوں گا، ان شاء اللہ۔ آپ کے لیے ہماری ٹوپیاں اور بھائیوں کے پروڈکٹس بھی دیکھ سکتے ہیں۔ کوئی اور مدد؟',
    },
  },

  // ---------- ORDER PROCESS ----------
  {
    match: (s) =>
      hasEn(s, ['how to order', 'order process', 'place an order', 'buy', 'purchase']) ||
      s.includes('অর্ডার করব') || s.includes('কীভাবে অর্ডার') || s.includes('কিনব') ||
      s.includes('ऑर्डर कैसे') || s.includes('कैसे ऑर्डर') || s.includes('खरीदूँ') ||
      s.includes('آرڈر کیسے') || s.includes('کیسے آرڈر') || s.includes('خریدوں'),
    answer: {
      bn: 'অর্ডার করার ধাপ: ১) পছন্দের পণ্যে "Order Now" চাপুন। ২) ফ্যাব্রিক/সাইজ বেছে নিন (চাইলে কাস্টম মাপ ও ডিজাইনের ছবি দিন)। ৩) নাম, ফোন ও ঠিকানা দিন — রাজ্য বেছে নিলে শিপিং চার্জ নিজেই দেখাবে। ৪) COD বা প্রিপেইড বেছে নিন। ৫) "Confirm Order" — ব্যস! Order ID ও PDF ইনভয়েস সঙ্গে সঙ্গে পেয়ে যাবেন।',
      en: 'How to order: 1) Tap "Order Now" on any product. 2) Pick fabric/size (or add custom measurements and a design photo). 3) Enter your name, phone and address — shipping auto-calculates by state. 4) Choose COD or Prepaid. 5) Confirm Order — done! You instantly get an Order ID and can download the PDF invoice.',
      hi: 'ऑर्डर कैसे करें: 1) किसी प्रोडक्ट पर "Order Now" दबाएँ। 2) फैब्रिक/साइज़ चुनें (या कस्टम नाप और डिज़ाइन फोटो दें)। 3) नाम, फोन और पता भरें — राज्य चुनते ही शिपिंग दिख जाएगी। 4) COD या प्रीपेड चुनें। 5) "Confirm Order" — तैयार! Order ID और PDF इनवॉइस तुरंत मिल जाएगा।',
      ur: 'آرڈر کیسے کریں: 1) کسی پروڈکٹ پر "Order Now" دبائیں۔ 2) فیبرک/سائز چنیں (یا کسٹم ناپ اور ڈیزائن فوٹو دیں)۔ 3) نام، فون اور پتہ بھریں — ریاست چنتے ہی شپنگ دکھ جائے گی۔ 4) COD یا پری پیڈ چنیں۔ 5) "Confirm Order" — مکمل! Order ID اور PDF انوائس فوراً مل جائے گی۔',
    },
  },
  {
    match: (s) =>
      hasEn(s, ['cart', 'add to cart', 'wishlist', 'favorite', 'favourite', 'heart']) ||
      s.includes('কার্ট') || s.includes('পছন্দ') || s.includes('হার্ট') || s.includes('উইশলিস্ট') ||
      s.includes('कार्ट') || s.includes('पसंदीदा') || s.includes('हार्ट') || s.includes('विशलिस्ट') ||
      s.includes('کارٹ') || s.includes('پسندیدہ') || s.includes('ہارٹ') || s.includes('وش لسٹ'),
    answer: {
      bn: 'প্রতিটি পণ্যে "+" বোতামে চাপলে কার্টে যোগ হবে; হেডারের 🛒 আইকনে কাউন্টার দেখা যায়। একসাথে সব পণ্য এক অর্ডারে চেকআউট করা যায়। হেডারের ❤️ আইকনে পছন্দের তালিকা — যেকোনো পণ্যের হার্ট চিহ্নে চাপ দিয়ে সেভ করে রাখুন, পরে সহজে অর্ডার করুন।',
      en: 'Tap the "+" on any product to add it to your cart; the 🛒 icon in the header shows a live counter. You can check out with all items in one combined order. The ❤️ icon in the header opens your favorites — tap the heart on any product to save it and order easily later.',
      hi: 'किसी प्रोडक्ट के "+" पर टैप करें और कार्ट में जुड़ जाएगा; हेडर के 🛒 आइकन पर काउंटर दिखता है। सारे आइटम एक ही ऑर्डर में चेकआउट कर सकते हैं। हेडर के ❤️ आइकन से पसंदीदा सूची — किसी भी प्रोडक्ट पर हार्ट दबाकर सेव करें, बाद में आसानी से ऑर्डर करें।',
      ur: 'کسی پروڈکٹ کے "+" پر ٹیپ کریں تو کارٹ میں شامل ہو جائے گا؛ ہیڈر کے 🛒 آئیکن پر کاؤنٹر دکھتا ہے۔ تمام آئٹمز ایک ہی آرڈر میں چیک آؤٹ کر سکتے ہیں۔ ہیڈر کے ❤️ آئیکن سے پسندیدہ فہرست — کسی بھی پروڈکٹ پر ہارٹ دبا کر محفوظ کریں، بعد میں آسانی سے آرڈر کریں۔',
    },
  },

  // ---------- FALLBACK ----------
];

const FALLBACK: Answer = {
  bn: 'দুঃখিত, আমি মতিউর — team by FALAH । এই প্রশ্নের নিখুঁত উত্তর এখন আমার জানা নেই। আমাদের টিম হোয়াটসঅ্যাপে (+91 9332376959) সবসময় পাশে আছে — সেখানে জিজ্ঞেস করলে সাথে সাথে উত্তর পাবেন, ইনশাআল্লাহ।',
  en: "Sorry, I'm Matiur, team by FALAH. I don't have a precise answer for that right now. Our team is always available on WhatsApp (+91 9332376959) — ask there and you'll get a quick reply, InshaAllah.",
  hi: 'क्षमा करें, मैं मतिउर, team by FALAH । इस प्रश्न का सटीक उत्तर अभी मेरे पास नहीं। हमारी टीम WhatsApp (+91 9332376959) पर हमेशा उपलब्ध है — वहाँ पूछें, तुरंत जवाब मिलेगा, इंशाअल्लाह।',
  ur: 'معذرت، میں مطیع اللہ، team by FALAH ہوں۔ اس سوال کا درست جواب ابھی میرے پاس نہیں۔ ہماری ٹیم WhatsApp (+91 9332376959) پر ہمیشہ دستیاب ہے — وہاں پوچھیں، فوراً جواب ملے گا، ان شاء اللہ۔',
};

export function answerQuery(
  query: string,
  adminFaqAnswer?: string,
  _options?: { products?: ProductInfo[]; lastProduct?: string | null },
): string {
  const lang = detectLang(query);
  if (adminFaqAnswer) return adminFaqAnswer;
  const s = query.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.match(s)) return intent.answer[lang];
  }
  return FALLBACK[lang];
}
