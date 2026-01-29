'use client';

import { Search, MapPin, Briefcase, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string, location: string, jobType: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query, location, jobType);
  };

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote'];

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-col md:flex-row gap-2 items-stretch">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl md:bg-transparent min-w-0">
          <Search className="h-5 w-5 text-indigo-600 flex-shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Job title, keywords, or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-gray-700 bg-transparent min-w-0"
            aria-label="Search for jobs"
          />
        </div>

        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl md:bg-transparent min-w-0">
          <MapPin className="h-5 w-5 text-indigo-600 flex-shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="City, state, or remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 outline-none text-gray-700 bg-transparent min-w-0"
            aria-label="Location"
          />
        </div>

        <div className="flex-1 relative min-w-0">
          <div 
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl md:bg-transparent cursor-pointer h-full"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Briefcase className="h-5 w-5 text-indigo-600 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-gray-700 truncate">{jobType || 'All job types'}</span>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                {jobTypes.map((type) => (
                  <div
                    key={type}
                    onClick={() => {
                      setJobType(type === 'All job types' ? '' : type);
                      setShowDropdown(false);
                    }}
                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-gray-700 hover:text-indigo-600 transition"
                  >
                    {type}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-semibold shadow-lg hover:shadow-xl whitespace-nowrap flex-shrink-0"
          aria-label="Search jobs"
        >
          Search
        </button>
      </div>
    </form>
  );
}
