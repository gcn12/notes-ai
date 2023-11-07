interface SpacerProps {
  size: number;
  axis?: "x" | "y";
}

export default function Spacer({ axis, size }: SpacerProps) {
  let width = size;
  let height = size;
  if (axis === "x") {
    height = 0;
  } else if (axis === "y") {
    width = 0;
  }

  return (
    <span
      className={`block`}
      style={{
        height: `${height}px`,
        width: `${width}px`,
        minHeight: `${height}px`,
        minWidth: `${width}px`,
      }}
    />
  );
}
