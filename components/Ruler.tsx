import React from 'react';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  width: number;
  height: number;
  onAddGuide: (position: number) => void;
}

const RULER_SIZE = 30;

const Ruler: React.FC<RulerProps> = ({ orientation, width, height, onAddGuide }) => {
  const isHorizontal = orientation === 'horizontal';
  const size = isHorizontal ? width : height;
  const tickCount = Math.floor(size / 50);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svgRect = e.currentTarget.getBoundingClientRect();
    const position = isHorizontal ? e.clientX - svgRect.left : e.clientY - svgRect.top;
    onAddGuide(position);
  };


  return (
    <svg
      onMouseDown={handleMouseDown}
      className="absolute bg-slate-100 cursor-copy"
      style={{
        width: isHorizontal ? `${width}px` : `${RULER_SIZE}px`,
        height: isHorizontal ? `${RULER_SIZE}px` : `${height}px`,
        left: isHorizontal ? `${RULER_SIZE}px` : 0,
        top: isHorizontal ? 0 : `${RULER_SIZE}px`,
      }}
    >
      {Array.from({ length: tickCount + 1 }).map((_, i) => {
        const position = i * 50;
        const isMajorTick = i % 2 === 0;
        const tickLength = isMajorTick ? RULER_SIZE / 2 : RULER_SIZE / 4;

        return (
          <g key={i}>
            <line
              x1={isHorizontal ? position : RULER_SIZE - tickLength}
              y1={isHorizontal ? RULER_SIZE - tickLength : position}
              x2={isHorizontal ? position : RULER_SIZE}
              y2={isHorizontal ? RULER_SIZE : position}
              stroke="#64748b"
              strokeWidth="1"
            />
            {isMajorTick && i > 0 && (
              <text
                x={isHorizontal ? position + 2 : RULER_SIZE - tickLength - 4}
                y={isHorizontal ? RULER_SIZE - tickLength - 4 : position + 10}
                fontSize="10"
                fill="#64748b"
                style={{
                  textAnchor: isHorizontal ? 'start' : 'end',
                  dominantBaseline: 'middle',
                }}
              >
                {position}
              </text>
            )}
          </g>
        );
      })}
      <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
    </svg>
  );
};

export default Ruler;