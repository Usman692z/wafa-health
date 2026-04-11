'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Search } from 'lucide-react';

interface ChatRoomItem {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  otherName: string;
}

export default function ChatListPage() {
  const { profile } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, COLLECTIONS.CHAT_ROOMS),
      where('participants', 'array-contains', profile.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const r = d.data();
        return {
          id: d.id,
          participants: r.participants,
          lastMessage: r.lastMessage,
          lastMessageAt: r.lastMessageAt?.toDate(),
          otherName: 'Doctor',
        };
      });
      setRooms(data.sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, [profile?.uid]);

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input placeholder="Search conversations..." className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No conversations yet</p>
          <Link href="/patient/doctors" className="mt-2 inline-block text-sm text-blue-500 hover:underline">Book a consultation</Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {rooms.map((room) => (
            <Link key={room.id} href={`/patient/chat/${room.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <Avatar name={room.otherName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm">{room.otherName}</p>
                <p className="text-xs text-slate-500 truncate">{room.lastMessage || 'Start a conversation'}</p>
              </div>
              {room.lastMessageAt && (
                <span className="text-xs text-slate-400 shrink-0">
                  {formatDistanceToNow(room.lastMessageAt, { addSuffix: false })}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
