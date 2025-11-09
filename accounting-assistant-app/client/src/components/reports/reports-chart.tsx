import { useMemo } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface ChartData {
  name: string;
  revenue?: string | number;
  expenses?: string | number;
  payments?: string | number;
  [key: string]: any;
}

interface ReportsChartProps {
  data: ChartData[];
  type: "bar" | "pie";
}

// Custom tooltip component for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 border shadow-sm bg-white">
        <CardContent className="p-2">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p 
              key={`tooltip-${index}`} 
              className="text-sm" 
              style={{ color: entry.color }}
            >
              {entry.name}: ${Number(entry.value).toLocaleString()}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  return null;
};

// Custom tooltip component for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 border shadow-sm bg-white">
        <CardContent className="p-2">
          <p className="font-medium text-sm">{payload[0].name}</p>
          <p 
            className="text-sm" 
            style={{ color: payload[0].payload.fill }}
          >
            ${Number(payload[0].value).toLocaleString()} ({payload[0].payload.percentage}%)
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export function ReportsChart({ data, type }: ReportsChartProps) {
  // Format y-axis values with $ prefix
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${value / 1000}k`;
    }
    return `$${value}`;
  };

  // Prepare pie chart data
  const pieData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Calculate total revenue and expenses
    const totalRevenue = data.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const totalExpenses = data.reduce((sum, item) => sum + Number(item.expenses || 0), 0);
    const totalPayments = data.reduce((sum, item) => sum + Number(item.payments || 0), 0);
    
    // Calculate net profit
    const netProfit = totalRevenue - totalExpenses;
    
    // Calculate percentages
    const calculatePercentage = (value: number, total: number) => {
      return ((value / total) * 100).toFixed(1);
    };
    
    return [
      {
        name: "Revenue",
        value: totalRevenue,
        percentage: calculatePercentage(totalRevenue, totalRevenue + totalExpenses),
        fill: "hsl(var(--chart-1))"
      },
      {
        name: "Expenses",
        value: totalExpenses,
        percentage: calculatePercentage(totalExpenses, totalRevenue + totalExpenses),
        fill: "hsl(var(--chart-4))"
      },
      {
        name: "Payments",
        value: totalPayments,
        percentage: calculatePercentage(totalPayments, totalRevenue + totalExpenses),
        fill: "hsl(var(--chart-2))"
      },
      {
        name: "Net Profit",
        value: netProfit > 0 ? netProfit : 0,
        percentage: calculatePercentage(netProfit > 0 ? netProfit : 0, totalRevenue + totalExpenses),
        fill: "hsl(var(--chart-3))"
      }
    ];
  }, [data]);

  // Custom colors for the pie chart
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))"
  ];

  // Render the appropriate chart based on the type prop
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            tickFormatter={formatYAxis}
            tickLine={false}
            axisLine={false}
            className="text-xs text-muted-foreground"
          />
          <Tooltip content={<CustomBarTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => <span className="text-sm capitalize">{value}</span>}
          />
          <Bar 
            dataKey="revenue" 
            name="Revenue" 
            fill="hsl(var(--chart-1))" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="expenses" 
            name="Expenses" 
            fill="hsl(var(--chart-4))" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="payments" 
            name="Payments" 
            fill="hsl(var(--chart-2))" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    );
  } else if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percentage }) => `${name}: ${percentage}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend 
            formatter={(value) => <span className="text-sm capitalize">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
