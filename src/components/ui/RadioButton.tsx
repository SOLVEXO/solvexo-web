import type { CSSProperties, ReactNode } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  orange:     '#D97757',
  deepOrange: '#B95A3A',
  paleOrange: '#FBECE4',
  carbon:     '#141413',
  charcoal:   '#2C2A28',
  slate:      '#8C8A82',
  bone:       '#E8E6DC',
  white:      '#FFFFFF',
};
const FONT = "'Poppins', sans-serif";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RadioOption {
  value:       string;
  label:       string;
  description?: string;
  icon?:       ReactNode;        // Lucide icon component or any ReactNode
}

interface RadioButtonProps {
  options:   RadioOption[];
  value:     string;
  onChange:  (value: string) => void;
  name:      string;
  layout?:   'row' | 'col';     // row = side by side, col = stacked
  style?:    CSSProperties;     // outer wrapper override
}

// ── Single radio card ─────────────────────────────────────────────────────────
function RadioCard({
  option,
  selected,
  onClick,
}: {
  option:   RadioOption;
  selected: boolean;
  onClick:  () => void;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{
        flex:          1,
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '14px 16px',
        borderRadius:  10,
        border:        `2px solid ${selected ? C.orange : C.bone}`,
        background:    selected ? C.paleOrange : C.white,
        cursor:        'pointer',
        transition:    'all 0.18s ease',
        boxShadow:     selected ? `0 0 0 3px rgba(217,119,87,0.15)` : 'none',
        userSelect:    'none',
        outline:       'none',
      }}
    >
      {/* Radio circle */}
      <div
        style={{
          width:          18,
          height:         18,
          borderRadius:   '50%',
          border:         `2px solid ${selected ? C.orange : C.bone}`,
          background:     C.white,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          transition:     'all 0.18s ease',
        }}
      >
        {selected && (
          <div
            style={{
              width:        9,
              height:       9,
              borderRadius: '50%',
              background:   C.orange,
              transition:   'all 0.18s ease',
            }}
          />
        )}
      </div>

      {/* Icon (optional) */}
      {option.icon && (
        <span style={{ fontSize: 20, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {option.icon}
        </span>
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily:  FONT,
            fontSize:    14,
            fontWeight:  selected ? 600 : 500,
            color:       selected ? C.deepOrange : C.carbon,
            lineHeight:  1.3,
            margin:      0,
            transition:  'all 0.18s ease',
          }}
        >
          {option.label}
        </p>
        {option.description && (
          <p
            style={{
              fontFamily:  FONT,
              fontSize:    12,
              color:       C.slate,
              marginTop:   2,
              lineHeight:  1.4,
            }}
          >
            {option.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main RadioButton component ─────────────────────────────────────────────────
export function RadioButton({
  options,
  value,
  onChange,
  name: _name,
  layout = 'row',
  style,
}: RadioButtonProps) {
  return (
    <div
      style={{
        display:       'flex',
        flexDirection: layout === 'col' ? 'column' : 'row',
        gap:           10,
        ...style,
      }}
    >
      {options.map(opt => (
        <RadioCard
          key={opt.value}
          option={opt}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  );
}
