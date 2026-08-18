import { ICONS } from "../icons";

export default function Icon({ name, size = 18, color = "currentColor", className, ...rest }) {
  const SvgIcon = ICONS[name];

  if (!SvgIcon) {
    console.warn(`Icon "${name}" not found in registry`);
    return null;
  }

  return (
    <SvgIcon
      width={size}
      height={size}
      style={{ color }}
      className={className}
      {...rest}
    />
  );
}