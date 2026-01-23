
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatInput from '../components/ChatInput';
import { ChatMessage } from '../types';
import { RECIPES, COACH_GREETINGS } from '../constants';
import { sendMessageToCoach, auth } from '../firebase';
import { getSubscriptionStatus } from '../services/revenueCatService';

const CoachChat: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const recipe = RECIPES.find(r => r.id === recipeId) || RECIPES[0];
  const greeting = COACH_GREETINGS[recipe.id] || "Hi! I'm your coach.";
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (recipe.isPremium) {
        const status = await getSubscriptionStatus();
        if (!status.isPro) {
          navigate('/paywall', { replace: true });
          return;
        }
      }
      setCheckingAccess(false);
      setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
    };
    checkAccess();
  }, [recipeId, greeting, recipe.isPremium, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!checkingAccess) scrollToBottom();
  }, [messages, isTyping, checkingAccess]);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const result = await sendMessageToCoach({
        guidrId: recipe.id,
        messageHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        isNewSession: !sessionStarted
      });
      setSessionStarted(true);
      const data = (result as any).data as { response: string };
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting...", timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  if (checkingAccess) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <i className="fa-solid fa-lock text-primary text-4xl animate-pulse"></i>
    </div>
  );

  return (
    <Layout 
      title={recipe?.name || "Coaching"} 
      showBack onBack={() => navigate('/')}
      actions={
        <div className="flex items-center gap-2 bg-surface/80 px-3 py-1.5 rounded-full border border-border/50">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${isTyping ? "bg-primary animate-ping" : "bg-green-500"}`}></div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isTyping ? "Listening..." : "Online"}
          </span>
        </div>
      }
    >
      <div className="flex-1 flex flex-col space-y-4 pb-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`relative max-w-[85%] px-4 py-2.5 rounded-2xl text-[15px] ${isUser ? 'bg-primary text-white rounded-br-none' : 'bg-surface text-slate-100 border border-border/30 rounded-bl-none'}`}>
                {msg.content}
                <div className={`absolute bottom-0 w-4 h-4 ${isUser ? '-right-1' : '-left-1'}`}>
                   <div className={`w-full h-full ${isUser ? 'bg-primary' : 'bg-surface border-l border-b border-border/30'} rotate-45 transform origin-bottom`}></div>
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-surface border border-border/30 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSendMessage} disabled={isTyping} />
    </Layout>
  );
};

export default CoachChat;
