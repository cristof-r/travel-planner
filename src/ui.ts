/** Appends a small color-coded dot in the given color (e.g. a category's configured color). */
export function appendCategoryDot(container: HTMLElement, color: string, prepend = false): void {
	container.createSpan({ prepend }, (dot) => {
		dot.style.display = "inline-block";
		dot.style.width = "10px";
		dot.style.height = "10px";
		dot.style.borderRadius = "50%";
		dot.style.marginRight = "0.4em";
		dot.style.flexShrink = "0";
		dot.style.backgroundColor = color;
	});
}
