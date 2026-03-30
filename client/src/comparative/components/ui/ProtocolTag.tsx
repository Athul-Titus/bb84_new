import { PROTOCOL_COLORS } from '../../data/chartConfigs';
import type { ProtocolKey } from '../../data/types';

interface ProtocolTagProps {
  protocol: ProtocolKey;
  label: string;
}

export function ProtocolTag({ protocol, label }: ProtocolTagProps) {
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: PROTOCOL_COLORS[protocol].light,
        color: PROTOCOL_COLORS[protocol].text,
      }}
    >
      {label}
    </span>
  );
}
