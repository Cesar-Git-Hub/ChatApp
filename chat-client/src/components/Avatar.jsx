export default function Avatar({ name = '?', size = 40 }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const hue = 165 + (h % 55); // stays in the teal/blue family
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hue} 38% 36%)` }}
      aria-hidden="true"
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}
