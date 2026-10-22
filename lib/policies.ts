import type { Lang } from './i18n';

export type PolicyKey = 'about' | 'terms' | 'privacy' | 'size' | 'returns';

export const POLICY_ORDER: PolicyKey[] = ['about', 'terms', 'privacy', 'size', 'returns'];

export const policySettingKey = (key: PolicyKey) => `page_${key}`;

export const POLICY_TITLES: Record<PolicyKey, Record<Lang, string>> = {
  about: {
    bn: 'আমাদের সম্পর্কে',
    en: 'About Us',
    hi: 'हमारे बारे में',
    ur: 'ہمارے بارے میں',
  },
  terms: {
    bn: 'শর্তাবলী',
    en: 'Terms & Conditions',
    hi: 'नियम और शर्तें',
    ur: 'شرائط و ضوابط',
  },
  privacy: {
    bn: 'গোপনীয়তা নীতি',
    en: 'Privacy Policy',
    hi: 'गोपनीयता नीति',
    ur: 'رازداری کی پالیسی',
  },
  size: {
    bn: 'সাইজ গাইড',
    en: 'Size Guide',
    hi: 'साइज़ गाइड',
    ur: 'سائز گائیڈ',
  },
  returns: {
    bn: 'রিটার্ন ও রিফান্ড নীতি',
    en: 'Return & Refund Policy',
    hi: 'रिटर्न और रिफंड नीति',
    ur: 'واپسی اور ریفنڈ پالیسی',
  },
};

export const POLICY_CONTENT: Record<PolicyKey, Record<Lang, string>> = {
  about: {
    bn: 'ফালাহ (FALAH) কলকাতার একটি প্রিমিয়াম মোডেস্ট ফ্যাশন ব্র্যান্ড। আমরা আরামদায়ক ও মার্জিত আবায়া, খিমার, বোরখা ও রেডি হিজাব তৈরি করি। কাস্টমাইজ সাইজ এবং সমগ্র ভারতে হোম ডেলিভারি সুবিধা রয়েছে।',
    en: 'FALAH is an Indian-based modest fashion brand in Kolkata, built to make modest dressing effortless, elegant, and accessible. We offer Abayas, Khimars, Borkhas, and Ready Hijabs with custom measurements and all-India delivery.',
    hi: 'फलाह (FALAH) कोलकाता आधारित एक प्रमुख मॉडेस्ट फैशन ब्रांड है। हम आरामदायक और सुरुचिपूर्ण अबाया, ख़िमार, बोरखा और हिजाब सेट प्रदान करते हैं।',
    ur: 'فلاح کلکتہ میں واقع ایک بہترین مائنس فیشن برانڈ ہے۔ ہم آرام دہ اور خوبصورت عبایا، خمار، برقع اور حجاب سیٹ پیش کرتے ہیں۔',
  },
  terms: {
    bn: 'সমস্ত মূল্য ভারতীয় রুপি (₹)-এ দেওয়া। ওয়েবসাইট বা হোয়াটসঅ্যাপের (+91 9332376959) মাধ্যমে অর্ডার কনফার্ম করা যায়। ফোনপে, জিপে, ব্যাঙ্ক ট্রান্সফার এবং সিওডি সুবিধা রয়েছে। লাইটিং ও হাতের সেলাইয়ের কারণে হালকা রঙ বা মাপে সামান্য পার্থক্য হতে পারে।',
    en: 'All prices are in INR (₹). Orders are confirmed via website or WhatsApp (+91 9332376959). Payment options include PhonePe, GPay, Bank Transfer, and COD. Minor color or stitching differences may occur due to lighting or manual work.',
    hi: 'सभी कीमतें भारतीय रुपये (₹) में हैं। वेबसाइट या व्हाट्सएप (+91 9332376959) के माध्यम से ऑर्डर कन्फर्म किए जाते हैं। भुगतान के विकल्प: फोनपे, गूगल पे, बैंक ट्रांसफर और COD। रोशनी या हाथ की सिलाई के कारण रंग या सिलाई में हल्का अंतर हो सकता है।',
    ur: 'تمام قیمتیں بھارتی روپے (₹) میں ہیں۔ آرڈرز ویب سائٹ یا واٹس ایپ (+91 9332376959) کے ذریعے کنفرم کیے جاتے ہیں۔ ادائیگی کے اختیارات: فون پے، جی پے، بینک ٹرانسفر اور کیش آن ڈیلیوری۔ روشنی یا دستی سلائی کی وجہ سے رنگ یا سلائی میں معمولی فرق ہو سکتا ہے۔',
  },
  privacy: {
    bn: 'আমরা আপনার গোপনীয়তাকে সম্মান করি। ক্রেতার তথ্য (নাম, ঠিকানা, ফোন নম্বর, হোয়াটসঅ্যাপ চ্যাট) সম্পূর্ণ সুরক্ষিত এবং কেবল অর্ডার সম্পাদন ও যোগাযোগের জন্য ব্যবহৃত হয়।',
    en: 'We respect your privacy. Customer details (Name, Address, Phone, WhatsApp chats) are strictly protected and used only to fulfill orders and provide support.',
    hi: 'हम आपकी गोपनीयता का सम्मान करते हैं। ग्राहक की जानकारी (नाम, पता, फोन नंबर, व्हाट्सएप चैट) पूरी तरह सुरक्षित है और केवल ऑर्डर पूरा करने और सहायता के लिए उपयोग की जाती है।',
    ur: 'ہم آپ کی رازداری کا احترام کرتے ہیں۔ گاہک کی معلومات (نام، پتہ، فون نمبر، واٹس ایپ چیٹ) مکمل طور پر محفوظ ہیں اور صرف آرڈر مکمل کرنے اور سپورٹ کے لیے استعمال ہوتی ہیں۔',
  },
  size: {
    bn: 'সমস্ত আবায়া ফ্রি সাইজ এবং নির্ধারিত ঝুল/দৈর্ঘ্য: ৫২, ৫৪ এবং ৫৬ ইঞ্চি। এছাড়া কাস্টম সাইজের সুযোগ রয়েছে। সহায়তার জন্য হোয়াটসঅ্যাপে যোগাযোগ করুন।',
    en: 'All abayas are Free Size with available lengths: 52", 54", and 56" inches. Custom sizing is also accepted. Contact WhatsApp (+91 9332376959) for assistance.',
    hi: 'सभी अबाया फ्री साइज हैं, उपलब्ध लंबाई: 52", 54" और 56" इंच। कस्टम साइज़ भी स्वीकार किए जाते हैं। सहायता के लिए व्हाट्सएप (+91 9332376959) पर संपर्क करें।',
    ur: 'تمام عبایا فری سائز ہیں، دستیاب لمبائیاں: 52"، 54" اور 56" انچ۔ کسٹم سائز بھی قبول کیے جاتے ہیں۔ مدد کے لیے واٹس ایپ (+91 9332376959) پر رابطہ کریں۔',
  },
  returns: {
    bn: 'কাস্টমাইজড বোরখা/আবায়া সাধারণ অবস্থায় ফেরত যোগ্য নয়। তবে আমাদের ভুলের কারণে ভুল কাটিং, ভুল ফেব্রিক বা ডিফেক্ট আইটেম ডেলিভারি হলে ১০০% রিটার্ন নেওয়া হবে। দাবির জন্য আনবক্সিং ভিডিও প্রয়োজন।',
    en: 'Customized Abayas/Borkhas are non-returnable unless there is a defect, incorrect fabric, or wrong cutting from our end. Unboxing video required for claim. General items can be returned within 7 days.',
    hi: 'कस्टमाइज़्ड अबाया/बोरखा सामान्य स्थिति में वापस योग्य नहीं हैं। लेकिन हमारी गलती से गलत कटिंग, गलत फैब्रिक या दोषपूर्ण आइटम डिलीवर होने पर 100% रिटर्न लिया जाएगा। दावे के लिए अनबॉक्सिंग वीडियो आवश्यक है।',
    ur: 'کسٹمائزڈ عبایا/برقع عام حالت میں واپس نہیں ہوتے۔ تاہم ہماری غلطی سے غلط کٹنگ، غلط فیبرک یا خراب آئٹم ڈیلیور ہونے پر 100% واپس لیا جائے گا۔ دعوے کے لیے ان بکسنگ ویڈیو ضروری ہے۔',
  },
};
