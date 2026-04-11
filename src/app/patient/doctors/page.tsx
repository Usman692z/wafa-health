'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDoctors } from '@/lib/firestore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatPKR } from '@/lib/utils';
import { Search, MapPin, Star, Clock, Filter, Video, MessageSquare, ChevronRight, X, Loader2 } from 'lucide-react';
import type { DoctorProfile } from '@/types';

const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician',
  'Gynecologist / Obstetrician', 'Neurologist', 'Orthopedic Surgeon', 'Psychiatrist',
  'ENT Specialist', 'Ophthalmologist', 'Urologist', 'Gastroenterologist',
];

const CITIES = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

export default function FindDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [filtered, setFiltered] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState<'rating' | 'fee_asc' | 'fee_desc' | 'experience'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getDoctors({ isApproved: true }).then((data) => {
      setDoctors(data);
      setFiltered(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...doctors];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q)
      );
    }

    if (selectedSpec !== 'All') result = result.filter((d) => d.specialization === selectedSpec);
    if (selectedCity !== 'All Cities') result = result.filter((d) => d.city === selectedCity);

    result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'fee_asc') return a.consultationFee - b.consultationFee;
      if (sortBy === 'fee_desc') return b.consultationFee - a.consultationFee;
      if (sortBy === 'experience') return b.experience - a.experience;
      return 0;
    });

    setFiltered(result);
  }, [search, selectedSpec, selectedCity, sortBy, doctors]);

  return (
    <div className="max-w-6xl space-y-5">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors, specializations, cities..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-blue-300 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Specialization</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSpec(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedSpec === s
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">City</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedCity === c
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sort By</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'rating', label: 'Top Rated' },
                { value: 'fee_asc', label: 'Lowest Fee' },
                { value: 'fee_desc', label: 'Highest Fee' },
                { value: 'experience', label: 'Most Experienced' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value as typeof sortBy)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    sortBy === s.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading...' : `${filtered.length} doctor${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No doctors found. Try different filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor.uid} doctor={doctor} onBook={() => router.push(`/patient/doctors/${doctor.uid}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorCard({ doctor, onBook }: { doctor: DoctorProfile; onBook: () => void }) {
  return (
    <div
      onClick={onBook}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer transition-all"
    >
      <div className="flex items-start gap-4">
        <Avatar name={doctor.name} src={doctor.avatar} size="lg" online={doctor.isOnline} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Dr. {doctor.name}</h3>
              <p className="text-xs text-blue-500 font-medium">{doctor.specialization}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-500 shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{doctor.rating?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-slate-400">({doctor.totalReviews || 0})</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3" /> {doctor.city}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" /> {doctor.experience} yr exp
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {doctor.qualifications?.slice(0, 2).map((q) => (
              <Badge key={q} variant="info" className="text-xs">{q}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatPKR(doctor.consultationFee)}</span>
          <span className="text-xs text-slate-400 ml-1">/ consultation</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-100 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors">
            <Video className="w-3.5 h-3.5" /> Book
          </button>
        </div>
      </div>
    </div>
  );
}
