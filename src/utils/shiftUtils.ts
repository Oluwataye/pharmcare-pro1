
export type ShiftName = 'Morning' | 'Afternoon' | 'Night';

export interface ShiftInfo {
    name: ShiftName;
    startTime: string;
    endTime: string;
    isCurrent: boolean;
}

/**
 * Duty Shift Schedule:
 * Morning: 7:00 AM – 3:00 PM (07:00 - 15:00)
 * Afternoon: 3:01 PM – 9:00 PM (15:01 - 21:00)
 * Night: 9:01 PM – 6:59 AM (21:01 - 06:59)
 */
export const SHIFTS: Record<ShiftName, { start: number; end: number }> = {
    Morning: { start: 7, end: 15 },    // 07:00 - 15:00
    Afternoon: { start: 15.01, end: 21 }, // 15:01 - 21:00
    Night: { start: 21.01, end: 7 }    // 21:01 - 07:00 (Next day)
};

export const getCurrentShift = (date: Date = new Date()): ShiftName => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeValue = hours + (minutes / 60);

    if (timeValue >= 7 && timeValue <= 15) {
        return 'Morning';
    } else if (timeValue > 15 && timeValue <= 21) {
        return 'Afternoon';
    } else {
        return 'Night';
    }
};

export const getShiftDisplayName = (shift: ShiftName): string => {
    switch (shift) {
        case 'Morning': return 'Morning Shift (7am-3pm)';
        case 'Afternoon': return 'Afternoon Shift (3pm-9pm)';
        case 'Night': return 'Night Shift (9pm-7am)';
    }
};
