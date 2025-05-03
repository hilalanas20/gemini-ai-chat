import React, { useState, useEffect, useRef } from 'react';
import { sendToGemini } from '../services/geminiAPI';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        alert('Speech recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', parts: [{ text: input }], timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const res = await sendToGemini([...messages, userMsg]);
      const aiMsg = { role: 'model', parts: [{ text: res }], timestamp: new Date().toLocaleTimeString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('ChatBox error:', err.message);
      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: `Error: ${err.message}` }], timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportChat = () => {
    const chatContent = messages
      .map((msg) => `[${msg.timestamp}] ${msg.role === 'user' ? 'You' : 'Gemini'}: ${msg.parts[0].text}`)
      .join('\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_history.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl rounded-xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gemini AI Chat</h1>
        <div className="flex gap-4">
          <button
            onClick={handleExportChat}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Chat
          </button>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Chat
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
      <div className={`h-80 md:h-96 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6 space-y-6 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <span className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>🤖</span>
            )}
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[70%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-800 text-gray-900 dark:text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} shadow-md`}
              >
                {msg.parts?.[0]?.text}
              </div>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{msg.timestamp}</span>
            </div>
            {msg.role === 'user' && (
              <span className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>👤</span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <span className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>🤖</span>
            <div className="flex items-center gap-1 pt-2">
              <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-400' : 'bg-blue-500'} animate-bounce`}></div>
              <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-400' : 'bg-blue-500'} animate-bounce delay-100`}></div>
              <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-400' : 'bg-blue-500'} animate-bounce delay-200`}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-3 items-center mt-6">
        <input
          className={`flex-1 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400'} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100`}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading || isListening}
        />
        <button
          onClick={handleVoiceInput}
          className={`px-4 py-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'} hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:bg-gray-400`}
          disabled={loading}
        >
          🎤
        </button>
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          disabled={loading || isListening}
        >
          Send
        </button>
        
      </div>
    </div>
  );
};

export default ChatBox;