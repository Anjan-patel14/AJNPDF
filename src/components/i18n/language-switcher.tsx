'use client';

import { Check, Languages } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { language, languages, setLanguage, t } = useLanguage();
  const current = languages.find((item) => item.code === language) ?? languages[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" className={cn('h-10 rounded-xl px-2.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700', className)} aria-label={`${t('common.language')}: ${current.native}`}>
          <Languages className="h-[18px] w-[18px]" />
          {!compact && <span className="ml-2 hidden text-xs font-extrabold sm:inline">{current.native}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[190px] rounded-2xl p-2">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-black">{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((item) => (
          <DropdownMenuItem key={item.code} onSelect={() => setLanguage(item.code)} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold">
            <span>{item.native}</span>
            {language === item.code && <Check className="h-4 w-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
