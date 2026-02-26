import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Modern custom dropdown to replace native <select> elements.
 *
 * Props:
 *   value        — currently selected string value
 *   onChange     — (value: string) => void
 *   options      — string[] list of options
 *   placeholder  — text shown when nothing is selected (default: 'Select…')
 *   allowCustom  — if true, shows a text input so user can type a new value
 *   className    — extra classes on the trigger button
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  allowCustom = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery]   = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = (val) => { onChange(val); setOpen(false); setQuery(''); };

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white hover:border-orange-400 focus:border-orange-400 transition text-left ${className}`}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          {(allowCustom || options.length > 6) && (
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && query.trim()) {
                    if (allowCustom) choose(query.trim());
                    else if (filtered[0]) choose(filtered[0]);
                  }
                }}
                placeholder={allowCustom ? 'Type or search…' : 'Search…'}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-orange-400"
              />
            </div>
          )}
          <ul className="py-1 max-h-52 overflow-y-auto">
            {filtered.length === 0 && !allowCustom && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No options</li>
            )}
            {filtered.map(opt => (
              <li
                key={opt}
                onClick={() => choose(opt)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-orange-50 transition ${
                  value === opt ? 'text-orange-600 font-semibold bg-orange-50/50' : 'text-gray-700'
                }`}
              >
                <Check size={13} className={value === opt ? 'opacity-100 text-orange-500' : 'opacity-0'} />
                {opt}
              </li>
            ))}
            {allowCustom && query.trim() && !options.includes(query.trim()) && (
              <li
                onClick={() => choose(query.trim())}
                className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-orange-50 transition text-orange-500 font-medium border-t border-gray-50"
              >
                <span className="text-base leading-none">+</span> Add &quot;{query.trim()}&quot;
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
