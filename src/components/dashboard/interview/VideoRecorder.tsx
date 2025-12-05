import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

interface VideoRecorderProps {
  interviewId: string;
  username: string;
  onSave?: (videoBlob: Blob, filename: string) => void;
}

export interface VideoRecorderHandle {
  videoElement: HTMLVideoElement | null;
  getVideoRef: () => React.RefObject<HTMLVideoElement>;
}

const VideoRecorder = forwardRef<VideoRecorderHandle, VideoRecorderProps>(({
  interviewId,
  username,
  onSave,
}, ref) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Expose video element to parent component
  useImperativeHandle(ref, () => ({
    videoElement: videoRef.current,
    getVideoRef: () => videoRef,
  }));

  useEffect(() => {
    const startCameraAndRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const filename = `${interviewId}_${username}.webm`;
          if (onSave) {
            onSave(blob, filename);
          }
        };
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setRecording(true);
      } catch (error) {
        console.error("Error starting camera:", error);
      }
    };

    startCameraAndRecording();

    // Cleanup: stop camera and recording when component unmounts
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-36 h-28 lg:w-44 lg:h-32 object-cover rounded-lg"
        style={{ background: "#1a1a2e", transform: "scaleX(-1)" }}
      />
      {recording && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] text-white font-medium bg-black/50 px-1.5 py-0.5 rounded">REC</span>
        </div>
      )}
    </div>
  );
});

VideoRecorder.displayName = 'VideoRecorder';

export default VideoRecorder;
