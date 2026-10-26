const closestKatex = (node: Node): Element | null => {
	const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
	return element?.closest('.katex') ?? null;
};

const replaceKatexWithTex = (root: HTMLElement) => {
	root.querySelectorAll('.katex').forEach((katex) => {
		const annotation = katex.querySelector('annotation[encoding="application/x-tex"]');
		if (!annotation) return;

		const displayMode = katex.closest('.katex-display') !== null;
		const tex = `${displayMode ? '$$' : '$'}${annotation.textContent ?? ''}${
			displayMode ? '$$' : '$'
		}`;
		const target = katex.closest('.katex-display') ?? katex;

		if (displayMode) {
			const block = document.createElement('span');
			block.style.display = 'block';
			block.textContent = tex;
			target.replaceWith(block);
		} else {
			target.replaceWith(document.createTextNode(tex));
		}
	});
};

export const getSelectionClipboardData = (selection: Selection) => {
	const range = selection.getRangeAt(0).cloneRange();

	// Selecting part of a formula should copy the whole formula
	const startKatex = closestKatex(range.startContainer);
	if (startKatex) range.setStartBefore(startKatex);
	const endKatex = closestKatex(range.endContainer);
	if (endKatex) range.setEndAfter(endKatex);

	const container = document.createElement('div');
	container.appendChild(range.cloneContents());

	// KaTeX only exposes glyphs and CSS to the clipboard, which mangles
	// formulas. Copy the TeX source instead, as KaTeX's copy-tex does.
	const hasKatex = container.querySelector('.katex') !== null;
	replaceKatexWithTex(container);

	container.querySelectorAll('table').forEach((table) => {
		table.style.borderCollapse = 'collapse';
		table.style.width = 'auto';
		table.style.tableLayout = 'auto';
	});

	container.querySelectorAll('th').forEach((th) => {
		th.style.whiteSpace = 'nowrap';
		th.style.padding = '4px 8px';
	});

	const html = container.innerHTML;

	let text = selection.toString();
	if (hasKatex) {
		// innerText needs the fragment in the document to resolve line breaks
		container.style.cssText = 'position: fixed; top: 0; left: -10000px; width: 1000px;';
		document.body.appendChild(container);
		text = container.innerText;
		container.remove();
	}

	return { html, text };
};
