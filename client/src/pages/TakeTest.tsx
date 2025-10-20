import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TimerDisplay from "@/components/TimerDisplay";
import AudioRecorder from "@/components/AudioRecorder";
import { Progress } from "@/components/ui/progress";
import familyImage from "@assets/generated_images/Test_image_-_family_gathering_65c84604.png";
import parkImage from "@assets/generated_images/Test_image_-_city_park_29971cd6.png";

type TestPhase = "preparation" | "speaking" | "completed";

export default function TakeTest() {
  const [currentSection, setCurrentSection] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [phase, setPhase] = useState<TestPhase>("preparation");
  const [isRecording, setIsRecording] = useState(false);

  //todo: remove mock functionality
  const sections = [
    {
      number: 1,
      title: "1-bo'lim: Shaxsiy savolllar",
      questions: [
        "O'zingiz haqingizda gapirib bering.",
        "Sevimli mashg'ulotingiz nima?",
        "Bo'sh vaqtingizda nima qilishni yoqtirasiz?",
      ],
    },
    {
      number: 2,
      title: "2-bo'lim: Rasm tavsifi",
      questions: [
        "Rasmda nimalarni ko'ryapsiz?",
        "Bu rasmning afzalligi va kamchiligi nimada?",
        "Ushbu holatni boshqa holat bilan taqqoslang.",
      ],
      image: familyImage,
    },
  ];

  const currentSectionData = sections[currentSection - 1];
  const totalQuestions = currentSectionData.questions.length;
  const progress = ((currentQuestion - 1) / totalQuestions) * 100;

  const handlePhaseComplete = () => {
    if (phase === "preparation") {
      setPhase("speaking");
      setIsRecording(true);
    } else if (phase === "speaking") {
      setIsRecording(false);
      if (currentQuestion < totalQuestions) {
        setCurrentQuestion(currentQuestion + 1);
        setPhase("preparation");
      } else {
        setPhase("completed");
      }
    }
  };

  const handleNextSection = () => {
    setCurrentSection(currentSection + 1);
    setCurrentQuestion(1);
    setPhase("preparation");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">CEFR Og'zaki Test</h1>
          <Button variant="outline" data-testid="button-exit">
            Chiqish
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentSectionData.title}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Savol {currentQuestion} / {totalQuestions}
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
        </Card>

        {phase !== "completed" ? (
          <Card>
            <CardContent className="p-8 space-y-6">
              {currentSectionData.image && (
                <div className="flex justify-center">
                  <img
                    src={currentSectionData.image}
                    alt="Test rasm"
                    className="max-w-2xl w-full rounded-lg shadow-lg"
                    data-testid="img-test-question"
                  />
                </div>
              )}

              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold" data-testid="text-question">
                  {currentSectionData.questions[currentQuestion - 1]}
                </h2>

                <TimerDisplay
                  seconds={phase === "preparation" ? 5 : 30}
                  isActive={true}
                  onComplete={handlePhaseComplete}
                  label={phase === "preparation" ? "O'ylash vaqti" : "Gapirish vaqti"}
                />

                {phase === "preparation" ? (
                  <div className="text-muted-foreground">
                    Javobingizni tayyorlang...
                  </div>
                ) : (
                  <AudioRecorder isRecording={isRecording} />
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold text-primary">
                {currentSection < sections.length
                  ? "Bo'lim tugallandi!"
                  : "Test tugallandi!"}
              </h2>
              <p className="text-muted-foreground">
                {currentSection < sections.length
                  ? "Keyingi bo'limga o'tishga tayyormisiz?"
                  : "Barcha javoblaringiz muvaffaqiyatli yuklandi."}
              </p>
              <Button
                onClick={
                  currentSection < sections.length
                    ? handleNextSection
                    : () => console.log("Submit test")
                }
                data-testid="button-next-section"
              >
                {currentSection < sections.length ? "Keyingi bo'lim" : "Tugatish"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
