export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

