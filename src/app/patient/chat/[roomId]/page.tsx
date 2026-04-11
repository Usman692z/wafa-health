'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { sendMessage, subscribeMessages } from '@/lib/firestore';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime } from '@/lib/utils';
import { Send, Image, File, Loader2, ArrowLeft, Phone, Video } from 'lucide-react';
import Link from 'next/link';
import type { ChatMessage } from '@/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeMessages(roomId, setMessages);
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !profile || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await sendMessage(roomId, {
        roomId,
        senderId: profile.uid,
        senderName: profile.name,
        senderRole: profile.role,
        type: 'text',
        content: text,
        isRead: false,
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `chat/${roomId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const isImage = file.type.startsWith('image/');
      await sendMessage(roomId, {
        roomId,
        senderId: profile.uid,
        senderName: profile.name,
        senderRole: profile.role,
        type: isImage ? 'image' : 'file',
        content: isImage ? 'Sent an image' : `Sent: ${file.name}`,
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        isRead: false,
      });
    } finally {
      setUploading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <Link href="/patient/chat" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Avatar name="Doctor" size="sm" online={true} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Consultation Chat</p>
          <p className="text-xs text-green-500">Active</p>
        </div>
        <Link href={`/video-call/video_${roomId}`} className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
          <Video className="w-5 h-5" />
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Start the conversation. Say hello 👋
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === profile?.uid;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && <Avatar name={msg.senderName} size="xs" />}
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {msg.type === 'text' && (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                    {msg.content}
                  </div>
                )}
                {msg.type === 'image' && (
                  <div className={`rounded-2xl overflow-hidden ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                    <img src={msg.fileUrl} alt="Sent image" className="max-w-xs rounded-2xl" />
                  </div>
                )}
                {msg.type === 'file' && (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                    <File className="w-4 h-4" />
                    <span className="truncate max-w-40">{msg.fileName}</span>
                  </a>
                )}
                {msg.type === 'system' && (
                  <div className="text-center text-xs text-slate-400 italic px-4">{msg.content}</div>
                )}
                <span className="text-xs text-slate-400 px-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
        <label className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors">
          <Image className="w-5 h-5" />
          <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
        </label>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={uploading}
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending || uploading}
          className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {sending || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
