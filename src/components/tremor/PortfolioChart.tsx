'use client';
import { AreaChart, Card, Title } from '@tremor/react';

export interface PortfolioDataPoint { date: string; value: number; gain: number; }

interface PortfolioChartProps { data: PortfolioDataPoint[]; title?: string; }

const fmt = (n: number) => `$${n.toLocaleString()}`;

export function PortfolioChart({ data, title = 'Portfolio value' }: PortfolioChartProps) {
  return (
    <Card>
      <Title>{title}</Title>
      <AreaChart
        className="mt-4 h-48"
        data={data}
        index="date"
        categories={['value', 'gain']}
        colors={['emerald', 'blue']}
        valueFormatter={fmt}
        yAxisWidth={80}
      />
    </Card>
  );
}
