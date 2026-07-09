import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { PreviewPage } from './components/PreviewPage';
import { TypingIndicator } from './components/TypingIndicator';
import { LandingPage } from './components/LandingPage';
import { Menu, PanelLeft, ArrowRight, Settings, Trash2, MessageSquare, Database, Sparkles, X, Check, AlertCircle, ArrowDown, Code2, PenTool, Lightbulb, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const suggestions = [
  {
    title: 'Analisis kode',
    prompt: 'Tolong analisis kode JavaScript/TypeScript berikut untuk mencari potensi bug dan memberikan rekomendasi optimasi performa:\n\n```typescript\n\n```',
    iconName: 'Code2'
  },
  {
    title: 'Tulis draf',
    prompt: 'Tolong tulis draf email penawaran kerja sama profesional yang menarik untuk diajukan ke calon klien atau partner bisnis.',
    iconName: 'PenTool'
  },
  {
    title: 'Tanya ide baru',
    prompt: 'Bantu saya brainstorming 5 ide proyek sampingan unik dan kreatif yang menggabungkan AI dengan web development menggunakan React.',
    iconName: 'Lightbulb'
  },
  {
    title: 'Jelaskan konsep',
    prompt: 'Jelaskan konsep Quantum Computing secara sederhana menggunakan analogi kehidupan sehari-hari agar mudah dipahami anak umur 10 tahun.',
    iconName: 'BookOpen'
  }
];

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem('fluxel_username') || '';
    } catch (e) {
      return '';
    }
  });

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('fluxel_chat_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledUpRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem('fluxel_chat_sessions', JSON.stringify(chatSessions));
    } catch (e) {
      console.error('Error saving chat sessions:', e);
    }
  }, [chatSessions]);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth', force = false) => {
    if (chatContainerRef.current) {
      if (force || !userHasScrolledUpRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior,
        });
      }
    }
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    // Check if the user is close to the bottom
    const threshold = 150; // pixels of buffer
    const isCloseToBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
    
    userHasScrolledUpRef.current = !isCloseToBottom;
    setShowScrollBottomBtn(!isCloseToBottom && container.scrollHeight > container.clientHeight);
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const scrollIfNeeded = () => {
      if (!userHasScrolledUpRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Initial scroll on messages update
    const hasStreaming = messages.some(msg => msg.isStreaming);
    scrollToBottom(hasStreaming ? 'auto' : 'smooth');

    // Create observers to continuously watch for layout and height expansions (e.g. typing animations and streaming blocks)
    let mutationObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(scrollIfNeeded);
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scrollIfNeeded);
      resizeObserver.observe(container);

      const descendants = container.querySelectorAll('.markdown-body, pre, code');
      descendants.forEach(d => resizeObserver?.observe(d));
    }

    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [messages, isTyping]);

  const cleanTitle = (text: string): string => {
    let clean = text;
    if (clean.includes('[File Lampiran:')) {
      const parts = clean.split('```');
      if (parts.length > 2) {
        clean = parts.slice(2).join(' ').trim();
      } else {
        clean = clean.replace(/\[File Lampiran:.*?\][\s\S]*?(\`\`\`[\s\S]*?\`\`\`\s*)?/, '').trim();
      }
    }
    if (!clean) clean = "Analisis File";
    return clean.length > 28 ? clean.substring(0, 28) + '...' : clean;
  };

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      targetSessionId = Date.now().toString();
      setCurrentSessionId(targetSessionId);
      
      const newSession: ChatSession = {
        id: targetSessionId,
        title: cleanTitle(content),
        messages: [userMessage],
        timestamp: Date.now()
      };
      setChatSessions(prev => [newSession, ...prev]);
    } else {
      setChatSessions(prev => prev.map(s => 
        s.id === targetSessionId 
          ? { ...s, messages: [...s.messages, userMessage], timestamp: Date.now() }
          : s
      ));
    }

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setIsSidebarOpen(false); // Auto close sidebar on message send for better mobile/desktop view
    userHasScrolledUpRef.current = false;
    setTimeout(() => {
      scrollToBottom('smooth', true);
    }, 50);

    let modelMessageId: string | null = null;
    let accumulatedContent = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                accumulatedContent += `\n\n⚠️ **Error:** ${data.error}`;
                setIsTyping(false);
                if (!modelMessageId) {
                  modelMessageId = (Date.now() + 1).toString();
                  const initialModelMessage: Message = { id: modelMessageId!, role: 'model', content: accumulatedContent, isStreaming: false };
                  setMessages((prev) => [...prev, initialModelMessage]);
                } else {
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === modelMessageId 
                        ? { ...msg, content: accumulatedContent, isStreaming: false } 
                        : msg
                    )
                  );
                }
              } else if (data.text) {
                accumulatedContent += data.text;
                setIsTyping(false); // Hide the bounce typing indicator as soon as text stream begins

                if (!modelMessageId) {
                  modelMessageId = (Date.now() + 1).toString();
                  const initialModelMessage: Message = { id: modelMessageId!, role: 'model', content: accumulatedContent, isStreaming: true };
                  setMessages((prev) => [...prev, initialModelMessage]);
                } else {
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === modelMessageId 
                        ? { ...msg, content: accumulatedContent } 
                        : msg
                    )
                  );
                }
              }
            } catch (e) {
              console.error('Error parsing JSON from stream:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      const errId = Date.now().toString();
      const errMessage: Message = { id: errId, role: 'model', content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda.' };
      setMessages((prev) => [...prev, errMessage]);
      
      setChatSessions(prev => prev.map(s => 
        s.id === targetSessionId
          ? { ...s, messages: [...s.messages, errMessage] }
          : s
      ));
    } finally {
      setIsTyping(false);
      if (modelMessageId) {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMessageId 
              ? { ...msg, isStreaming: false } 
              : msg
          )
        );

        const finalModelMessage: Message = { id: modelMessageId, role: 'model', content: accumulatedContent, isStreaming: false };
        setChatSessions(prev => prev.map(s => 
          s.id === targetSessionId
            ? { 
                ...s, 
                messages: [
                  ...s.messages.filter(m => m.id !== modelMessageId),
                  finalModelMessage
                ]
              }
            : s
        ));
      }
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsSidebarOpen(false);
    userHasScrolledUpRef.current = false;
  };

  const handleLoadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setIsSidebarOpen(false);
      userHasScrolledUpRef.current = false;
      setTimeout(() => {
        scrollToBottom('auto', true);
      }, 50);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  if (showLanding) {
    return (
      <>
        <LandingPage onStartChat={() => {
          if (userName.trim()) {
            setShowLanding(false);
          } else {
            setShowNameModal(true);
          }
        }} />
        {showNameModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#FAF9F6] border border-[#E5E4E1] p-8 md:p-10 rounded-[32px] shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-100/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-6 justify-center">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">Fluxel AI</span>
              </div>
              
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#1F1F1E] text-center mb-2 leading-tight">
                Siapa nama Anda?
              </h2>
              <p className="text-xs text-gray-500 text-center mb-8">
                Fluxel ingin menyapa Anda secara personal saat mulai berkonsultasi.
              </p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (userName.trim()) {
                  try {
                    localStorage.setItem('fluxel_username', userName.trim());
                  } catch (err) {
                    console.error(err);
                  }
                  setShowLanding(false);
                  setShowNameModal(false);
                }
              }} className="space-y-4 relative z-10">
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-[200px] text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-center"
                  autoFocus
                  required
                />
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNameModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-[200px] text-xs font-semibold hover:bg-gray-50 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#1F1F1E] text-white rounded-[200px] text-xs font-semibold hover:bg-black transition-all flex items-center justify-center gap-1.5"
                  >
                    Mulai Chat <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  const greetingText = `${getGreeting()}, ${userName || 'User'}`;
  const greetingWords = greetingText.split(' ');

  return (
    <div className="flex h-[100dvh] bg-claude-bg text-claude-text font-sans overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}
      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`fixed md:relative z-50 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 w-[300px]' : '-translate-x-full w-[300px] md:translate-x-0 md:w-0'} bg-sidebar-bg border-r border-claude-border h-[100dvh] md:h-full overflow-hidden flex-shrink-0`}>
        
        {/* Header Sidebar: Fluxel */}
        <div className="flex items-center justify-center h-16 border-b border-claude-border/40 w-[300px] shrink-0 bg-sidebar-bg/50">
          <span className="font-serif text-base font-bold tracking-widest text-[#1F1F1E] flex items-center gap-2">
            <img src="/favicon.png" alt="Fluxel Logo" className="w-5 h-5 object-contain" />
            Fluxel
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 w-[300px] pb-24 pt-4">
          {chatSessions.length > 0 && (
            <>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-3 mb-2 mt-4">
                Riwayat Chat
              </div>
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] transition-all ${
                      currentSessionId === session.id
                        ? 'bg-[#eae8e2] text-claude-text font-semibold shadow-sm'
                        : 'text-[#4e4d4a] hover:bg-sidebar-hover'
                    }`}
                  >
                    <button
                      onClick={() => handleLoadSession(session.id)}
                      className="flex-1 text-left truncate flex items-center gap-2.5 pr-2"
                    >
                      <MessageSquare size={14} className="text-gray-500 shrink-0" />
                      <span className="truncate">{session.title}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all text-gray-400 shrink-0"
                      title="Hapus chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 flex gap-3">
          <button 
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-4 h-14 bg-blue-100 text-blue-700 rounded-[200px] hover:bg-blue-200 transition-all font-medium text-[15px]"
          >
            <span>Chat Baru</span>
          </button>
          
          <button 
            onClick={() => {
              setShowSettings(true);
              setConfirmDeleteAll(false);
              setIsSidebarOpen(false); // Auto close sidebar when Settings is opened
            }}
            className="w-14 h-14 flex items-center justify-center bg-transparent border border-gray-200 text-[#1F1F1E] rounded-full hover:bg-sidebar-hover transition-all shrink-0"
            title="Pengaturan"
          >
            <Settings size={20} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-transparent">
          <div className="flex items-center gap-2">
            <button onClick={toggleSidebar} className="hidden md:flex p-2 -ml-2 rounded-lg hover:bg-sidebar-hover text-muted">
              <PanelLeft size={20} />
            </button>
            <button onClick={toggleSidebar} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-sidebar-hover">
              <Menu size={20} />
            </button>
          </div>
          <div className="flex gap-4">
            <button className="hidden md:block text-[13px] text-muted hover:text-claude-text">Share</button>
            <button className="hidden md:block text-[13px] text-muted hover:text-claude-text">Download</button>
          </div>
        </header>

        {/* Chat Messages */}
        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 px-4 py-6 md:p-10 flex flex-col items-center overflow-y-auto">
          {messages.length === 0 ? (
            <div className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center py-10 md:py-16 text-center">
              <motion.h1 
                className="font-serif text-[28px] md:text-[38px] font-semibold text-[#1F1F1E] tracking-tight mb-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                Ada yang bisa saya bantu, <span className="text-claude-accent">{userName || 'hari ini'}</span>?
              </motion.h1>
              
              {/* Centered ChatInput inside welcome container */}
              <div className="w-full">
                <ChatInput onSend={handleSend} disabled={isTyping} />
              </div>

              {/* Suggestions Cards underneath */}
              <div className="flex flex-wrap gap-2.5 justify-center w-full mt-6 px-1 max-w-2xl mx-auto">
                {suggestions.map((s, idx) => {
                  const Icon = s.iconName === 'Code2' ? Code2 : 
                               s.iconName === 'PenTool' ? PenTool :
                               s.iconName === 'Lightbulb' ? Lightbulb : BookOpen;
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleSend(s.prompt)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200/80 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] active:scale-[0.96] text-[#1F1F1E] cursor-pointer"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 + idx * 0.05 }}
                    >
                      <Icon size={14} className="text-[#1F1F1E]/60 flex-shrink-0" />
                      <span className="text-[13px] font-medium leading-none">
                        {s.title}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-full md:px-6 lg:px-12 space-y-8 pb-32">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onPreviewCode={setPreviewCode} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex flex-col items-center bg-gradient-to-t from-claude-bg via-claude-bg to-transparent">
            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollBottomBtn && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  onClick={() => {
                    userHasScrolledUpRef.current = false;
                    scrollToBottom('smooth', true);
                    setShowScrollBottomBtn(false);
                  }}
                  className="mb-3 p-3 bg-white border border-gray-200 text-gray-700 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center justify-center z-40"
                  title="Scroll ke bawah"
                >
                  <ArrowDown size={18} className="animate-bounce" />
                </motion.button>
              )}
            </AnimatePresence>
            <ChatInput onSend={handleSend} disabled={isTyping} />
            <div className="text-center mt-3 text-[11px] text-muted">
              Fluxel bisa saja membuat kesalahan. Harap periksa informasi penting.
            </div>
          </div>
        )}
      </main>

      {/* Preview Page Overlay */}
      {previewCode !== null && (
        <PreviewPage code={previewCode} onClose={() => setPreviewCode(null)} />
      )}

      {/* Settings Modal Panel */}
      <AnimatePresence>
        {showSettings && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSettings(false);
              }
            }}
            className="fixed inset-0 bg-black/45 backdrop-blur-[4px] flex items-center justify-center z-[200] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-white border border-gray-200 w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden flex flex-col relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-20"
                title="Tutup"
              >
                <X size={18} />
              </button>

              {/* Title Header */}
              <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                <Settings size={20} className="text-gray-800" />
                <span className="font-serif text-[17px] font-bold text-gray-800">Pengaturan</span>
              </div>

              {/* Content Panel (Penyimpanan Only) */}
              <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-white space-y-5">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 text-gray-800">
                      <Database size={15} className="text-red-500" />
                      <h3 className="text-sm font-bold">Penyimpanan Riwayat Chat</h3>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Semua pesan dan sesi konsultasi Anda disimpan di memori lokal peramban (Local Storage) untuk menjamin privasi Anda.
                    </p>
                  </div>

                  {/* Storage stats card */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                      <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">Total Sesi</span>
                      <span className="text-sm font-bold text-gray-800">{chatSessions.length} Sesi</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                      <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">Total Pesan</span>
                      <span className="text-sm font-bold text-gray-800">
                        {chatSessions.reduce((acc, s) => acc + s.messages.length, 0)} Pesan
                      </span>
                    </div>
                  </div>

                  {/* Warning & delete button */}
                  <div className="border border-red-100 bg-red-50/50 p-4 rounded-xl space-y-3">
                    <div className="flex gap-2 items-start text-red-700">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="block text-xs font-bold">Hapus Seluruh Riwayat Chat</span>
                        <p className="text-[10px] text-red-650 leading-relaxed">
                          Tindakan ini akan menghapus semua pesan, sesi obrolan, dan file lampiran secara permanen dari browser ini. Tindakan ini tidak dapat dibatalkan.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1">
                      {deleteSuccess ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-650 font-semibold bg-green-50 border border-green-200 py-2 px-3 rounded-xl justify-center">
                          <Check size={14} />
                          <span>Riwayat chat berhasil dihapus secara permanen!</span>
                        </div>
                      ) : !confirmDeleteAll ? (
                        <button
                          id="btn-delete-history-chat"
                          onClick={() => setConfirmDeleteAll(true)}
                          className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-xl transition-all"
                        >
                          Hapus Semua Riwayat Chat
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold text-red-700 text-center">
                            Apakah Anda sangat yakin?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setChatSessions([]);
                                setCurrentSessionId(null);
                                setMessages([]);
                                try {
                                  localStorage.removeItem('fluxel_chat_sessions');
                                } catch (e) {
                                  console.error(e);
                                }
                                setDeleteSuccess(true);
                                setConfirmDeleteAll(false);
                                setTimeout(() => {
                                  setDeleteSuccess(false);
                                  setShowSettings(false);
                                }, 1800);
                              }}
                              className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
                            >
                              Ya, Hapus Permanen
                            </button>
                            <button
                              onClick={() => setConfirmDeleteAll(false)}
                              className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 font-sans border-t border-gray-100 pt-3">
                  <span>Ruang Terpakai: ~{(JSON.stringify(chatSessions).length / 1024).toFixed(2)} KB</span>
                  <span className="font-mono">v1.2.0</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
