import { icons } from "lucide-react";

function polygonPoints(points, x, y, width, height) {
  return points.map(([px, py]) => `${x + px * width},${y + py * height}`).join(" ");
}

function ThumbnailShape({ element, index }) {
  const { x, y, width, height, shape, fill, stroke, strokeWidth, opacity } = element;
  const Icon = element.iconName && icons[element.iconName];
  if (Icon) {
    return (
      <svg key={element.id || index} x={x} y={y} width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={stroke || "#315eea"} strokeWidth={strokeWidth || 2} opacity={opacity ?? 1}>
        <Icon className="cp-canvas-outline-icon" x="0" y="0" width="24" height="24" color={stroke || "#315eea"} strokeWidth={strokeWidth || 2} fill="none" />
      </svg>
    );
  }
  const common = {
    key: element.id || index,
    fill: fill || "transparent",
    stroke: stroke || "none",
    strokeWidth: strokeWidth || 0,
    opacity: opacity ?? 1
  };

  if (shape === "hline" || shape === "vline" || shape === "dashed") {
    return (
      <line
        {...common}
        x1={x}
        y1={shape === "vline" ? y : y + height / 2}
        x2={shape === "vline" ? x + width / 2 : x + width}
        y2={shape === "vline" ? y + height : y + height / 2}
        stroke={stroke || fill || "#315eea"}
        strokeDasharray={shape === "dashed" ? "8 6" : undefined}
      />
    );
  }

  if (shape === "circle" || shape === "oval") {
    return (
      <ellipse
        {...common}
        cx={x + width / 2}
        cy={y + height / 2}
        rx={width / 2}
        ry={height / 2}
      />
    );
  }

  const polygons = {
    triangle: [[0.5, 0], [1, 1], [0, 1]],
    diamond: [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]],
    hexagon: [[0.25, 0], [0.75, 0], [1, 0.5], [0.75, 1], [0.25, 1], [0, 0.5]],
    pentagon: [[0.5, 0], [1, 0.38], [0.81, 1], [0.19, 1], [0, 0.38]],
    star: [[0.5, 0], [0.61, 0.35], [0.98, 0.35], [0.68, 0.57], [0.79, 0.91], [0.5, 0.7], [0.21, 0.91], [0.32, 0.57], [0.02, 0.35], [0.39, 0.35]],
    heart: [[0.5, 0.95], [0.05, 0.45], [0.05, 0.25], [0.2, 0.08], [0.38, 0.08], [0.5, 0.25], [0.62, 0.08], [0.8, 0.08], [0.95, 0.25], [0.95, 0.45]],
    corner: [[0, 0], [1, 0], [1, 0.15], [0.15, 0.15], [0.15, 1], [0, 1]]
  };

  if (polygons[shape]) {
    return <polygon {...common} points={polygonPoints(polygons[shape], x, y, width, height)} />;
  }

  return (
    <rect
      {...common}
      x={x}
      y={y}
      width={width}
      height={height}
      rx={shape === "rounded" ? 14 : 0}
    />
  );
}

export default function CertificateThumbnail({ design, className = "" }) {
  const width = design.width || (design.orientation === "portrait" ? 790 : 1120);
  const height = design.height || (design.orientation === "portrait" ? 1120 : 790);
  const elements = Array.isArray(design.elements) ? design.elements : [];

  return (
    <div className={`cp-design-thumbnail ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${design.name || "Certificate"} preview`}
      >
        <rect width={width} height={height} fill={design.background || design.bg || "#ffffff"} />
        {design.backgroundImage && (
          <image href={design.backgroundImage} x="0" y="0" width={width} height={height} preserveAspectRatio="none" />
        )}
        {elements.map((element, index) => {
          const x = Number(element.x) || 0;
          const y = Number(element.y) || 0;
          const elementWidth = Number(element.width) || 100;
          const elementHeight = Number(element.height) || 40;

          if (element.type === "image" && element.src) {
            return (
              <image
                key={element.id || index}
                href={element.src}
                x={x}
                y={y}
                width={elementWidth}
                height={elementHeight}
                preserveAspectRatio="xMidYMid meet"
              />
            );
          }

          if (element.type === "shape") {
            return (
              <ThumbnailShape
                key={element.id || index}
                element={{ ...element, x, y, width: elementWidth, height: elementHeight }}
                index={index}
              />
            );
          }

          if (element.type === "qr") {
            return (
              <g key={element.id || index}>
                <rect x={x} y={y} width={elementWidth} height={elementHeight} fill="#fff" stroke="#333" strokeWidth="3" />
                <path
                  d={`M ${x + elementWidth * .12} ${y + elementHeight * .12} h ${elementWidth * .25} v ${elementHeight * .25} h -${elementWidth * .25} z M ${x + elementWidth * .63} ${y + elementHeight * .12} h ${elementWidth * .25} v ${elementHeight * .25} h -${elementWidth * .25} z M ${x + elementWidth * .12} ${y + elementHeight * .63} h ${elementWidth * .25} v ${elementHeight * .25} h -${elementWidth * .25} z`}
                  fill="#222"
                />
              </g>
            );
          }

          if (!element.text) return null;

          const fontSize = Number(element.fontSize) || 20;
          const anchor = element.align === "left" ? "start" : element.align === "right" ? "end" : "middle";
          const textX = element.align === "left" ? x : element.align === "right" ? x + elementWidth : x + elementWidth / 2;
          const lines = String(element.text).split("\n");

          return (
            <text
              key={element.id || index}
              x={textX}
              y={y + fontSize}
              textAnchor={anchor}
              fill={element.color || "#26334d"}
              fontSize={fontSize}
              fontFamily={element.fontFamily || "Inter, sans-serif"}
              fontWeight={element.bold ? 700 : 400}
              fontStyle={element.italic ? "italic" : "normal"}
              textDecoration={element.underline ? "underline" : "none"}
              letterSpacing={element.letterSpacing || 0}
              opacity={element.opacity ?? 1}
            >
              {lines.map((line, lineIndex) => (
                <tspan key={lineIndex} x={textX} dy={lineIndex === 0 ? 0 : fontSize * 1.1}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
