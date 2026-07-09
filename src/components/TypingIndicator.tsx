import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5 w-full py-2 pl-1 animate-pulse">
      <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

