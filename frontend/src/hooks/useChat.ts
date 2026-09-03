import { useState, useEffect } from 'react';
import { chatWithData } from '../api/client';
import { sanitizeText } from '../utils/sanitize';
import type { ChatMessage } from '../types';

const INITIAL_QUESTIONS = [
  'What are the key takeaways from this dataset?',
  'Are there any quality issues or anomalies I should fix?',
  'Which factors have the strongest correlation?',
  'Can you explain the predictive model results?'
];

export function useChat(analysisSummary: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recommendedQuestions, setRecommendedQuestions] = useState<string[]>(INITIAL_QUESTIONS);

  // Initialize with welcome message when analysis summary becomes available
  useEffect(() => {
    if (analysisSummary) {
      const filename = analysisSummary.metadata?.filename || 'dataset';
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your DataFect Assistant. I have parsed, cleaned, and analyzed **${filename}**. 

I can answer questions about column profiles, anomalies, correlation strengths, or model predictions. What would you like to explore?`
        }
      ]);
      setRecommendedQuestions(INITIAL_QUESTIONS);
    } else {
      setMessages([]);
      setRecommendedQuestions([]);
    }
  }, [analysisSummary]);

  const sendPrompt = async (text: string) => {
    if (!text.trim() || isLoading || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Exclude welcome message from API history to keep context clean
      const apiHistory = messages.slice(1);
      const sessionId = analysisSummary?.session_id || null;
      const cleanPrompt = sanitizeText(text);
      const res = await chatWithData([...apiHistory, userMessage], cleanPrompt, analysisSummary, sessionId);
      setIsLoading(false);

      // Set new recommended questions from response
      if (res.follow_up_questions && res.follow_up_questions.length > 0) {
        setRecommendedQuestions(res.follow_up_questions);
      } else {
        setRecommendedQuestions(INITIAL_QUESTIONS);
      }

      // Start typewriter streaming effect for the answer
      setIsTyping(true);
      const fullResponseText = res.response;
      let typedText = '';
      const words = fullResponseText.split(/(\s+)/);
      let wordIndex = 0;

      // Add a placeholder message for the typewriter
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const typeInterval = setInterval(() => {
        if (wordIndex < words.length) {
          typedText += words[wordIndex];
          setMessages((prev) => {
            const next = [...prev];
            if (next.length > 0) {
              next[next.length - 1] = { role: 'assistant', content: typedText };
            }
            return next;
          });
          wordIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, 35); // 35ms per word/whitespace chunk for organic-feeling flow

    } catch (err: any) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error answering that question: ${err.message || 'Unknown error'}`
        }
      ]);
    }
  };

  const clearChat = () => {
    if (analysisSummary) {
      const filename = analysisSummary.metadata?.filename || 'dataset';
      setMessages([
        {
          role: 'assistant',
          content: `Conversation restarted. Ready to discuss **${filename}**. What would you like to ask?`
        }
      ]);
      setRecommendedQuestions(INITIAL_QUESTIONS);
    }
  };

  return {
    messages,
    isLoading,
    isTyping,
    recommendedQuestions,
    sendPrompt,
    clearChat
  };
}
