import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus, File, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 300)}px`;
      if (scrollHeight > 300) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [input]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTriggerFileInput = () => {
    setIsPlusMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isTextFile = file.type.startsWith('text/') || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.js') || 
                       file.name.endsWith('.jsx') || 
                       file.name.endsWith('.ts') || 
                       file.name.endsWith('.tsx') || 
                       file.name.endsWith('.json') || 
                       file.name.endsWith('.md') || 
                       file.name.endsWith('.html') || 
                       file.name.endsWith('.css');

    reader.onload = (event) => {
      const content = event.target?.result as string || '';
      setAttachedFile({
        path: file.name,
        name: file.name,
        content: content
      });
    };

    if (isTextFile) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSend = () => {
    if ((input.trim() || attachedFile) && !disabled) {
      let finalContent = '';
      if (attachedFile) {
        finalContent += `[File Lampiran: ${attachedFile.path}]\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n`;
      }
      
      // If there's an attached file but empty text, ask for general explanation
      finalContent += input.trim() || `Tolong jelaskan atau analisa file ${attachedFile?.name} di atas.`;
      
      onSend(finalContent);
      setInput('');
      setAttachedFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl bg-white border border-claude-border rounded-[24px] shadow-lg p-3 flex flex-col gap-2 relative z-30">
      
      {/* Attached File Preview Badge */}
      {attachedFile && (
        <div className="relative w-9 h-9 flex items-center justify-center bg-[#FAF9F6] border border-gray-200 rounded-lg group select-none self-start hover:border-red-200 transition-all shadow-sm" title={attachedFile.name}>
          <File className="w-4 h-4 text-claude-accent" />
          <button
            onClick={() => setAttachedFile(null)}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all flex items-center justify-center scale-95 hover:scale-110"
            title="Hapus file"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Hidden Real File Input for Device Files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="*/*"
      />

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tanya Fluxel apapun..."
        className="w-full px-3 py-3 outline-none resize-none text-[15px] placeholder:text-[16px] placeholder:text-gray-400 bg-transparent disabled:opacity-50 overflow-hidden"
        rows={1}
        disabled={disabled}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Plus Attachment Button */}
          <div className="relative" ref={plusMenuRef}>
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className="p-2 hover:bg-sidebar-hover rounded-lg transition-colors text-muted flex items-center justify-center"
              title="Tambah Lampiran"
            >
              <Plus size={20} />
            </button>
            
            {/* Popover Menu with smooth framer-motion animation */}
            <AnimatePresence>
              {isPlusMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute bottom-11 left-0 w-40 bg-white border border-claude-border rounded-xl shadow-xl z-50 overflow-hidden py-1 flex flex-col gap-0.5"
                >
                  <button
                    type="button"
                    onClick={handleTriggerFileInput}
                    className="w-full px-4 py-2.5 text-left text-[14px] hover:bg-gray-50 text-gray-700 flex items-center gap-2.5 transition-colors font-semibold"
                  >
                    <File className="w-4 h-4 text-gray-500" />
                    <span>File</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <motion.button
          whileHover={(!input.trim() && !attachedFile) || disabled ? {} : { scale: 1.08, y: -1 }}
          whileTap={(!input.trim() && !attachedFile) || disabled ? {} : { scale: 0.95 }}
          onClick={handleSend}
          disabled={(!input.trim() && !attachedFile) || disabled}
          className="w-10 h-10 bg-claude-accent rounded-full flex items-center justify-center text-white shadow-md hover:brightness-110 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:brightness-100 disabled:hover:scale-100 disabled:hover:translate-y-0 cursor-pointer disabled:cursor-not-allowed"
          title="Kirim pesan"
        >
          <motion.div
            animate={
              (input.trim() || attachedFile) && !disabled
                ? { y: [0, -3, 0] }
                : { y: 0 }
            }
            transition={{
              repeat: (input.trim() || attachedFile) && !disabled ? Infinity : 0,
              repeatType: "reverse",
              duration: 1.2,
              ease: "easeInOut"
            }}
            className="flex items-center justify-center"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}
