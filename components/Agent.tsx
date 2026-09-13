/* eslint-disable @next/next/no-img-element */
'use client';

import { END_CALL_FUNCTION_NAME, getAgentConfig } from '@/constants';
import { createFeedback } from '@/lib/actions/general.action';
import { cn } from '@/lib/utils';
import {
  createAgentSession,
  createMicrophone,
  createPlayer,
} from '@/lib/deepgram.sdk';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  AgentSession,
  AgentMicrophone,
  AgentPlayer,
  FunctionCallRequestMessage,
} from '@deepgram/agents';

enum CallStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  CONNECTING = 'CONNECTING',
  FINISHED = 'FINISHED',
}

interface SavedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const Agent = ({
  userName,
  userId,
  type,
  interviewId,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] =
    useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  const sessionRef = useRef<AgentSession | null>(null);
  const micRef = useRef<AgentMicrophone | null>(null);
  const playerRef = useRef<AgentPlayer | null>(null);
  // Guards the post-call handoff so it only runs once per call.
  const submittedRef = useRef(false);
  // Mirrors `isSpeaking` for the hang-up poll, which runs outside React state.
  const speakingRef = useRef(false);
  const hangupTimerRef = useRef<number | null>(null);

  const fetchToken = async (): Promise<string> => {
    const res = await fetch('/api/deepgram/token');
    const data = await res.json();
    if (!data.token) {
      throw new Error(data.error || 'Failed to get Deepgram token');
    }
    return data.token;
  };

  const handleMessage = (message: {
    type: string;
    role?: string;
    content?: string;
  }) => {
    if (message.type === 'ConversationText') {
      const role = (message.role ?? 'user') as SavedMessage['role'];
      const content = message.content ?? '';
      if (content) {
        const newMessage: SavedMessage = { role, content };
        setMessages((prev) => [...prev, newMessage]);
      }
    }
  };

  const handleDisconnect = useCallback(async () => {
    if (hangupTimerRef.current !== null) {
      window.clearTimeout(hangupTimerRef.current);
      hangupTimerRef.current = null;
    }
    if (micRef.current) {
      micRef.current.stop();
      micRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.interrupt();
      playerRef.current.dispose();
      playerRef.current = null;
    }
    speakingRef.current = false;
    setIsSpeaking(false);
    setCallStatus(CallStatus.FINISHED);
  }, []);

  /**
   * The agent calls `end_call` once it has said goodbye, but the goodbye audio
   * is usually still streaming at that point — cutting the socket immediately
   * would clip it. So poll until the agent has stopped speaking and the player
   * has drained, with a hard ceiling so a stalled stream can't hang the call.
   */
  const scheduleHangup = useCallback(() => {
    if (hangupTimerRef.current !== null) return;

    const deadline = Date.now() + 25000;
    const tick = () => {
      const remaining = playerRef.current?.getRemainingPlaybackTime() ?? 0;
      if ((!speakingRef.current && remaining <= 0.1) || Date.now() > deadline) {
        hangupTimerRef.current = null;
        handleDisconnect();
        return;
      }
      hangupTimerRef.current = window.setTimeout(tick, 250);
    };

    // Give TTS a moment to start: the function call can land before the
    // goodbye audio does, and an empty player would otherwise read as "done".
    hangupTimerRef.current = window.setTimeout(tick, 1500);
  }, [handleDisconnect]);

  const handleCall = async () => {
    if (callStatus === CallStatus.ACTIVE) {
      return;
    }

    setCallStatus(CallStatus.CONNECTING);
    submittedRef.current = false;
    setMessages([]);
    toast.loading(
      type === 'interview'
        ? 'Starting your checkup...'
        : 'Connecting you to the front desk...'
    );

    try {
      const token = await fetchToken();
      const agentConfig = getAgentConfig({ type, userName, questions });

      const session = createAgentSession({
        auth: { tokenFactory: () => Promise.resolve(token) },
        agent: agentConfig,
        audio: {
          output: { encoding: 'linear16', sampleRate: 24000 },
        },
      });

      const player = createPlayer();
      player.setVolume(1.0);

      session.on('conversation-text', handleMessage);
      session.on('agent-started-speaking', () => {
        speakingRef.current = true;
        setIsSpeaking(true);
      });
      session.on('agent-audio-done', () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      });
      session.on('user-started-speaking', () => player.interrupt());
      session.on(
        'function-call-request',
        (msg: FunctionCallRequestMessage) => {
          for (const fn of msg.functions ?? []) {
            if (fn.name !== END_CALL_FUNCTION_NAME) continue;
            session.sendFunctionCallResponse(
              fn.id,
              fn.name,
              JSON.stringify({ success: true })
            );
            scheduleHangup();
          }
        }
      );
      session.on(
        'error',
        (msg: { type: 'Error'; description: string; code: string }) => {
          console.error('Deepgram error:', msg);
          toast.dismiss();
          toast.error('Connection error. Please try again.');
          setCallStatus(CallStatus.INACTIVE);
        }
      );
      session.on('connected', () => {
        toast.dismiss();
        setCallStatus(CallStatus.ACTIVE);
      });
      session.on('disconnected', () => {
        setCallStatus(CallStatus.FINISHED);
      });

      session.on('audio', (chunk: ArrayBuffer) => {
        player.queue(chunk);
      });

      sessionRef.current = session;
      playerRef.current = player;

      await session.connect();

      const mic = createMicrophone((data: ArrayBuffer) => {
        session.sendAudio(data);
      });

      mic.on('error', (err: Error) => {
        console.error('Microphone error:', err);
      });

      micRef.current = mic;
      await mic.start();
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.dismiss();
      toast.error('Failed to connect. Please check your Deepgram API key.');
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleGenerateFeedback = useCallback(
    async (messages: SavedMessage[]) => {
      // Nothing was said — Gemini would be scoring an empty transcript.
      if (messages.length === 0) {
        toast.error('No conversation was recorded. Please try again.');
        router.push('/');
        return;
      }

      toast.loading('Writing up your checkup...');
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
      });
      toast.dismiss();

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback/`);
      } else {
        toast.error('Failed to generate your feedback.');
        router.push('/');
      }
    },
    [interviewId, userId, router]
  );

  const handleGenerateInterview = useCallback(
    async (messages: SavedMessage[]) => {
      // Nothing was said — no point asking Gemini to build questions from air.
      if (messages.length === 0) {
        toast.error('No conversation was recorded. Please try again.');
        router.push('/');
        return;
      }

      try {
        toast.loading('Booking your appointment...');
        const response = await fetch('/api/vapi/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userid: userId,
            transcript: messages,
          }),
        });
        const data = await response.json();
        toast.dismiss();

        if (data.success && data.interviewId) {
          toast.success('Appointment booked — your checkup is ready below.');
          router.push('/');
          return;
        }

        toast.error('Failed to book your appointment.');
        router.push('/');
      } catch (error) {
        console.error('Error saving checkup:', error);
        toast.dismiss();
        toast.error('Error booking your appointment.');
        router.push('/');
      }
    },
    [userId, router]
  );

  useEffect(() => {
    // `disconnected` and the END button both land on FINISHED, and `messages`
    // is a dependency, so without this guard the handoff can fire twice and
    // create duplicate checkups.
    if (callStatus !== CallStatus.FINISHED || submittedRef.current) return;
    submittedRef.current = true;

    if (type === 'generate') {
      handleGenerateInterview(messages);
    } else {
      handleGenerateFeedback(messages);
    }
  }, [
    messages,
    callStatus,
    type,
    handleGenerateInterview,
    handleGenerateFeedback,
  ]);

  // Leaving the page mid-call would otherwise leave the mic and socket open.
  useEffect(() => {
    return () => {
      if (hangupTimerRef.current !== null) {
        window.clearTimeout(hangupTimerRef.current);
      }
      micRef.current?.stop();
      sessionRef.current?.disconnect();
      playerRef.current?.dispose();
    };
  }, []);

  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  const seed = Math.random().toString();

  return (
    <>
      <div className='call-view'>
        <div className='card-interviewer'>
          <div className='avatar'>
            <Image
              src='/ai-avatar.png'
              alt='deepgram'
              width={65}
              height={65}
              className='object-cover'
            />
            {isSpeaking && <span className='animate-speak'></span>}
          </div>
          <h3>{type === 'interview' ? 'Consulting Doctor' : 'Front Desk'}</h3>
        </div>

        <div className='card-border'>
          <div className='card-content'>
            <img
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`}
              alt='avatar'
              width={100}
              height={100}
              className='rounded-full object-fit size-[90px] bg-black outline hover:shadow-lg transition-transform transform hover:scale-125'
            />
            <h3>{userName}</h3>
            <p className='text-sm'>Your ID:</p>
            <h3>{userId}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className='transcript-border'>
          <div className='transcript'>
            <p
              key={messages[messages.length - 1]?.content}
              className={cn(
                'transition-opacity duration-500 opacity-0',
                'animate-fadeIn opacity-100'
              )}
            >
              {messages[messages.length - 1]?.content}
            </p>
          </div>
        </div>
      )}

      <div className='w-full flex justify-center mt-5'>
        {callStatus !== 'ACTIVE' ? (
          <button className='btn-call' onClick={handleCall}>
            <span
              className={cn(
                'absolute animate-ping rounded-full opacity-75',
                callStatus !== 'CONNECTING' && 'hidden'
              )}
            />
            <span>{isCallInactiveOrFinished ? 'Call' : '. . .'}</span>
          </button>
        ) : (
          <button className='btn-disconnect ' onClick={handleDisconnect}>
            {' '}
            END
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
