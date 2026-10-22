'use client';
import React, { useState, useRef } from 'react';
import { Search, Mic, MicOff, Image, X, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface VoiceImageSearchProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function VoiceImageSearch({ searchQuery, setSearchQuery }: VoiceImageSearchProps) {
  const { t } = useLang();
  const [listening, setListening] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'voice' | 'image'>('text');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser. Please use Chrome.');
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setSearchMode('voice');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setListening(false);
      setSearchMode('text');
    };

    recognition.onerror = () => {
      setListening(false);
      setSearchMode('text');
    };

    recognition.onend = () => {
      setListening(false);
      setSearchMode('text');
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    setSearchMode('text');
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setImagePreview(url);
      setSearchMode('image');
      setProcessing(true);

      // Extract search terms from image: use the filename as a fallback query
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTimeout(() => {
        setSearchQuery(searchQuery ? `${searchQuery} ${baseName}` : baseName);
        setProcessing(false);
        setSearchMode('text');
        setImagePreview(null);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setSearchMode('text');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className="relative flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition">
      <Search size={16} className="text-gray-400 shrink-0" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by name, fabric, or style..."
        className="flex-1 min-w-0 border-none outline-none text-sm bg-transparent text-gray-800 placeholder:text-gray-400"
      />
      {processing && (
        <Loader2 size={14} className="animate-spin text-emerald-600 shrink-0" />
      )}
      {searchQuery && !processing && (
        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
          <X size={14} />
        </button>
      )}
      <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1.5 ml-0.5">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          className="hidden"
          id="voice-image-search-input"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
          title="Search by image"
        >
          <Image size={16} />
        </button>
        <button
          type="button"
          onClick={listening ? stopVoice : startVoice}
          className={`p-1.5 rounded-lg transition ${
            listening
              ? 'text-red-500 bg-red-50 animate-pulse'
              : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
          }`}
          title={listening ? 'Stop listening' : 'Search by voice'}
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>
      {imagePreview && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-10 flex items-center gap-2">
          <img src={imagePreview} alt="Search" className="w-10 h-10 object-cover rounded border border-gray-100" />
          <span className="text-[11px] text-gray-500">Searching by image...</span>
          <button onClick={clearImage} className="ml-auto text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}