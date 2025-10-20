import { useState } from "react";
import AudioRecorder from "../AudioRecorder";
import { Button } from "@/components/ui/button";

export default function AudioRecorderExample() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <AudioRecorder isRecording={isRecording} />
      <Button onClick={() => setIsRecording(!isRecording)} data-testid="button-toggle-recording">
        {isRecording ? "To'xtatish" : "Boshlash"}
      </Button>
    </div>
  );
}
