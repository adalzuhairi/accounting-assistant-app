import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  AlertCircle, 
  File, 
  FileText,
  UserPlus
} from "lucide-react";

type ActivityType = "success" | "warning" | "info" | "purple";

interface ActivityItemProps {
  type: ActivityType;
  title: string;
  description: string;
  date: string;
}

export function ActivityItem({ type, title, description, date }: ActivityItemProps) {
  // Define styling for different activity types
  const iconStyles: Record<ActivityType, { bg: string; text: string; icon: React.ReactNode }> = {
    success: {
      bg: "bg-green-100",
      text: "text-green-600",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    warning: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    info: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      icon: <File className="h-4 w-4" />,
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      icon: <UserPlus className="h-4 w-4" />,
    },
  };

  const style = iconStyles[type];

  return (
    <div className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition duration-150">
      <div className={cn("p-2 rounded-full mr-3", style.bg)}>
        <div className={style.text}>{style.icon}</div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{date}</p>
      </div>
    </div>
  );
}
