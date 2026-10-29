import React from 'react';

interface CharacterAvatarProps {
  name: 'sofia' | 'amina' | 'alex' | 'jamie' | 'taylor';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  name,
  size = 'md',
  showBadge = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const getCharacterMeta = () => {
    switch (name) {
      case 'sofia':
        return {
          displayName: 'Sofia',
          role: 'Spain · Roommate',
          bgColor: 'bg-amber-100 border-amber-300',
          badgeColor: 'bg-amber-600',
          svg: (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Sofia: warm friendly roommate with chestnut hair and coral hoodie */}
              <circle cx="50" cy="50" r="48" fill="#FEF3C7" />
              {/* Hoodie */}
              <path d="M20 95 C20 72 32 66 50 66 C68 66 80 72 80 95 Z" fill="#F87171" />
              <path d="M42 67 L50 78 L58 67 Z" fill="#FEE2E2" />
              {/* Neck */}
              <rect x="44" y="55" width="12" height="15" rx="3" fill="#FBD5BD" />
              {/* Hair Back */}
              <path d="M26 44 C24 20 76 20 74 44 C74 62 70 70 66 74 C58 70 42 70 34 74 C30 70 26 62 26 44 Z" fill="#78350F" />
              {/* Face */}
              <ellipse cx="50" cy="48" rx="20" ry="22" fill="#FCD9BD" />
              {/* Eyes */}
              <ellipse cx="43" cy="46" rx="2.5" ry="3" fill="#374151" />
              <ellipse cx="57" cy="46" rx="2.5" ry="3" fill="#374151" />
              <circle cx="44" cy="45" r="0.9" fill="#FFFFFF" />
              <circle cx="58" cy="45" r="0.9" fill="#FFFFFF" />
              {/* Cheeks */}
              <circle cx="39" cy="52" r="3.5" fill="#FCA5A5" opacity="0.6" />
              <circle cx="61" cy="52" r="3.5" fill="#FCA5A5" opacity="0.6" />
              {/* Smile */}
              <path d="M44 54 Q50 61 56 54" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Hair Front Bangs */}
              <path d="M28 38 C35 25 65 25 72 38 C68 33 58 31 50 34 C42 31 32 33 28 38 Z" fill="#78350F" />
            </svg>
          ),
        };

      case 'amina':
        return {
          displayName: 'Amina',
          role: 'Morocco · Roommate',
          bgColor: 'bg-emerald-100 border-emerald-300',
          badgeColor: 'bg-emerald-600',
          svg: (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Amina: elegant turquoise/teal headscarf and kind expression */}
              <circle cx="50" cy="50" r="48" fill="#CCFBF1" />
              {/* Scarf / Hijab wrap */}
              <path d="M20 95 C20 72 30 68 50 68 C70 68 80 72 80 95 Z" fill="#0D9488" />
              {/* Main hijab draped oval */}
              <ellipse cx="50" cy="48" rx="26" ry="30" fill="#0F766E" />
              {/* Face Opening */}
              <ellipse cx="50" cy="49" rx="17" ry="21" fill="#E2A76F" />
              {/* Eyes */}
              <ellipse cx="43" cy="48" rx="2.8" ry="3.2" fill="#1F2937" />
              <ellipse cx="57" cy="48" rx="2.8" ry="3.2" fill="#1F2937" />
              <circle cx="44.2" cy="47" r="1" fill="#FFFFFF" />
              <circle cx="58.2" cy="47" r="1" fill="#FFFFFF" />
              {/* Eyebrows */}
              <path d="M39 43 Q43 40 47 43" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M53 43 Q57 40 61 43" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              {/* Cheeks */}
              <circle cx="39" cy="54" r="3" fill="#EA580C" opacity="0.3" />
              <circle cx="61" cy="54" r="3" fill="#EA580C" opacity="0.3" />
              {/* Smile */}
              <path d="M45 56 Q50 62 55 56" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Fold highlight */}
              <path d="M30 40 Q50 24 70 40" stroke="#14B8A6" strokeWidth="2.5" fill="none" />
            </svg>
          ),
        };

      case 'alex':
        return {
          displayName: 'Alex',
          role: 'Club Member',
          bgColor: 'bg-blue-100 border-blue-300',
          badgeColor: 'bg-blue-600',
          svg: (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Alex: outgoing, campus baseball tee & lanyard */}
              <circle cx="50" cy="50" r="48" fill="#DBEAFE" />
              {/* Tee Shirt */}
              <path d="M20 95 C20 72 32 66 50 66 C68 66 80 72 80 95 Z" fill="#2563EB" />
              {/* Campus Lanyard */}
              <path d="M43 66 L50 82 L57 66" stroke="#FBBF24" strokeWidth="3" fill="none" />
              <rect x="47" y="82" width="6" height="8" rx="1.5" fill="#F59E0B" />
              {/* Neck */}
              <rect x="44" y="55" width="12" height="15" rx="3" fill="#FAD1B6" />
              {/* Hair */}
              <path d="M28 42 C28 22 72 22 72 42 C72 46 70 50 68 50 C62 30 38 30 32 50 C30 50 28 46 28 42 Z" fill="#451A03" />
              {/* Face */}
              <ellipse cx="50" cy="49" rx="19" ry="21" fill="#FAD1B6" />
              {/* Eyes */}
              <ellipse cx="43" cy="47" rx="2.5" ry="3" fill="#1E293B" />
              <ellipse cx="57" cy="47" rx="2.5" ry="3" fill="#1E293B" />
              <circle cx="44" cy="46" r="0.9" fill="#FFFFFF" />
              <circle cx="58" cy="46" r="0.9" fill="#FFFFFF" />
              {/* Big energetic smile */}
              <path d="M42 54 Q50 64 58 54 Z" fill="#BE123C" />
              {/* Teeth */}
              <path d="M44 54 Q50 57 56 54" stroke="#FFFFFF" strokeWidth="2" fill="none" />
              {/* Modern hair spiky cut */}
              <path d="M30 34 Q40 18 50 24 Q60 16 70 30 Q60 26 50 28 Q40 24 30 34 Z" fill="#451A03" />
            </svg>
          ),
        };

      case 'jamie':
        return {
          displayName: 'Jamie',
          role: 'Study Teammate',
          bgColor: 'bg-teal-100 border-teal-300',
          badgeColor: 'bg-teal-600',
          svg: (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Jamie: thoughtful teammate with round glasses and sweater */}
              <circle cx="50" cy="50" r="48" fill="#D1FAE5" />
              {/* Knit sweater */}
              <path d="M20 95 C20 72 32 66 50 66 C68 66 80 72 80 95 Z" fill="#047857" />
              <path d="M44 66 L50 74 L56 66 Z" fill="#ECFDF5" />
              {/* Neck */}
              <rect x="44" y="55" width="12" height="15" rx="3" fill="#F7D8C4" />
              {/* Hair */}
              <path d="M28 46 C25 24 75 24 72 46 C72 56 68 62 66 65 C60 60 40 60 34 65 C32 62 28 56 28 46 Z" fill="#1E293B" />
              {/* Face */}
              <ellipse cx="50" cy="49" rx="19" ry="21" fill="#F7D8C4" />
              {/* Eyeglasses */}
              <rect x="36" y="42" width="12" height="10" rx="3" fill="none" stroke="#92400E" strokeWidth="2" />
              <rect x="52" y="42" width="12" height="10" rx="3" fill="none" stroke="#92400E" strokeWidth="2" />
              <line x1="48" y1="46" x2="52" y2="46" stroke="#92400E" strokeWidth="2" />
              {/* Eyes */}
              <ellipse cx="42" cy="46" rx="2" ry="2.2" fill="#1E293B" />
              <ellipse cx="58" cy="46" rx="2" ry="2.2" fill="#1E293B" />
              {/* Smile */}
              <path d="M44 57 Q50 62 56 57" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Hair fringe */}
              <path d="M30 36 C42 26 58 26 70 36 C64 30 52 30 46 32 C40 30 34 32 30 36 Z" fill="#1E293B" />
            </svg>
          ),
        };

      case 'taylor':
        return {
          displayName: 'Taylor',
          role: 'Housing Office',
          bgColor: 'bg-purple-100 border-purple-300',
          badgeColor: 'bg-purple-600',
          svg: (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Taylor: calm, professional housing staff with official badge */}
              <circle cx="50" cy="50" r="48" fill="#F3E8FF" />
              {/* Professional navy/purple blazer */}
              <path d="M20 95 C20 72 32 66 50 66 C68 66 80 72 80 95 Z" fill="#475569" />
              {/* Collared shirt */}
              <path d="M42 66 L50 78 L58 66 Z" fill="#FFFFFF" />
              {/* ID Badge */}
              <rect x="58" y="76" width="10" height="14" rx="1.5" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
              <line x1="60" y1="80" x2="66" y2="80" stroke="#3B82F6" strokeWidth="1.5" />
              <line x1="60" y1="83" x2="66" y2="83" stroke="#94A3B8" strokeWidth="1" />
              {/* Neck */}
              <rect x="44" y="55" width="12" height="15" rx="3" fill="#FCD9BD" />
              {/* Hair bun / neat style */}
              <circle cx="50" cy="24" r="10" fill="#312E81" />
              <path d="M28 42 C28 26 72 26 72 42 C72 52 68 58 66 60 C58 56 42 56 34 60 C32 58 28 52 28 42 Z" fill="#312E81" />
              {/* Face */}
              <ellipse cx="50" cy="48" rx="19" ry="21" fill="#FCD9BD" />
              {/* Eyes */}
              <ellipse cx="43" cy="46" rx="2.5" ry="3" fill="#1E293B" />
              <ellipse cx="57" cy="46" rx="2.5" ry="3" fill="#1E293B" />
              <circle cx="44" cy="45" r="0.8" fill="#FFFFFF" />
              <circle cx="58" cy="45" r="0.8" fill="#FFFFFF" />
              {/* Kind reassuring smile */}
              <path d="M44 56 Q50 61 56 56" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          ),
        };
    }
  };

  const meta = getCharacterMeta();

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-2 overflow-hidden shadow-sm transition-transform ${meta.bgColor}`}
      >
        {meta.svg}
      </div>
      {showBadge && (
        <span
          className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs ${meta.badgeColor}`}
        >
          {meta.displayName}
        </span>
      )}
    </div>
  );
};
