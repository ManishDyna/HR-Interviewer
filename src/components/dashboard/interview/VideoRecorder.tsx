import React, { useEffect, useRef, useState } from "react";

interface VideoRecorderProps {
  interviewId: string;
  username: string;
  onSave: (videoBlob: Blob, filename: string) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  interviewId,
  username,
  onSave,
}) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const startCameraAndRecording = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const filename = `${interviewId}_${username}.webm`;
    
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    };

    startCameraAndRecording();

    // Cleanup: stop camera and recording when component unmounts
    return () => {
      if (mediaRecorderRef.current && recording) {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: 320, height: 240, background: "#222" }}
      />
      {/* {recording && (
        <span className="text-red-600 font-bold mt-2">Recording...</span>
      )} */}
    </div>
  );
};

export default VideoRecorder;