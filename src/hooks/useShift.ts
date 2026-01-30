
import { useShiftContext } from "@/contexts/ShiftContext";

export { type StaffShift } from "@/contexts/ShiftContext";

export const useShift = () => {
    return useShiftContext();
};
