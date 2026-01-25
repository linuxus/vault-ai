import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTTL } from '@/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Clock, Key, Shield, Calendar } from 'lucide-react';

export function TokenInfo() {
  const { tokenInfo } = useAuth();

  if (!tokenInfo) return null;

  const infoItems = [
    {
      icon: Key,
      label: 'Display Name',
      value: tokenInfo.display_name || 'Token',
    },
    {
      icon: Shield,
      label: 'Policies',
      value: tokenInfo.policies.join(', ') || 'None',
    },
    {
      icon: Clock,
      label: 'TTL',
      value: tokenInfo.ttl > 0 ? formatTTL(tokenInfo.ttl) : 'Never expires',
    },
    {
      icon: Calendar,
      label: 'Created',
      value: formatDate(tokenInfo.issue_time),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Token Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {infoItems.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-sm font-medium">{item.value}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
