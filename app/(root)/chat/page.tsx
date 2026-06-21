'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bot, ChevronLeft, Send, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am your AlphaCare AI health companion. How can I help you today? You can ask me details about your previous checkup scores, sleep quality, stress levels, or get some wellness tips!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'How did my sleep score look in my last checkup?',
    'What are my key strengths and areas to improve?',
    'Give me a summary of my wellness checkup history.',
    'What suggestions do you have for reducing stress?',
  ];

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved chat on mount
  useEffect(() => {
    const saved = localStorage.getItem('alphacare_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved chat:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save chat whenever messages state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('alphacare_chat_history', JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  useEffect(() => {
    if (messages.length > 1 || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleClearChat = () => {
    const defaultMsg: ChatMessage[] = [
      {
        role: 'assistant',
        content:
          "Hello! I am your AlphaCare AI health companion. How can I help you today? You can ask me details about your previous checkup scores, sleep quality, stress levels, or get some wellness tips!",
      },
    ];
    setMessages(defaultMsg);
    localStorage.removeItem('alphacare_chat_history');
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.text },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "Sorry, I couldn't process that. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred. Please check your internet connection.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-160px)] flex flex-col md:flex-row gap-6 w-full py-4'>
      {/* Quick Prompts Panel */}
      <div className='md:w-1/3 flex flex-col gap-4 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-6 text-white min-h-[200px]'>
        <div className='flex items-center gap-2 mb-2'>
          <h3 className='text-lg font-bold'>Quick Questions</h3>
        </div>
        <p className='text-sm text-gray-300 mb-2'>
          Click one of these suggestions to instantly ask about your history or checkup outcomes:
        </p>
        <div className='flex flex-col gap-3'>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className='text-left text-sm bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-xl p-3 transition hover:scale-[1.02] duration-200 cursor-pointer text-white'
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className='mt-auto pt-4 border-t border-white/10 flex items-center justify-between'>
          <Button variant='outline' onClick={() => router.back()} className='flex items-center gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer'>
            <ChevronLeft size={16} />
            Back
          </Button>
          <Link href='/history'>
            <span className='text-sm font-semibold text-primary hover:underline'>View History</span>
          </Link>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className='flex-1 flex flex-col bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 md:p-6 text-white min-h-[500px] max-h-[600px]'>
        <div className='flex items-center justify-between pb-4 border-b border-white/10 mb-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/20 p-2 rounded-xl border border-primary/30'>
              <Bot className='text-primary size-6' />
            </div>
            <div>
              <h2 className='text-lg font-bold'>AlphaCare AI Companion</h2>
              <span className='text-xs text-green-400 flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-green-500 animate-ping' />
                Online & Ready
              </span>
            </div>
          </div>
          {messages.length > 1 && (
            <Button
              variant='outline'
              onClick={handleClearChat}
              className='text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer h-8 px-3 rounded-xl hover:text-red-400'
            >
              Clear Chat
            </Button>
          )}
        </div>

        {/* Message Log */}
        <div ref={scrollContainerRef} className='flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar max-h-[420px] min-h-[300px]'>
          {messages.map((m, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3 max-w-[85%] md:max-w-[75%]',
                m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-xl flex-shrink-0 size-8 flex items-center justify-center border',
                  m.role === 'user'
                    ? 'bg-blue-600/30 border-blue-500/30 text-blue-400'
                    : 'bg-primary/20 border-primary/30 text-primary'
                )}
              >
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-6 shadow-md',
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'
                )}
              >
                <p className='whitespace-pre-line'>{m.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className='flex gap-3 mr-auto max-w-[75%]'>
              <div className='bg-primary/20 border border-primary/30 text-primary p-2 rounded-xl flex-shrink-0 size-8 flex items-center justify-center'>
                <Bot size={16} />
              </div>
              <div className='bg-white/10 border border-white/5 text-gray-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-1.5 shadow-md'>
                <span className='size-1.5 rounded-full bg-white/60 animate-bounce' style={{ animationDelay: '0ms' }} />
                <span className='size-1.5 rounded-full bg-white/60 animate-bounce' style={{ animationDelay: '150ms' }} />
                <span className='size-1.5 rounded-full bg-white/60 animate-bounce' style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className='flex gap-2'
        >
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask about your wellness metrics...'
            className='flex-1 bg-white/10 border border-white/15 focus:border-primary focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-400'
          />
          <Button type='submit' className='bg-primary hover:bg-primary/80 text-black font-semibold rounded-xl px-4 flex items-center gap-2 transition hover:scale-[1.02] cursor-pointer'>
            <Send size={16} />
            <span>Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
