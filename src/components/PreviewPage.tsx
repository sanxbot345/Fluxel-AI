import React, { useState, useEffect } from 'react';
import { ArrowLeft, Monitor, Smartphone, RotateCcw, ExternalLink, Globe, Check, Copy, AlertTriangle, CloudUpload, Zap, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PreviewPageProps {
  code: string;
  onClose: () => void;
}

export function PreviewPage({ code, onClose }: PreviewPageProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);
  const [tempId, setTempId] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState<string | null>(null);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  
  // Publish states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isNetlify, setIsNetlify] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Custom Netlify Token configurations
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [customNetlifyToken, setCustomNetlifyToken] = useState(() => {
    try {
      return localStorage.getItem('fluxel_netlify_token') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    setIsFrameLoading(true);
    // Generate/register temporary local preview
    const registerPreview = async () => {
      try {
        const res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: code }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setTempUrl(data.url);
          setTempId(data.id);
        }
      } catch (err) {
        console.error('Error registering live preview:', err);
      }
    };
    registerPreview();
  }, [code]);

  const handleRefresh = () => {
    setIsFrameLoading(true);
    setKey((prev) => prev + 1);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    setShowPublishModal(false);
    
    try {
      try {
        localStorage.setItem('fluxel_netlify_token', customNetlifyToken.trim());
      } catch (e) {
        console.error(e);
      }

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          html: code,
          customToken: customNetlifyToken.trim() || undefined
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        setPublishedUrl(data.url);
        setIsNetlify(!!data.isNetlify);
      } else {
        setPublishError(data.error || 'Gagal mempublikasikan website. Silakan coba lagi.');
      }
    } catch (e) {
      console.error(e);
      setPublishError('Terjadi kesalahan jaringan saat mencoba mempublikasikan.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyUrl = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleOpenNewTab = () => {
    if (tempUrl) {
      window.open(tempUrl, '_blank');
    } else {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f9fa] fixed inset-0 z-50">
      {/* Header Menu */}
      <header className="flex items-center justify-between px-2 md:px-4 h-14 bg-white border-b border-black/5 shrink-0">
        <div className="flex items-center gap-1 md:gap-3">
          <button 
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-black/5 rounded-md text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center bg-gray-100 rounded-md px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 border border-gray-200 truncate max-w-[180px] md:max-w-none font-mono">
            <span className="text-gray-400 mr-1">https://</span>
            {typeof window !== 'undefined' ? window.location.host : 'fluxel-site.live'}/pub/{tempId || 'live'}
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          {/* Device toggle */}
          <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 mr-2">
            <button 
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-md transition-colors ${device === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-md transition-colors ${device === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleRefresh}
            className="p-1.5 md:p-2 hover:bg-black/5 rounded-md text-gray-600 transition-colors"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={handleOpenNewTab}
            className="p-1.5 md:p-2 hover:bg-black/5 rounded-md text-gray-600 transition-colors mr-2"
            title="Buka website di tab baru (Live)"
          >
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Publish Button with Transparent Background */}
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={isPublishing}
            className="flex items-center justify-center w-9 h-9 bg-transparent hover:bg-black/5 text-green-600 hover:text-green-700 rounded-md transition-all disabled:opacity-50 shrink-0"
            title={isPublishing ? 'Publishing...' : 'Mulai Publikasikan ke Netlify'}
          >
            <CloudUpload className={`w-5 h-5 ${isPublishing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Preview Content Area */}
      <div className="flex-1 overflow-hidden bg-[#FAF9F6] flex items-center justify-center p-0 md:p-8 relative">
        <div 
          className={`bg-white md:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-300 ease-in-out md:border border-gray-200 md:rounded-[18px] overflow-hidden flex flex-col relative ${
            device === 'mobile' ? 'w-full md:w-[385px] h-full md:h-[820px] md:rounded-[40px] md:border-[10px] md:border-gray-800 shadow-2xl' : 'w-full h-full max-w-6xl'
          }`}
        >
          {/* Mock Browser Control Header - makes it feel like an elegant active sandbox */}
          {device !== 'mobile' && (
            <div className="bg-gray-50/85 border-b border-gray-100 px-4 py-3 flex items-center gap-2 shrink-0 select-none backdrop-blur-md">
              <div className="flex gap-1.5 items-center mr-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 block opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 block opacity-80" />
              </div>
              <div className="flex-1 max-w-xl mx-auto bg-white border border-gray-200/80 rounded-lg py-1 px-3 text-[11.5px] text-gray-500 font-mono flex items-center gap-2 justify-center truncate shadow-inner">
                <span className="text-emerald-500 select-none text-[8px] animate-pulse">●</span>
                <span>{typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/pub/{tempId || 'live'}</span>
              </div>
            </div>
          )}

          {/* Iframe Viewport Container with loading state overlay */}
          <div className="flex-1 relative w-full h-full bg-white">
            {tempUrl ? (
              <iframe
                key={key}
                src={tempUrl}
                onLoad={() => setIsFrameLoading(false)}
                className="w-full h-full border-none bg-white transition-opacity duration-300"
                title="preview"
              />
            ) : (
              <iframe
                key={key}
                srcDoc={code}
                onLoad={() => setIsFrameLoading(false)}
                className="w-full h-full border-none bg-white transition-opacity duration-300"
                title="preview"
              />
            )}

            {/* Premium, dynamic loading skeleton screen so preview feels alive/reactive */}
            <AnimatePresence>
              {isFrameLoading && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-30"
                >
                  <div className="flex flex-col items-center gap-4 max-w-sm text-center px-4">
                    <div className="relative flex items-center justify-center">
                      {/* Modern circular loader */}
                      <div className="w-14 h-14 border-4 border-claude-accent/25 border-t-claude-accent rounded-full animate-spin" />
                      <div className="absolute w-7 h-7 bg-claude-accent/10 rounded-full animate-ping" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-gray-900 tracking-tight font-sans">
                        Menyiapkan Halaman Live Preview...
                      </h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed font-sans">
                        Menyusun komponen HTML5, CSS3, dan dependensi Tailwind CSS secara real-time.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Custom Netlify Token Publish Modal */}
        <AnimatePresence>
          {showPublishModal && (
            <div className="fixed inset-0 bg-black/45 backdrop-blur-[4px] flex items-center justify-center z-[150] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white border border-gray-100 rounded-[24px] p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-250"
              >
                {/* Background glow effects */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-teal-600 shadow-sm border border-teal-100/30">
                    <Globe className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 leading-none">
                      Publikasikan ke Netlify
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-sans">Hosting Instan & Aman</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-5 leading-relaxed relative z-10 font-sans">
                  Website Anda akan diunggah ke cloud global Netlify dan dapat diakses publik dengan performa tinggi secara gratis.
                </p>

                {/* Netlify Account customization */}
                <div className="bg-[#FAF9F6] border border-gray-150/60 rounded-2xl p-4.5 mb-6 relative z-10 text-left shadow-sm">
                  <h4 className="text-xs font-bold text-gray-850 mb-1 flex items-center gap-1.5 font-sans">
                    <Key className="w-3.5 h-3.5 text-teal-650" /> Token Netlify Pribadi (Opsional)
                  </h4>
                  <p className="text-[11px] text-gray-400 mb-3.5 leading-relaxed font-sans">
                    Masukkan token Netlify Anda agar website dideploy langsung ke akun Netlify pribadi Anda. Jika dikosongkan, deploy akan menggunakan akun bawaan kami.
                  </p>
                  
                  <input
                    type="password"
                    placeholder="Contoh: ntp_aB1cD2eF3gH4..."
                    value={customNetlifyToken}
                    onChange={(e) => setCustomNetlifyToken(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-mono text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all shadow-inner"
                  />
                  
                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Tersimpan aman di browser perangkat Anda.</span>
                    <a 
                      href="https://app.netlify.com/user/applications#personal-access-tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-teal-650 hover:text-teal-700 hover:underline font-semibold font-sans flex items-center gap-0.5"
                    >
                      Dapatkan Token ↗
                    </a>
                  </div>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all font-sans"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePublish}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm font-sans"
                  >
                    Mulai Deploy
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {publishedUrl && (
            <div className="fixed inset-0 bg-black/45 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white border border-gray-100 rounded-[24px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-250"
              >
                {/* Background glow effects */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/30">
                    <Check className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 leading-none">
                      Website Berhasil Publik!
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-sans">Deployment Selesai</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-5 leading-relaxed font-sans">
                  Website Anda sudah aktif online di internet dan dapat diakses secara publik menggunakan link berikut.
                </p>

                {/* URL container */}
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-155 rounded-xl mb-5 shadow-inner">
                  <span className="text-xs font-mono text-gray-650 truncate max-w-[70%] select-all px-1">
                    {publishedUrl}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-lg shadow-sm transition-all shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-sans">Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span className="font-sans">Salin Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Netlify Status Badge */}
                {isNetlify ? (
                  <div className="mb-6 p-3 bg-teal-50/80 border border-teal-100/50 rounded-xl flex items-start gap-2.5 shadow-sm">
                    <Zap className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[11px] text-teal-800 leading-relaxed font-sans">
                      <strong className="font-semibold text-teal-900">Infrastruktur Netlify:</strong> Website dideploy langsung ke jaringan global CDN Netlify yang aman, cepat, dan memiliki performa maksimal.
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 p-3 bg-amber-50/80 border border-amber-100/50 rounded-xl flex items-start gap-2.5 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-850 leading-relaxed font-sans">
                      <strong className="font-semibold text-amber-900 font-sans">Mode Preview Publik:</strong> Website dideploy menggunakan server lokal Fluxel sementara. Tambahkan <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-semibold text-[10px]">NETLIFY_TOKEN</code> di Settings (Secrets) untuk mendapatkan domain permanen Netlify Anda secara otomatis!
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setPublishedUrl(null)}
                    className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold transition-all font-sans"
                  >
                    Kembali
                  </button>
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm font-sans"
                  >
                    Buka Link <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error Notification */}
        {publishError && (
          <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-sm z-[110] flex items-start gap-3 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-red-900 mb-0.5">Gagal Mempublikasikan</h4>
              <p className="text-xs text-red-700 leading-relaxed">{publishError}</p>
              <button 
                onClick={() => setPublishError(null)}
                className="text-[10px] font-bold text-red-900 underline mt-1 block"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
