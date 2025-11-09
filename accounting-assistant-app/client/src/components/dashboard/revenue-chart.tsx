import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface RevenueChartProps {
  timePeriod: string;
}

// Sample data for demonstration
const generateData = (days: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    
    // Generate random data for demonstration
    const revenue = Math.floor(Math.random() * 5000) + 1000;
    const expenses = Math.floor(revenue * (0.6 + Math.random() * 0.2));
    
    data.push({
      name: `${month} ${day}`,
      revenue,
      expenses
    });
  }
  
  return data;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 border shadow-sm bg-white">
        <CardContent className="p-2">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-sm text-primary">
            Revenue: ${Number(payload[0].value).toLocaleString()}
          </p>
          <p className="text-sm text-destructive">
            Expenses: ${Number(payload[1].value).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export function RevenueChart({ timePeriod }: RevenueChartProps) {
  const data = generateData(Number(timePeriod));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
          tickLine={false}
          axisLine={false}
          className="text-xs text-muted-foreground"
        />
        <YAxis 
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          tickLine={false}
          axisLine={false}
          className="text-xs text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          height={36}
          formatter={(value) => <span className="text-sm capitalize">{value}</span>}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke="hsl(var(--destructive))"
          fill="hsl(var(--destructive))"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
