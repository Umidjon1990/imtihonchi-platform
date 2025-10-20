import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  isRecording: boolean;
  onRecordingComplete?: (audioBlob: Blob) => void;
  autoStart?: boolean;
}

export default function AudioRecorder({ 
  isRecording, 
  onRecordingComplete,
  autoStart = false 
}: AudioRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Audio recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6" data-testid="audio-recorder">
      {isRecording ? (
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-24 h-24 rounded-full bg-destructive flex items-center justify-center animate-pulse"
            data-testid="recording-indicator"
          >
            <Mic className="w-12 h-12 text-white" />
          </div>
          <div className="text-2xl font-mono font-bold text-destructive" data-testid="recording-time">
            {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-muted-foreground">Yozib olish davom etmoqda...</div>
        </div>
      ) : audioUrl ? (
        <div className="flex flex-col items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            className="w-24 h-24 rounded-full"
            onClick={togglePlayback}
            data-testid="button-play-audio"
          >
            {isPlaying ? (
              <Pause className="w-12 h-12" />
            ) : (
              <Play className="w-12 h-12" />
            )}
          </Button>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="text-sm text-muted-foreground">Audio yozuv tayyor</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <Mic className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="text-sm text-muted-foreground">Tayyor turgan holat</div>
        </div>
      )}
    </div>
  );
}
