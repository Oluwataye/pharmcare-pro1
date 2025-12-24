
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  route: string;
  onClick: (route: string) => void;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp, route, onClick }: StatCardProps) => (
  <Card 
    className="relative overflow-hidden transition-all hover:shadow-lg cursor-pointer"
    onClick={() => onClick(route)}
  >
    <CardContent className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-xl md:text-2xl font-bold">{value}</p>
          <span
            className={`inline-flex items-center text-sm font-medium ${
              trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend}
          </span>
        </div>
        <div className="relative z-10">
          <Icon className="h-6 md:h-8 w-6 md:w-8 text-primary opacity-75" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
    </CardContent>
  </Card>
);

interface AdminStatsProps {
  onCardClick: (route: string) => void;
}

export const AdminStats = ({ onCardClick }: AdminStatsProps) => {
  const stats = [
    {
      title: "Today's Sales",
      value: "₦1,234",
      icon: TrendingUp,
      trend: "+12.5%",
      trendUp: true,
      route: "/sales",
    },
    {
      title: "Low Stock Items",
      value: "23",
      icon: AlertTriangle,
      trend: "+5",
      trendUp: false,
      route: "/inventory",
    },
    {
      title: "Total Products",
      value: "1,456",
      icon: Package,
      trend: "+3",
      trendUp: true,
      route: "/inventory",
    },
    {
      title: "Revenue (MTD)",
      value: "₦45,678",
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
      route: "/reports",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard 
          key={stat.title}
          {...stat}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
};

