import React from 'react';
import ChatBox from './components/ChatBox';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 via-blue-50 to-white p-4">
      <div className="max-w-2xl w-full">
        <ChatBox />
      </div>
      <footer className="absolute bottom-4 text-center text-gray-600 text-sm">
        Powered by xAI | © 2025
      </footer>
    </div>
  );
}