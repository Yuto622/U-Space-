import React, { useEffect, useRef, useState } from 'react';
import { Message, NPC, Role } from '../types';

// Polyfill types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface DialogBoxProps {
  npc: NPC;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const DialogBox: React.FC<DialogBoxProps> = ({ npc, messages, onSendMessage, onClose, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after one sentence
      recognition.interimResults = true; // Show results while speaking
      recognition.lang = 'en-US'; // Force English for learning

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // If we have a final result, append it or replace? 
        // For a chat, usually replacing the current input or appending if previously typed is good.
        // Here we just set the input to what's being said.
        if (finalTranscript) {
             setInputText(prev => {
                 const newText = prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript;
                 return newText;
             });
        } else if (interimTranscript) {
            // Optional: You could show interim results in a separate UI, 
            // but strictly setting state here might interfere with typing if mixed.
            // For simplicity, we only commit final results to the main input, 
            // or we can set it temporarily. Let's just log interim for now or 
            // visually indicate it.
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] h-[60vh] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-full border-2 border-white/50 shadow-inner flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: npc.color }}
            >
              {npc.name.charAt(0)}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{npc.name}</h2>
            <p className="text-xs text-slate-300 font-medium tracking-wide">English Conversation</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="group bg-white/10 hover:bg-red-500/90 hover:text-white text-slate-200 p-2 rounded-lg transition-all duration-200"
          title="End Conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
        {messages.map((msg, index) => {
          const isUser = msg.role === Role.USER;
          return (
            <div 
              key={index} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] px-5 py-3 text-sm md:text-base shadow-sm relative ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-sm'
                }`}
              >
                {msg.text}
                <div className={`text-[10px] mt-1 opacity-70 ${isUser ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-10">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 relative items-center">
          {/* Mic Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title="Speak to type"
            >
              {isListening ? (
                // Mic Off / Stop Icon
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
              ) : (
                // Mic Icon
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              )}
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type or speak..."}
            className="flex-1 bg-slate-100 border-0 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'opacity-0' : 'opacity-100'}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
};