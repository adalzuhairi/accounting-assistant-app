import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent" | "warning";
  valuePrefix?: string;
  negative?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  color,
  valuePrefix = "$",
  negative = false,
}: StatsCardProps) {
  // Determine change direction
  const isPositiveChange = negative ? change < 0 : change > 0;
  
  // Function to format monetary values
  const formatValue = (val: number) => {
    if (valuePrefix) {
      return `${valuePrefix}${val.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return val.toLocaleString();
  };
  
  // Map color prop to border and icon background colors
  const colorStyles = {
    primary: {
      border: "border-primary",
      bg: "bg-blue-100",
      text: "text-primary",
    },
    secondary: {
      border: "border-secondary",
      bg: "bg-green-100",
      text: "text-secondary",
    },
    accent: {
      border: "border-accent",
      bg: "bg-indigo-100",
      text: "text-accent",
    },
    warning: {
      border: "border-yellow-500",
      bg: "bg-yellow-100",
      text: "text-yellow-500",
    },
  };
  
  const selectedColorStyle = colorStyles[color];

  return (
    <Card className={cn("border-l-4", selectedColorStyle.border)}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{formatValue(value)}</h3>
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-sm flex items-center",
                isPositiveChange ? "text-green-500" : "text-red-500"
              )}>
                {isPositiveChange ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
          <div className={cn("p-3 rounded-full", selectedColorStyle.bg)}>
            <div className={selectedColorStyle.text}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
