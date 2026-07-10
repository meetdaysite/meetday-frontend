declare module "*.svg" {
	import type { SVGProps, Ref } from "react";
	const ReactComponent: (
		props: SVGProps<SVGSVGElement> & { title?: string; ref?: Ref<SVGSVGElement> }
	) => React.JSX.Element;
	export default ReactComponent;
}
