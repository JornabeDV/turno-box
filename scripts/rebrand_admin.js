const fs = require('fs');
const path = require('path');

const dirs = [
  'src/components/admin',
  'src/app/dashboard/admin',
  'src/app/dashboard/coach',
  'src/components/layout',
];

const replacements = [
  ['bg-[#0f0f0f]', 'bg-[#0A1F2A]'],
  ['border-white/[0.06]', 'border-[#1A4A63]'],
  ['border-white/[0.04]', 'border-[#1A4A63]'],
  ['border-white/[0.08]', 'border-[#1A4A63]'],
  ['divide-white/[0.04]', 'divide-[#1A4A63]'],
  ['bg-zinc-800/60', 'bg-[#0A1F2A]'],
  ['bg-zinc-800', 'bg-[#0E2A38]'],
  ['bg-zinc-900', 'bg-[#0A1F2A]'],
  ['border-zinc-700', 'border-[#1A4A63]'],
  ['border-zinc-600', 'border-[#6B8A99]'],
  ['border-zinc-500/20', 'border-[#F78837]/20'],
  ['border-zinc-500/30', 'border-[#F78837]/30'],
  ['text-zinc-100', 'text-[#EAEAEA]'],
  ['text-zinc-200', 'text-[#EAEAEA]'],
  ['text-zinc-300', 'text-[#EAEAEA]'],
  ['text-zinc-400', 'text-[#6B8A99]'],
  ['text-zinc-500', 'text-[#6B8A99]'],
  ['text-zinc-600', 'text-[#4A6B7A]'],
  ['text-zinc-700', 'text-[#4A6B7A]'],
  ['hover:bg-zinc-700', 'hover:bg-[#143D52]'],
  ['hover:bg-zinc-800/60', 'hover:bg-[#143D52]'],
  ['hover:bg-zinc-800', 'hover:bg-[#143D52]'],
  ['focus:border-orange-500', 'focus:border-[#F78837]'],
  ['focus:ring-1 focus:ring-orange-500', ''],
  ['bg-orange-500/10', 'bg-[#F78837]/10'],
  ['bg-orange-500/15', 'bg-[#F78837]/15'],
  ['border-orange-500/20', 'border-[#F78837]/20'],
  ['text-orange-400', 'text-[#F78837]'],
  ['text-orange-300', 'text-[#F78837]'],
  ['text-orange-500', 'text-[#F78837]'],
  ['hover:bg-orange-500/15', 'hover:bg-[#F78837]/15'],
  ['hover:text-orange-400', 'hover:text-[#F78837]'],
  ['hover:text-orange-500', 'hover:text-[#F78837]'],
  ['hover:bg-orange-400', 'hover:bg-[#E07A2E]'],
  ['bg-orange-500', 'bg-[#F78837]'],
  ['text-emerald-400', 'text-[#27C7B8]'],
  ['text-emerald-500', 'text-[#27C7B8]'],
  ['bg-emerald-500/10', 'bg-[#27C7B8]/10'],
  ['border-emerald-500/20', 'border-[#27C7B8]/20'],
  ['bg-emerald-500', 'bg-[#27C7B8]'],
  ['hover:bg-emerald-500/20', 'hover:bg-[#27C7B8]/20'],
  ['text-emerald-300', 'text-[#27C7B8]'],
  ['text-rose-400', 'text-[#E61919]'],
  ['text-rose-500', 'text-[#E61919]'],
  ['bg-rose-500/10', 'bg-[#E61919]/10'],
  ['border-rose-500/20', 'border-[#E61919]/20'],
  ['bg-rose-500', 'bg-[#E61919]'],
  ['hover:text-rose-400', 'hover:text-[#E61919]'],
  ['hover:bg-rose-500/10', 'hover:bg-[#E61919]/10'],
  ['hover:bg-rose-500/20', 'hover:bg-[#E61919]/20'],
  ['text-amber-400', 'text-[#F78837]'],
  ['text-amber-500', 'text-[#F78837]'],
  ['bg-amber-500/10', 'bg-[#F78837]/10'],
  ['border-amber-500/20', 'border-[#F78837]/20'],
  ['bg-amber-500', 'bg-[#F78837]'],
  ['hover:bg-amber-500/15', 'hover:bg-[#F78837]/15'],
  ['glass-card', 'bg-[#0E2A38] border border-[#1A4A63]'],
  ['glass-interactive', ''],
  [' shadow-xl', ''],
  ['shadow-xl', ''],
  ['backdrop-blur-sm', ''],
  ['backdrop-blur-xl', ''],
  ['placeholder:text-zinc-600', 'placeholder:text-[#4A6B7A]'],
  ['rounded-2xl p-5', 'p-5'],
  ['rounded-2xl p-4', 'p-4'],
  ['rounded-2xl p-6', 'p-6'],
  ['rounded-2xl p-3', 'p-3'],
  ['rounded-2xl px-4', 'px-4'],
  ['rounded-2xl overflow-hidden', 'overflow-hidden'],
  ['rounded-2xl', ''],
  ['rounded-xl p-5', 'p-5'],
  ['rounded-xl p-4', 'p-4'],
  ['rounded-xl p-3', 'p-3'],
  ['rounded-xl px-4', 'px-4'],
  ['rounded-xl', 'rounded-[2px]'],
  ['rounded-lg', 'rounded-[2px]'],
  ['hover:text-zinc-200', 'hover:text-[#EAEAEA]'],
  ['hover:text-zinc-100', 'hover:text-[#EAEAEA]'],
  ['hover:text-zinc-300', 'hover:text-[#EAEAEA]'],
  ['focus-visible:ring-orange-500', 'focus-visible:ring-[#F78837]'],
  ['focus-visible:ring-offset-zinc-900', 'focus-visible:ring-offset-[#0A1F2A]'],
];

let filesProcessed = 0;

for (const d of dirs) {
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.tsx')) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        const original = content;
        for (const [old, new_] of replacements) {
          content = content.split(old).join(new_);
        }
        // Clean up double spaces
        content = content.replace(/  +/g, ' ');
        content = content.replace(/\( /g, '(');
        content = content.replace(/ \)/g, ')');
        if (content !== original) {
          fs.writeFileSync(fullPath, content, 'utf-8');
          filesProcessed++;
          console.log('Updated:', fullPath);
        }
      }
    }
  };
  if (fs.existsSync(d)) walk(d);
}

console.log('\nTotal files updated:', filesProcessed);
