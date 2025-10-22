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
      ar: `Siz CEFR og'zaki baholash mutaxassisisiz. Arab tilida gapirgan talabaning javoblarini baholang.

TALABA JAVOBI (Arab tilida):
${combinedText}

Quyidagi mezonlar bo'yicha baholang (optimistik yondashuv bilan):

1. SO'Z BOYLIGI (0-100): Arab tilida lug'at boyligi, so'zlarni to'g'ri ishlatish
2. GRAMMATIKA (0-100): Arab tili grammatikasi, jumla tuzilishi, morfologiya
3. IZCHILLIK (0-100): Fikrlarning mantiqiy ketma-ketligi, ravonlik

Har bir mezon uchun:
- Ball (0-100)
- Qisqa tavsif (3-4 jumla, o'zbek tilida)

Umumiy xulosa:
- Kuchli tomonlar
- Yaxshilanishi kerak bo'lgan tomonlar
- Umumiy tavsiyalar

Umumiy ball (0-100) va CEFR daraja (A1, A2, B1, B2, C1, C2) taklif qiling.

JSON formatda javob bering:
{
  "vocabularyScore": 85,
  "vocabularyFeedback": "...",
  "grammarScore": 80,
  "grammarFeedback": "...",
  "coherenceScore": 75,
  "coherenceFeedback": "...",
  "overallFeedback": "...",
  "suggestedScore": 80,
  "suggestedCefrLevel": "B1"
}`,
      en: `Siz CEFR og'zaki baholash mutaxassisisiz. Ingliz tilida gapirgan talabaning javoblarini baholang.

TALABA JAVOBI (Ingliz tilida):
${combinedText}

Quyidagi mezonlar bo'yicha baholang (optimistik yondashuv bilan):

1. SO'Z BOYLIGI (0-100): Ingliz tilida lug'at boyligi, so'zlarni to'g'ri ishlatish
2. GRAMMATIKA (0-100): Ingliz tili grammatikasi, jumla tuzilishi
3. IZCHILLIK (0-100): Fikrlarning mantiqiy ketma-ketligi, ravonlik

Har bir mezon uchun:
- Ball (0-100)
- Qisqa tavsif (3-4 jumla, o'zbek tilida)

Umumiy xulosa:
- Kuchli tomonlar
- Yaxshilanishi kerak bo'lgan tomonlar
- Umumiy tavsiyalar

Umumiy ball (0-100) va CEFR daraja (A1, A2, B1, B2, C1, C2) taklif qiling.

JSON formatda javob bering:
{
  "vocabularyScore": 85,
  "vocabularyFeedback": "...",
  "grammarScore": 80,
  "grammarFeedback": "...",
  "coherenceScore": 75,
  "coherenceFeedback": "...",
  "overallFeedback": "...",
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
