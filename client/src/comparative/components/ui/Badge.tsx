interface BadgeProps {
  status: 'yes' | 'no' | 'partial';
}

const styleMap = {
  yes: { background: '#EAF3DE', color: '#3B6D11', borderColor: '#C0DD97' },
  no: { background: '#FCEBEB', color: '#A32D2D', borderColor: '#F7C1C1' },
  partial: { background: '#FAEEDA', color: '#854F0B', borderColor: '#FAC775' },
};

const labelMap = {
  yes: 'Yes',
  no: 'No',
  partial: 'Partial',
};

export function Badge({ status }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 6,
        border: '1px solid',
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 700,
        ...styleMap[status],
      }}
    >
      {labelMap[status]}
    </span>
  );
}
