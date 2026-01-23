import { DesignSettings } from '../types';

export const getDesignClasses = (design: DesignSettings) => {
  const palettes = {
    blue: {
      primary: 'text-blue-900',
      accent: 'bg-blue-600',
      accentText: 'text-blue-600',
      accentHover: 'hover:bg-blue-700',
      surface: 'bg-blue-50',
      surfaceDark: 'bg-slate-900',
      border: 'border-blue-100',
      softBg: 'bg-white',
      gradient: 'from-blue-50 to-white'
    },
    green: {
      primary: 'text-emerald-900',
      accent: 'bg-emerald-600',
      accentText: 'text-emerald-600',
      accentHover: 'hover:bg-emerald-700',
      surface: 'bg-emerald-50',
      surfaceDark: 'bg-emerald-950',
      border: 'border-emerald-100',
      softBg: 'bg-[#fafdfb]',
      gradient: 'from-emerald-50 to-white'
    },
    rose: {
      primary: 'text-rose-900',
      accent: 'bg-rose-500',
      accentText: 'text-rose-600',
      accentHover: 'hover:bg-rose-600',
      surface: 'bg-rose-50',
      surfaceDark: 'bg-rose-950',
      border: 'border-rose-100',
      softBg: 'bg-white',
      gradient: 'from-rose-50 to-white'
    },
    indigo: {
      primary: 'text-indigo-950',
      accent: 'bg-indigo-600',
      accentText: 'text-indigo-600',
      accentHover: 'hover:bg-indigo-700',
      surface: 'bg-indigo-50',
      surfaceDark: 'bg-indigo-950',
      border: 'border-indigo-100',
      softBg: 'bg-white',
      gradient: 'from-indigo-50 to-white'
    },
    slate: {
      primary: 'text-slate-900',
      accent: 'bg-slate-900',
      accentText: 'text-slate-600',
      accentHover: 'hover:bg-slate-700',
      surface: 'bg-slate-50',
      surfaceDark: 'bg-black',
      border: 'border-slate-200',
      softBg: 'bg-white',
      gradient: 'from-gray-100 to-white'
    }
  };

  const secondaries = {
    orange: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', light: 'bg-orange-50' },
    teal: { text: 'text-teal-500', bg: 'bg-teal-500', border: 'border-teal-500', light: 'bg-teal-50' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500', light: 'bg-purple-50' },
    gold: { text: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500', light: 'bg-yellow-50' },
    gray: { text: 'text-gray-500', bg: 'bg-gray-500', border: 'border-gray-500', light: 'bg-gray-100' }
  };

  const typography = {
    'sans': { 
      head: 'font-sans font-bold tracking-tight', 
      body: 'font-sans font-normal text-gray-600',
      hero: 'text-3xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter'
    },
    'serif-sans': { 
      head: 'font-serif font-semibold tracking-tight', 
      body: 'font-sans font-light text-gray-600',
      hero: 'font-serif text-3xl md:text-6xl italic'
    },
    'mono-sans': { 
      head: 'font-mono font-bold tracking-tighter uppercase', 
      body: 'font-sans text-gray-600',
      hero: 'font-mono text-3xl md:text-5xl'
    },
  };

  const radiuses = {
    'none': { btn: 'rounded-none', box: 'rounded-none' },
    'medium': { btn: 'rounded-lg', box: 'rounded-xl' },
    'full': { btn: 'rounded-full', box: 'rounded-3xl' },
  };

  return {
    p: palettes[design.colorPalette],
    s: secondaries[design.secondaryColor || 'gray'],
    t: typography[design.fontPairing],
    r: radiuses[design.borderRadius],
  };
};