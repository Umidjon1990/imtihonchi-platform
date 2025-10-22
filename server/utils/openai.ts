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
    // Use OpenAI.toFile for Node.js compatibility
    const file = await OpenAI.toFile(audioBuffer, filename);
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "uz", // Uzbek language
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
export async function evaluateSpeaking(transcripts: string[]): Promise<EvaluationResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY muhit o'zgaruvchisi sozlanmagan");
  }

  try {
    const combinedText = transcripts.join("\n\n---\n\n");
    
    const prompt = `Siz CEFR og'zaki baholash mutaxassisisiz. O'zbek tilida ingliz tilini o'rganayotgan talabaning javoblarini baholang.

TALABA JAVOBI:
${combinedText}

Quyidagi mezonlar bo'yicha baholang (optimistik yondashuv bilan):

1. SO'Z BOYLIGI (0-100): Lug'at boyligi, so'zlarni to'g'ri ishlatish
2. GRAMMATIKA (0-100): Grammatik to'g'rilik, jumla tuzilishi
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
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Siz CEFR og'zaki baholash bo'yicha professional mutaxassissiz. Talabalarni rag'batlantiruvchi va konstruktiv baholaysiz. Javoblaringiz o'zbek tilida bo'lishi kerak."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      vocabularyScore: result.vocabularyScore || 0,
      vocabularyFeedback: result.vocabularyFeedback || "",
      grammarScore: result.grammarScore || 0,
      grammarFeedback: result.grammarFeedback || "",
      coherenceScore: result.coherenceScore || 0,
      coherenceFeedback: result.coherenceFeedback || "",
      overallFeedback: result.overallFeedback || "",
      suggestedScore: result.suggestedScore || 0,
      suggestedCefrLevel: result.suggestedCefrLevel || "A1",
    };
  } catch (error) {
    console.error("GPT evaluation error:", error);
    throw new Error("AI baholash xatolik");
  }
}
