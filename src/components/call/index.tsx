"use client";

import {
  ArrowUpRightSquareIcon,
  AlarmClockIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useResponses } from "@/contexts/responses.context";
import Image from "next/image";
import axios from "axios";
import { RetellWebClient } from "retell-client-js-sdk";
import MiniLoader from "../loaders/mini-loader/miniLoader";
import { toast, Toaster } from "sonner";
import { isLightColor, testEmail } from "@/lib/utils";
import { ResponseService } from "@/services/responses.service";
import { Interview } from "@/types/interview";
import { FeedbackData } from "@/types/response";
import { FeedbackService } from "@/services/feedback.service";
import { FeedbackForm } from "@/components/call/feedbackForm";
import VideoRecorder, { VideoRecorderHandle } from '@/components/dashboard/interview/VideoRecorder';
import {
  TabSwitchWarning,
  useTabSwitchPrevention,
} from "./tabSwitchPrevention";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InterviewerService } from "@/services/interviewers.service";
import { useFaceVerification } from "@/hooks/useFaceVerification";
import { FaceMismatchWarning, VerificationStatus } from "./FaceMismatchWarning";

const webClient = new RetellWebClient();

type InterviewProps = {
  interview: Interview;
};

type registerCallResponseType = {
  data: {
    registerCallResponse: {
      call_id: string;
      access_token: string;
    };
  };
};

type transcriptType = {
  role: string;
  content: string;
};

function Call({ interview }: InterviewProps) {
  const { createResponse } = useResponses();
  const [lastInterviewerResponse, setLastInterviewerResponse] =
    useState<string>("");
  const [lastUserResponse, setLastUserResponse] = useState<string>("");
  const [activeTurn, setActiveTurn] = useState<string>("");
  const [Loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [isOldUser, setIsOldUser] = useState<boolean>(false);
  const [callId, setCallId] = useState<string>("");
  const { tabSwitchCount } = useTabSwitchPrevention();
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [interviewerImg, setInterviewerImg] = useState("");
  const [interviewTimeDuration, setInterviewTimeDuration] =
    useState<string>("1");
  const [time, setTime] = useState(0);
  const [currentTimeDuration, setCurrentTimeDuration] = useState<string>("0");

  // Face verification states
  const [assigneePhotoUrl, setAssigneePhotoUrl] = useState<string | null>(null);
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const videoRecorderRef = useRef<VideoRecorderHandle>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const lastUserResponseRef = useRef<HTMLDivElement | null>(null);

  // Face verification hook - pass the ref directly
  const { 
    result: verificationResult, 
    mismatchCount,
    isLoading: verificationLoading,
    hasReferenceImage 
  } = useFaceVerification({
    referenceImageUrl: assigneePhotoUrl,
    videoRef: videoElementRef,
    enabled: isStarted && !isEnded && !!assigneePhotoUrl && !!videoElement,
    checkInterval: 15000, // Check every 15 seconds
    matchThreshold: 0.6,
  });

  // Update video element ref when recorder ref changes
  useEffect(() => {
    const checkVideoElement = () => {
      if (videoRecorderRef.current?.videoElement) {
        videoElementRef.current = videoRecorderRef.current.videoElement;
        setVideoElement(videoRecorderRef.current.videoElement);
        console.log('Video element connected for face verification');
      }
    };
    
    // Check immediately
    checkVideoElement();
    
    // Also check after a short delay (video might not be ready immediately)
    const timeout = setTimeout(checkVideoElement, 1000);
    const timeout2 = setTimeout(checkVideoElement, 2000);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [isStarted]);

  // Show warning when face mismatch detected
  useEffect(() => {
    if (!verificationResult.isMatch && verificationResult.lastChecked && hasReferenceImage) {
      setShowMismatchWarning(true);
      // Auto-hide warning after 8 seconds
      const timeout = setTimeout(() => setShowMismatchWarning(false), 8000);
      return () => clearTimeout(timeout);
    }
  }, [verificationResult, hasReferenceImage]);

  // Fetch assignee photo when interview starts
  useEffect(() => {
    const fetchAssigneePhoto = async () => {
      if (email && interview.id && isStarted) {
        try {
          const res = await fetch('/api/get-assignee-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, interview_id: interview.id }),
          });
          const data = await res.json();
          if (data.avatar_url) {
            console.log('Assignee photo found:', data.avatar_url);
            setAssigneePhotoUrl(data.avatar_url);
          } else {
            console.log('No assignee photo found for face verification');
          }
        } catch (error) {
          console.error('Error fetching assignee photo:', error);
        }
      }
    };
    fetchAssigneePhoto();
  }, [isStarted, email, interview.id]);

  const handleFeedbackSubmit = async (
    formData: Omit<FeedbackData, "interview_id">,
  ) => {
    try {
      const result = await FeedbackService.submitFeedback({
        ...formData,
        interview_id: interview.id,
      });

      if (result) {
        toast.success("Thank you for your feedback!");
        setIsFeedbackSubmitted(true);
        setIsDialogOpen(false);
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  useEffect(() => {
    if (lastUserResponseRef.current) {
      const { current } = lastUserResponseRef;
      current.scrollTop = current.scrollHeight;
    }
  }, [lastUserResponse]);

  useEffect(() => {
    let intervalId: any;
    if (isCalling) {
      // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
      intervalId = setInterval(() => setTime(time + 1), 10);
    }
    setCurrentTimeDuration(String(Math.floor(time / 100)));
    if (Number(currentTimeDuration) == Number(interviewTimeDuration) * 60) {
      webClient.stopCall();
      setIsEnded(true);
    }

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalling, time, currentTimeDuration]);

  useEffect(() => {
    if (testEmail(email)) {
      setIsValidEmail(true);
    }
  }, [email]);

  useEffect(() => {
    webClient.on("call_started", () => {
      console.log("Call started");
      setIsCalling(true);
    });

    webClient.on("call_ended", () => {
      console.log("Call ended");
      setIsCalling(false);
      setIsEnded(true);
    });

    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
    });

    webClient.on("agent_stop_talking", () => {
      // Optional: Add any logic when agent stops talking
      setActiveTurn("user");
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      webClient.stopCall();
      setIsEnded(true);
      setIsCalling(false);
    });

    webClient.on("update", (update) => {
      if (update.transcript) {
        const transcripts: transcriptType[] = update.transcript;
        const roleContents: { [key: string]: string } = {};

        transcripts.forEach((transcript) => {
          roleContents[transcript?.role] = transcript?.content;
        });

        setLastInterviewerResponse(roleContents["agent"]);
        setLastUserResponse(roleContents["user"]);
      }
      //TODO: highlight the newly uttered word in the UI
    });

    return () => {
      // Clean up event listeners
      webClient.removeAllListeners();
    };
  }, []);

  const onEndCallClick = async () => {
    if (isStarted) {
      setLoading(true);
      webClient.stopCall();
      setIsEnded(true);
      setLoading(false);
    } else {
      setIsEnded(true);
    }
  };

  const startConversation = async () => {
    setLoading(true);
    // 1. Validate email with backend
    try {
      const validateRes = await axios.post("/api/validate-user", { email,interview_id: interview.id, });
      
      console.log("validateRes", validateRes);
      if (!validateRes.data.success) {
        toast.error(validateRes.data.error || "You are not authorized person");
        setLoading(false);
        return;
      }
    } catch (err: any) {
    console.log("CATCH BLOCK", err?.response);
    const message =
      err?.response?.data?.error ||
      err?.message ||
      "You are not authorized person";
      toast.error(message);
      setLoading(false);
      return;
    }
    const data = {
      mins: interview?.time_duration,
      objective: interview?.objective,
      questions: interview?.questions.map((q) => q.question).join(", "),
      name: name || "not provided",
    };

    const oldUserEmails: string[] = (
      await ResponseService.getAllEmails(interview.id)
    ).map((item) => item.email);
    const OldUser =
      oldUserEmails.includes(email) ||
      (interview?.respondents && !interview?.respondents.includes(email));

    if (OldUser) {
      setIsOldUser(true);
    } else {
      const registerCallResponse: registerCallResponseType = await axios.post(
        "/api/register-call",
        { dynamic_data: data, interviewer_id: interview?.interviewer_id },
      );
      if (registerCallResponse.data.registerCallResponse.access_token) {
        await webClient
          .startCall({
            accessToken:
              registerCallResponse.data.registerCallResponse.access_token,
          })
          .catch(console.error);
        setIsCalling(true);
        setIsStarted(true);

        setCallId(registerCallResponse?.data?.registerCallResponse?.call_id);

        const response = await createResponse({
          interview_id: interview.id,
          call_id: registerCallResponse.data.registerCallResponse.call_id,
          email: email,
          name: name,
        });
      } else {
        console.log("Failed to register call");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (interview?.time_duration) {
      setInterviewTimeDuration(interview?.time_duration);
    }
  }, [interview]);

  useEffect(() => {
    const fetchInterviewer = async () => {
      const interviewer = await InterviewerService.getInterviewer(
        interview.interviewer_id,
      );
      setInterviewerImg(interviewer.image);
    };
    fetchInterviewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.interviewer_id]);

  useEffect(() => {
    if (isEnded) {
      const updateInterview = async () => {
        await ResponseService.saveResponse(
          { is_ended: true, tab_switch_count: tabSwitchCount },
          callId,
        );
      };

      updateInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnded]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {isStarted && <TabSwitchWarning />}
      
      {/* Face Mismatch Warning */}
      {isStarted && !isEnded && (
        <FaceMismatchWarning
          isVisible={showMismatchWarning}
          confidence={verificationResult.confidence}
          mismatchCount={mismatchCount}
          faceDetected={verificationResult.faceDetected}
          error={verificationResult.error}
          onDismiss={() => setShowMismatchWarning(false)}
        />
      )}
      <div className="w-[95%] md:w-[90%] lg:w-[85%] max-w-7xl">
        <Card className="min-h-[90vh] rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-xl shadow-indigo-100/50 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                  style={{
                    width: isEnded
                      ? "100%"
                      : `${
                          (Number(currentTimeDuration) /
                            (Number(interviewTimeDuration) * 60)) *
                          100
                        }%`,
                  }}
                />
              </div>
            </div>
            
            {/* Header */}
            <CardHeader className="items-center py-4 px-6">
              {!isEnded && (
                <CardTitle className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">
                  {interview?.name}
                </CardTitle>
              )}
              {!isEnded && (
                <div className="flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100">
                  <AlarmClockIcon
                    className="h-4 w-4"
                    style={{ color: interview.theme_color || '#4F46E5' }}
                  />
                  <span className="text-sm text-slate-600">
                    Expected duration:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: interview.theme_color || '#4F46E5' }}
                    >
                      {interviewTimeDuration} mins
                    </span>
                    {" "}or less
                  </span>
                </div>
              )}
            </CardHeader>
            {!isStarted && !isEnded && !isOldUser && (
              <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                  {/* Logo Section */}
                  {interview?.logo_url && (
                    <div className="p-6 pb-4 flex justify-center border-b border-slate-100">
                      <Image
                        src={interview?.logo_url}
                        alt="Logo"
                        className="h-12 w-auto object-contain"
                        width={120}
                        height={48}
                      />
                    </div>
                  )}
                  
                  {/* Description */}
                  <div className="p-6">
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-4">
                      {interview?.description}
                    </p>
                    
                    {/* Important Notes */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                      <p className="text-sm text-amber-800 font-medium mb-2">📋 Before you begin:</p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Ensure your volume is up</li>
                        <li>• Grant microphone access when prompted</li>
                        <li>• Be in a quiet environment</li>
                        <li>• Tab switching will be recorded</li>
                      </ul>
                    </div>
                    
                    {/* Form Fields */}
                    {!interview?.is_anonymous && (
                      <div className="space-y-3 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input
                            value={email}
                            type="email"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                            placeholder="you@example.com"
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                          <input
                            value={name}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                            placeholder="Enter your first name"
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        style={{
                          backgroundColor: interview.theme_color ?? "#4F46E5",
                          color: isLightColor(interview.theme_color ?? "#4F46E5")
                            ? "black"
                            : "white",
                        }}
                        disabled={
                          Loading ||
                          (!interview?.is_anonymous && (!isValidEmail || !name))
                        }
                        onClick={startConversation}
                      >
                        {!Loading ? (
                          <>
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Start Interview
                          </>
                        ) : (
                          <MiniLoader />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-11 px-6 rounded-xl border-2 hover:bg-slate-50 transition-all"
                            style={{ borderColor: interview.theme_color || '#e2e8f0' }}
                            disabled={Loading}
                          >
                            Exit
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Exit Interview?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to exit without starting the interview?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-indigo-600 hover:bg-indigo-700 rounded-full"
                              onClick={async () => {
                                await onEndCallClick();
                              }}
                            >
                              Yes, Exit
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isStarted && !isEnded && !isOldUser && (
              <div className="flex-1 flex flex-col lg:flex-row gap-6 px-6 py-4">
                {/* Interviewer Section */}
                <div className="flex-1 flex flex-col">
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                    {/* Interviewer Avatar */}
                    <div className="flex flex-col items-center mb-4">
                      <div className={`relative p-1 rounded-full ${
                        activeTurn === "agent"
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"
                          : "bg-slate-200"
                      }`}>
                        <div className="bg-white p-1 rounded-full">
                          {interviewerImg ? (
                            <Image
                              src={interviewerImg}
                              alt="Interviewer"
                              width={140}
                              height={140}
                              className="rounded-full object-cover w-32 h-32 lg:w-36 lg:h-36"
                            />
                          ) : (
                            <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-slate-200 animate-pulse" />
                          )}
                        </div>
                        {activeTurn === "agent" && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                            <span className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full shadow-lg">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              Speaking
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-800">Interviewer</h3>
                    </div>
                    
                    {/* Interviewer Message */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 min-h-[180px] max-h-[280px] overflow-y-auto">
                      <p className="text-lg lg:text-xl text-slate-700 leading-relaxed">
                        {lastInterviewerResponse || (
                          <span className="text-slate-400 italic">Waiting for interviewer...</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden lg:flex items-center">
                  <div className="w-px h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
                </div>

                {/* Interviewee Section */}
                <div className="flex-1 flex flex-col">
                  <div className="bg-gradient-to-br from-slate-50 to-purple-50/50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                    {/* User Video */}
                    <div className="flex flex-col items-center mb-4">
                      <div className={`relative p-1 rounded-2xl ${
                        activeTurn === "user"
                          ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-pulse"
                          : "bg-slate-200"
                      }`}>
                        <div className="bg-slate-900 rounded-xl overflow-hidden relative">
                          <VideoRecorder
                            ref={videoRecorderRef}
                            interviewId={interview.id}
                            username={name || "Anonymous"}
                          />
                          {/* Face Verification Status Indicator */}
                          {hasReferenceImage && (
                            <VerificationStatus
                              isVerifying={verificationLoading}
                              isMatch={verificationResult.lastChecked ? verificationResult.isMatch : null}
                              hasReference={hasReferenceImage}
                            />
                          )}
                        </div>
                        {activeTurn === "user" && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full shadow-lg">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              Your turn
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-800">{name || "Anonymous"}</h3>
                    </div>
                    
                    {/* User Response */}
                    <div 
                      ref={lastUserResponseRef}
                      className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 min-h-[180px] max-h-[280px] overflow-y-auto"
                    >
                      <p className="text-lg lg:text-xl text-slate-700 leading-relaxed">
                        {lastUserResponse || (
                          <span className="text-slate-400 italic">Your response will appear here...</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isStarted && !isEnded && !isOldUser && (
              <div className="flex justify-center py-4 px-6 border-t border-slate-100 bg-slate-50/50">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="px-6 py-2 h-11 rounded-full border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 font-medium shadow-sm"
                      disabled={Loading}
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      End Interview
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">End Interview?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-600">
                        This action cannot be undone. Are you sure you want to end the interview now?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 rounded-full"
                        onClick={async () => {
                          await onEndCallClick();
                        }}
                      >
                        Yes, End Interview
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {isEnded && !isOldUser && (
              <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden p-8 text-center">
                  {/* Success Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <CheckCircleIcon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-slate-800 mb-3">
                    {isStarted ? "Interview Complete!" : "Thank You!"}
                  </h2>
                  
                  <p className="text-slate-600 mb-6">
                    {isStarted
                      ? "Thank you for taking the time to participate in this interview. Your responses have been recorded."
                      : "Thank you for your consideration. We appreciate your time."}
                  </p>
                  
                  <p className="text-sm text-slate-500 mb-6">
                    You can safely close this tab now.
                  </p>

                  {!isFeedbackSubmitted && isStarted && (
                    <AlertDialog
                      open={isDialogOpen}
                      onOpenChange={setIsDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white h-11 px-8 rounded-full shadow-md hover:shadow-lg transition-all"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          Share Your Feedback
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <FeedbackForm
                          email={email}
                          onSubmit={handleFeedbackSubmit}
                        />
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  {isFeedbackSubmitted && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                      <CheckCircleIcon className="h-4 w-4" />
                      Feedback submitted
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isOldUser && (
              <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md bg-gradient-to-br from-white to-amber-50/30 rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden p-8 text-center">
                  {/* Info Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                    <CheckCircleIcon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-slate-800 mb-3">
                    Already Participated
                  </h2>
                  
                  <p className="text-slate-600 mb-6">
                    You have already responded to this interview or you are not eligible to participate. Thank you for your interest!
                  </p>
                  
                  <p className="text-sm text-slate-500">
                    You can safely close this tab now.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* Footer */}
        <div className="flex justify-center items-center mt-4 mb-2">
          <a
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/60 hover:bg-white hover:border-slate-300 transition-all duration-200 shadow-sm"
            href="https://folo-up.co/"
            target="_blank"
          >
            <span className="text-sm text-slate-600">
              Powered by{" "}
              <span className="font-semibold text-slate-800">
                Folo<span className="text-indigo-600">Up</span>
              </span>
            </span>
            <ArrowUpRightSquareIcon className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Call;
