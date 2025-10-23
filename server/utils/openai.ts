import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
}

export interface EvaluationResult {
  vocabularyScore: number;
  vocabularyFeedback: string;
  grammarScore: number;
  grammarFeedback: string;
  coherenceScore: number;
  coherenceFeedback: string;
  overallFeedback: string;
  suggestedScore: number;
  suggestedCefrLevel: string;
}

/**
 * Transcribe audio to text using Whisper API
 */
export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<TranscriptionResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY muhit o'zgaruvchisi sozlanmagan");
  }

  try {
    // Ensure filename has .webm extension
    const webmFilename = filename.endsWith('.webm') ? filename : `${filename}.webm`;
    
    // Use OpenAI.toFile for Node.js compatibility
    const file = await OpenAI.toFile(audioBuffer, webmFilename);
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      // No language parameter - Whisper will auto-detect (supports 99+ languages including Uzbek)
    });

    return { text: transcription.text };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw new Error("Audio transkripsiya xatolik");
  }
}

/**
 * Evaluate CEFR speaking test transcripts using GPT-4o
 */
export async function evaluateSpeaking(transcripts: string[], language: 'ar' | 'en' = 'ar'): Promise<EvaluationResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY muhit o'zgaruvchisi sozlanmagan");
  }

  try {
    const combinedText = transcripts.join("\n\n---\n\n");
    
    // Language-specific prompts
    const prompts = {
      ar: `Siz CEFR og'zaki baholash mutaxassisisiz. Arab tilida gapirgan talabaga to'g'ridan-to'g'ri murojaat qilib baholang.

TALABA JAVOBI (Arab tilida):
${combinedText}

MUHIM: Har bir feedback 30-50 so'z bo'lsin, "Siz" shaklida yozing, konkret xatolar misollarini keltiring.

Quyidagi mezonlar bo'yicha baholang:

1. SO'Z BOYLIGI (0-100): Arab tilida lug'at boyligi, so'zlarni to'g'ri ishlatish
   Format: "Siz [ball] ball oldingiz. [Yaxshi tomoni]. Lekin [xato misoli]. [Qisqa tavsiya]."

2. GRAMMATIKA (0-100): Arab tili grammatikasi, jumla tuzilishi, morfologiya
   Format: "Sizning grammatikangiz [ball] ballga loyiq. [Yaxshi tomoni]. Xato: [konkret misol]. [Tavsiya]."

3. IZCHILLIK (0-100): Fikrlarning mantiqiy ketma-ketligi, ravonlik
   Format: "Izchillik uchun [ball] ball. [Yaxshi tomoni]. Muammo: [misol]. [Tavsiya]."

UMUMIY XULOSA (30-50 so'z):
"Sizning CEFR darajangiz [daraja]. [Kuchli tomon]. [Yaxshilash kerak]. [Qisqa tavsiya]."

JSON formatda javob bering:
{
  "vocabularyScore": 85,
  "vocabularyFeedback": "Siz 85 ball oldingiz. So'z boyligingiz yaxshi, lekin ba'zi iboralarni takrorladingiz. Yanada turli sinonimlar ishlating.",
  "grammarScore": 80,
  "grammarFeedback": "Grammatikangiz 80 ballga loyiq. Jumla tuzilishi to'g'ri. Xato: fe'l zamonlarini aralashtirgansiz (masalan: كان va يكون). Zamonlarga e'tibor bering.",
  "coherenceScore": 75,
  "coherenceFeedback": "Izchillik uchun 75 ball. Asosiy fikringiz aniq. Muammo: mavzular orasida o'tish yo'q. Bog'lovchilar (ثم، لكن، لأن) ko'proq ishlating.",
  "overallFeedback": "Sizning CEFR darajangiz B1. So'z boyligi yaxshi, grammatika asosan to'g'ri. Izchillikni yaxshilang. Ko'proq mashq qiling!",
  "suggestedScore": 80,
  "suggestedCefrLevel": "B1"
}`,
      en: `Siz CEFR og'zaki baholash mutaxassisisiz. Ingliz tilida gapirgan talabaga to'g'ridan-to'g'ri murojaat qilib baholang.

TALABA JAVOBI (Ingliz tilida):
${combinedText}

MUHIM: Har bir feedback 30-50 so'z bo'lsin, "Siz" shaklida yozing, konkret xatolar misollarini keltiring.

Quyidagi mezonlar bo'yicha baholang:

1. SO'Z BOYLIGI (0-100): Ingliz tilida lug'at boyligi, so'zlarni to'g'ri ishlatish
   Format: "Siz [ball] ball oldingiz. [Yaxshi tomoni]. Lekin [xato misoli]. [Qisqa tavsiya]."

2. GRAMMATIKA (0-100): Ingliz tili grammatikasi, jumla tuzilishi
   Format: "Sizning grammatikangiz [ball] ballga loyiq. [Yaxshi tomoni]. Xato: [konkret misol]. [Tavsiya]."

3. IZCHILLIK (0-100): Fikrlarning mantiqiy ketma-ketligi, ravonlik
   Format: "Izchillik uchun [ball] ball. [Yaxshi tomoni]. Muammo: [misol]. [Tavsiya]."

UMUMIY XULOSA (30-50 so'z):
"Sizning CEFR darajangiz [daraja]. [Kuchli tomon]. [Yaxshilash kerak]. [Qisqa tavsiya]."

JSON formatda javob bering:
{
  "vocabularyScore": 85,
  "vocabularyFeedback": "Siz 85 ball oldingiz. So'z boyligingiz yaxshi, lekin ba'zi so'zlarni takrorladingiz (very, good). Sinonimlar (excellent, wonderful) ishlating.",
  "grammarScore": 80,
  "grammarFeedback": "Grammatikangiz 80 ballga loyiq. Asosan to'g'ri. Xato: 'He go' deb aytdingiz ('He goes' bo'lishi kerak). 3-shaxs -s qo'shishni unutmang.",
  "coherenceScore": 75,
  "coherenceFeedback": "Izchillik uchun 75 ball. Fikrlaringiz tushunarli. Muammo: to'satdan mavzu o'zgardi. Linking words (however, therefore) ko'proq ishlating.",
  "overallFeedback": "Sizning CEFR darajangiz B1. Lug'at yaxshi, grammatika asosan to'g'ri. Izchillikni oshiring. Davom eting!",
  "suggestedScore": 80,
  "suggestedCefrLevel": "B1"
}`
    };

    const systemMessages = {
      ar: "You are a CEFR speaking assessment expert. You evaluate students speaking Arabic. Your responses must be in Uzbek language and MUST be valid JSON format with all required fields.",
      en: "You are a CEFR speaking assessment expert. You evaluate students speaking English. Your responses must be in Uzbek language and MUST be valid JSON format with all required fields."
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemMessages[language]
        },
        {
          role: "user",
          content: prompts[language]
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content || "{}";
    console.log(`GPT-4o response (${language}):`, responseContent);
    
    const result = JSON.parse(responseContent);
    
    // Ensure all fields exist with defaults
    return {
      vocabularyScore: Number(result.vocabularyScore) || 0,
      vocabularyFeedback: String(result.vocabularyFeedback || "So'z boyligi baholanmadi"),
      grammarScore: Number(result.grammarScore) || 0,
      grammarFeedback: String(result.grammarFeedback || "Grammatika baholanmadi"),
      coherenceScore: Number(result.coherenceScore) || 0,
      coherenceFeedback: String(result.coherenceFeedback || "Izchillik baholanmadi"),
      overallFeedback: String(result.overallFeedback || "Umumiy xulosa berilmadi"),
      suggestedScore: Number(result.suggestedScore) || 0,
      suggestedCefrLevel: String(result.suggestedCefrLevel || "A1"),
    };
  } catch (error) {
    console.error("GPT evaluation error:", error);
    throw new Error("AI baholash xatolik");
  }
}
