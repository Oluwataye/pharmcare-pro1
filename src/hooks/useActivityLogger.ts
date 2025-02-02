import { logActivity } from "@/lib/activityLogger";
import { User } from "@/lib/types";

export const useActivityLogger = () => {
  const logUserActivity = (
    action: 'LOGIN' | 'LOGOUT',
    user: User | null
  ) => {
    if (user) {
      logActivity(
        action,
        `User ${user.name} ${action.toLowerCase()}ed`,
        user.id,
        user.role
      );
    }
  };

  return { logUserActivity };
};