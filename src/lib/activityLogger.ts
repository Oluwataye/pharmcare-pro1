import { toast } from "@/hooks/use-toast";
import { UserRole } from "./types";

type ActivityType = 'LOGIN' | 'LOGOUT' | 'INVENTORY_UPDATE' | 'SALE' | 'USER_MANAGEMENT';

interface ActivityLog {
  type: ActivityType;
  description: string;
  userId: string;
  userRole: UserRole;
  timestamp: string;
}

export const logActivity = (
  type: ActivityType,
  description: string,
  userId: string,
  userRole: UserRole
): ActivityLog => {
  const activity = {
    type,
    description,
    userId,
    userRole,
    timestamp: new Date().toISOString(),
  };

  // In a real app, this would be sent to a backend
  console.log('Activity logged:', activity);
  return activity;
};