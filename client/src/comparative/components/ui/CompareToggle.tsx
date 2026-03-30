import { useDashboard } from '../../context/DashboardContext';
import { PROTOCOL_COLORS, PROTOCOL_LABELS } from '../../data/chartConfigs';
import type { ProtocolKey } from '../../data/types';

const keys: ProtocolKey[] = ['qsafe', 'e91', 'b92', 'bb84', 'sgs04'];

export function CompareToggle() {
  const { state, dispatch } = useDashboard();

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => {
        const enabled = state.visibleProtocols[key];
        return (
          <button
            key={key}
            onClick={() => dispatch({ type: 'TOGGLE_PROTOCOL', payload: key })}
            className="rounded-full border px-3 py-1 text-xs font-medium transition"
            style={{
              borderColor: enabled ? PROTOCOL_COLORS[key].bg : 'var(--border-strong)',
              color: enabled ? PROTOCOL_COLORS[key].text : 'var(--text-muted)',
              backgroundColor: enabled ? PROTOCOL_COLORS[key].light : 'transparent',
            }}
          >
            {PROTOCOL_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
