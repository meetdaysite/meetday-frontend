import clsx from "clsx";
import type { ComponentType, SVGProps } from "react";

const sizeClasses = {
	xs: "size-3",
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
	xl: "size-8",
	"2xl": "size-10",
} as const;

const colorClasses = {
	primary: "text-icon-primary",
	secondary: "text-icon-secondary",
	muted: "text-icon-muted",
	inverse: "text-icon-inverse",
	brand: "text-icon-brand",
	info: "text-icon-info",
	vibe: "text-icon-vibe",
	warning: "text-text-warning",
	success: "text-icon-success",
	inherit: "",
} as const;

type IconSize = keyof typeof sizeClasses;
type IconColor = keyof typeof colorClasses;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
	as: ComponentType<SVGProps<SVGSVGElement>>;
	size?: IconSize;
	color?: IconColor;
	/** Accessible label — sets role="img" + aria-label. Omit for decorative icons. */
	label?: string;
	className?: string;
}

export function Icon({ as: Glyph, size = "md", color = "inherit", label, className, ...props }: IconProps) {
	return (
		<Glyph
			aria-hidden={label ? undefined : true}
			aria-label={label}
			role={label ? "img" : undefined}
			className={clsx(sizeClasses[size], colorClasses[color], className)}
			{...props}
		/>
	);
}
