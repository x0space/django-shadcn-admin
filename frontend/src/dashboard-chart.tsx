import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
import type { DashboardWidget, Direction } from "./types";
export default function DashboardChart({
  widget,
  direction,
}: {
  widget: DashboardWidget;
  direction: Direction;
}) {
  return (
    <ChartContainer
      config={{ value: { label: widget.title, color: "var(--chart-1)" } }}
      className="h-64 w-full"
    >
      <AreaChart data={widget.points} accessibilityLayer>
        <defs>
          <linearGradient id="dashboard-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          reversed={direction === "rtl"}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--chart-1)"
          fill="url(#dashboard-area)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
