import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
    value?: string | null; // format: YYYY-MM-DD
    onChange: (date: string) => void;
    id?: string;
    name?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    min?: string;
    max?: string;
    required?: boolean;
}

const MONTH_NAMES: Record<string, string[]> = {
    uz: [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Iyun',
        'Iyul',
        'Avgust',
        'Sentyabr',
        'Oktyabr',
        'Noyabr',
        'Dekabr',
    ],
    ru: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
    ],
    en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
};

const WEEKDAYS: Record<string, string[]> = {
    uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
    ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

export function DatePicker({
    value = '',
    onChange,
    id,
    name,
    placeholder = '2027-09-30',
    className,
    disabled = false,
    required = false,
}: DatePickerProps) {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [prevValue, setPrevValue] = useState(value);

    // Current viewed month and year in the calendar
    const today = new Date();
    const initialDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(value + 'T00:00:00')
        : today;

    const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

    if (value !== prevValue) {
        setPrevValue(value);
        setInputValue(value || '');
        if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const d = new Date(value + 'T00:00:00');
            if (!isNaN(d.getTime())) {
                setViewYear(d.getFullYear());
                setViewMonth(d.getMonth());
            }
        }
    }

    // Handle direct typing in the input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9-]/g, '');
        // Auto-insert hyphens if user is typing numbers continuously (e.g. 20270930 -> 2027-09-30)
        if (val.length === 8 && !val.includes('-')) {
            val = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
        }
        setInputValue(val);

        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const [y, m, d] = val.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            if (
                dateObj.getFullYear() === y &&
                dateObj.getMonth() === m - 1 &&
                dateObj.getDate() === d
            ) {
                setViewYear(y);
                setViewMonth(m - 1);
                onChange(val);
            }
        } else if (val === '') {
            onChange('');
        }
    };

    const handleSelectDay = (day: number) => {
        const yStr = String(viewYear).padStart(4, '0');
        const mStr = String(viewMonth + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        const formatted = `${yStr}-${mStr}-${dStr}`;
        setInputValue(formatted);
        onChange(formatted);
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((prev) => prev - 1);
        } else {
            setViewMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((prev) => prev + 1);
        } else {
            setViewMonth((prev) => prev + 1);
        }
    };

    // Calculate calendar days
    // Monday-first indexing (0: Mon, 1: Tue, ..., 6: Sun)
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Check if a day is currently selected
    const isSelected = (day: number) => {
        if (!value) return false;
        const [y, m, d] = value.split('-').map(Number);
        return y === viewYear && m - 1 === viewMonth && d === day;
    };

    // Check if a day is today
    const isToday = (day: number) => {
        return (
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === day
        );
    };

    // Quick presets
    const handleSetToday = () => {
        const yStr = String(today.getFullYear()).padStart(4, '0');
        const mStr = String(today.getMonth() + 1).padStart(2, '0');
        const dStr = String(today.getDate()).padStart(2, '0');
        const formatted = `${yStr}-${mStr}-${dStr}`;
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        setInputValue(formatted);
        onChange(formatted);
        setIsOpen(false);
    };

    const handleAddYears = (yearsToAdd: number) => {
        const baseDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Date(value + 'T00:00:00')
            : new Date();
        const targetYear = baseDate.getFullYear() + yearsToAdd;
        const m = baseDate.getMonth();
        const d = baseDate.getDate();

        const yStr = String(targetYear).padStart(4, '0');
        const mStr = String(m + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const formatted = `${yStr}-${mStr}-${dStr}`;

        setViewYear(targetYear);
        setViewMonth(m);
        setInputValue(formatted);
        onChange(formatted);
        setIsOpen(false);
    };

    const handleClear = () => {
        setInputValue('');
        onChange('');
        setIsOpen(false);
    };

    // Years range for dropdown (from 2022 to 2036)
    const currentYear = today.getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - 3 + i);

    const currentLang = i18n.language?.startsWith('ru')
        ? 'ru'
        : i18n.language?.startsWith('en')
          ? 'en'
          : 'uz';
    const monthNames = MONTH_NAMES[currentLang] || MONTH_NAMES.uz;
    const weekdays = WEEKDAYS[currentLang] || WEEKDAYS.uz;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div className="relative flex items-center w-full">
                <Input
                    id={id}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={cn(
                        'h-9.5 rounded-xl font-mono text-xs sm:text-sm tracking-wider pr-16',
                        className
                    )}
                />

                <div className="absolute right-1.5 flex items-center gap-1">
                    {inputValue && (
                        <button
                            type="button"
                            onClick={() => {
                                setInputValue('');
                                onChange('');
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title={t('common.clear', 'Tozalash')}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            title={t('select_date', 'Sanani tanlash')}
                        >
                            <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </Button>
                    </PopoverTrigger>
                </div>
            </div>

            <PopoverContent
                className="w-72 p-3 rounded-2xl border border-border bg-card shadow-xl z-50"
                align="start"
                sideOffset={6}
            >
                {/* 1. Header: Month & Year Controls */}
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-border">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="h-7 w-7 rounded-lg"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1.5">
                        {/* Month Select */}
                        <select
                            value={viewMonth}
                            onChange={(e) => setViewMonth(Number(e.target.value))}
                            className="h-7 text-xs font-semibold rounded-lg bg-muted/60 hover:bg-muted border-none px-2 py-0 cursor-pointer focus:ring-1 focus:ring-ring"
                        >
                            {monthNames.map((mName, idx) => (
                                <option key={idx} value={idx}>
                                    {mName}
                                </option>
                            ))}
                        </select>

                        {/* Year Select */}
                        <select
                            value={viewYear}
                            onChange={(e) => setViewYear(Number(e.target.value))}
                            className="h-7 text-xs font-semibold font-mono rounded-lg bg-muted/60 hover:bg-muted border-none px-2 py-0 cursor-pointer focus:ring-1 focus:ring-ring"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-7 w-7 rounded-lg"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {/* 2. Weekdays Header */}
                <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center text-[11px] font-semibold text-muted-foreground">
                    {weekdays.map((wd, i) => (
                        <div key={i} className="py-1">
                            {wd}
                        </div>
                    ))}
                </div>

                {/* 3. Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {/* Empty placeholder cells for previous month */}
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8 w-8" />
                    ))}

                    {/* Actual days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const active = isSelected(day);
                        const current = isToday(day);

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleSelectDay(day)}
                                className={cn(
                                    'h-8 w-8 rounded-lg text-xs font-medium font-mono transition-all duration-150 flex items-center justify-center',
                                    active
                                        ? 'bg-indigo-600 text-white font-bold shadow-xs hover:bg-indigo-700'
                                        : current
                                          ? 'border border-indigo-500 font-bold text-indigo-600 dark:text-indigo-400 hover:bg-muted'
                                          : 'text-foreground hover:bg-muted/80'
                                )}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>

                {/* 4. Quick Action Shortcuts */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-2.5 mt-2 border-t border-border/60 text-[11px]">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleSetToday}
                            className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
                        >
                            {t('today', 'Bugun')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddYears(1)}
                            className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 font-semibold transition-colors"
                            title={t('add_1_year_desc', '1 yil qo‘shish (masalan 2027)')}
                        >
                            {t('add_1_year', '+1 yil')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddYears(2)}
                            className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
                            title={t('add_2_years_desc', '2 yil qo‘shish')}
                        >
                            {t('add_2_years', '+2 yil')}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-2 py-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        {t('common.clear', 'Tozalash')}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
