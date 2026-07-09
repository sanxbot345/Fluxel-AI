import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, File, ChevronDown, ChevronUp } from 'lucide-react';
import { Message } from '../types';

interface FileAttachment {
  name: string;
  content: string;
}

function parseFileAttachment(content: string): { attachment: FileAttachment | null; remainingText: string } {
  const match = content.match(/\[File Lampiran:\s*([^\]]+)\]\s*\n```[a-zA-Z-]*\n([\s\S]*?)\n```\s*\n?/);
  if (match) {
    const name = match[1];
    const fileContent = match[2];
    const remainingText = content.replace(match[0], '');
    return {
      attachment: { name, content: fileContent },
      remainingText
    };
  }
  return { attachment: null, remainingText: content };
}

function FileContainer({ attachment }: { attachment: FileAttachment }) {
  const charCount = attachment.content.length;
  const isBase64 = attachment.content.startsWith('data:') && attachment.content.includes(';base64,');
  const displaySize = charCount > 1024 
    ? `${(charCount / 1024).toFixed(1)} KB` 
    : `${charCount} B`;

  return (
    <div className="inline-flex items-center gap-1.5 bg-[#FAF9F6] border border-gray-150/40 rounded-md px-2 py-1 text-left my-1 max-w-full select-none" title={attachment.name}>
      <File className="w-3.5 h-3.5 text-blue-500 shrink-0" />
      <span className="text-[10px] font-medium text-gray-500 leading-none">
        {isBase64 ? 'Media' : 'Dokumen'} • {displaySize}
      </span>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  onPreviewCode?: (code: string) => void;
}

export const ChatMessage = React.memo(function ChatMessage({ message, onPreviewCode }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [shouldHighlight, setShouldHighlight] = useState(false);

  useEffect(() => {
    // Delay highlighting slightly to prevent rendering bottlenecks during list mounts
    const timer = setTimeout(() => {
      setShouldHighlight(true);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const { attachment, remainingText } = parseFileAttachment(message.content);

  const [displayedText, setDisplayedText] = useState(() => message.isStreaming ? '' : remainingText);

  useEffect(() => {
    if (!message.isStreaming) {
      setDisplayedText(remainingText);
      return;
    }

    if (displayedText === remainingText) {
      return;
    }

    let isCancelled = false;
    const step = () => {
      if (isCancelled) return;
      setDisplayedText((current) => {
        const diff = remainingText.length - current.length;
        if (diff <= 0) return remainingText;

        // Dynamic increments so it looks super smooth but never lags behind the stream
        let increment = 1;
        if (diff > 200) {
          increment = Math.ceil(diff / 3);
        } else if (diff > 100) {
          increment = Math.ceil(diff / 5);
        } else if (diff > 45) {
          increment = Math.ceil(diff / 8);
        } else if (diff > 15) {
          increment = 3;
        } else if (diff > 4) {
          increment = 2;
        }

        return remainingText.slice(0, current.length + increment);
      });

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);

    return () => {
      isCancelled = true;
    };
  }, [remainingText, message.isStreaming]);

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="max-w-[85%] bg-claude-user-bg p-4 rounded-2xl rounded-tr-none text-[15px] leading-relaxed text-claude-text flex flex-col gap-3">
          {attachment && (
            <FileContainer attachment={attachment} />
          )}
          {remainingText.trim() ? (
            <p className="whitespace-pre-wrap">{remainingText}</p>
          ) : (
            attachment && <p className="text-xs text-gray-400 italic">Menganalisis file...</p>
          )}
        </div>
      </div>
    );
  }

  if (message.isStreaming && !message.content) {
    return null;
  }

  return (
    <div className="flex gap-4 w-full">
      <div className="flex-1 space-y-4 w-full max-w-full">
        <div className="text-[15px] leading-relaxed text-claude-text font-serif markdown-body">
          {attachment && (
            <div className="mb-4">
              <FileContainer attachment={attachment} />
            </div>
          )}
          <Markdown 
            remarkPlugins={[remarkGfm]}
            components={{
              pre: ({ node, ...props }) => (
                <div className="mb-6 overflow-hidden rounded-xl bg-white border border-gray-100 font-sans shadow-sm">
                  {props.children}
                </div>
              ),
              code(props) {
                const {children, className, node, ref, ...rest} = props
                const match = /language-(\w+)/.exec(className || '')
                const codeString = String(children).replace(/\n$/, '');
                
                // Tentukan jika ini inline code (tidak ada language dan tidak ada newline)
                const isInline = !match && !codeString.includes('\n');
                
                if (isInline) {
                  return (
                    <code {...rest} className="text-claude-accent bg-claude-accent/5 px-1 py-0.5 rounded text-[13.5px] font-mono font-semibold">
                      {children}
                    </code>
                  )
                }

                // Kode Blok (baik dengan bahasa terdefinisi maupun fallback multi-baris)
                const language = match ? match[1] : '';
                const isHtmlOnly = language === 'html' || 
                                   language === 'xml' || 
                                   language === 'svg' || 
                                   (language === '' && codeString.trim().startsWith('<') && codeString.trim().includes('>'));

                return (
                  <div className="flex flex-col w-full bg-white">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 text-gray-500 text-xs border-b border-gray-100">
                      <span className="font-semibold lowercase">{match ? language : 'code'}</span>
                      <div className="flex items-center gap-1.5">
                        {isHtmlOnly && onPreviewCode && !message.isStreaming && (
                          <button 
                            onClick={() => onPreviewCode(codeString)} 
                            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-200/70 transition-colors text-gray-700 font-medium cursor-pointer"
                            title="Preview Code"
                          >
                            <Play className="w-3.5 h-3.5 text-blue-600" fill="currentColor" />
                            <span>Preview</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleCopy(codeString)} 
                          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-200/70 transition-colors text-gray-700 font-medium cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedCode === codeString ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                          <span>{copiedCode === codeString ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    
                    {message.isStreaming || !shouldHighlight ? (
                      <div className="p-4 overflow-x-auto bg-white">
                        <pre className="m-0 !bg-transparent !border-0">
                          <code {...rest} className={`text-gray-800 text-[13.5px] font-mono whitespace-pre !bg-transparent !p-0 ${className || ''}`}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-white overflow-x-auto">
                        {match ? (
                          <SyntaxHighlighter
                            {...rest}
                            PreTag="div"
                            children={codeString}
                            language={language}
                            style={oneLight}
                            customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                            className="!m-0 text-[13.5px]"
                          />
                        ) : (
                          <pre className="p-4 m-0 !bg-transparent !border-0">
                            <code {...rest} className="text-gray-800 text-[13.5px] font-mono whitespace-pre !bg-transparent !p-0">
                              {children}
                            </code>
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )
              }
            }}
          >
            {displayedText}
          </Markdown>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.content === nextProps.message.content &&
         prevProps.message.isStreaming === nextProps.message.isStreaming &&
         prevProps.onPreviewCode === nextProps.onPreviewCode;
});
