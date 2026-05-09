import { Card, Metric, Text } from '@tremor/react';

export type DeltaType = 'increase' | 'decrease' | 'unchanged' | 'moderateIncrease' | 'moderateDecrease';

interface MetricCardProps { title: string; value: string; delta?: string; deltaType?: DeltaType; }

const deltaColors: Record<DeltaType, string> = {
  increase: 'text-emerald-600',
  moderateIncrease: 'text-emerald-500',
  unchanged: 'text-gray-500',
  moderateDecrease: 'text-red-400',
  decrease: 'text-red-600',
};

export function MetricCard({ title, value, delta, deltaType = 'unchanged' }: MetricCardProps) {
  return (
    <Card className="max-w-xs">
      <Text>{title}</Text>
      <Metric>{value}</Metric>
      {delta && (
        <span className={`text-sm font-medium ${deltaColors[deltaType]}`}>{delta}</span>
      )}
    </Card>
  );
}
