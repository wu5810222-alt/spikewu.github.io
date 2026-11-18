import { SKIP, visit } from "unist-util-visit";

const HIGHLIGHT_RE = /==([^=\n](?:.*?[^=\n])?)==/g;

const COLOR_EMOJI_MAP = {
	"🔴": "red",
	"🟠": "orange",
	"🟡": "yellow",
	"🟢": "green",
	"🔵": "blue",
	"🟣": "purple",
	"🟤": "brown",
	"⚫": "gray",
	"⚪": "white",
};

function parseHighlightContent(raw) {
	for (const [emoji, color] of Object.entries(COLOR_EMOJI_MAP)) {
		if (raw.startsWith(emoji)) {
			const text = raw.slice(emoji.length).replace(/^\s+/, "");
			if (text.length > 0) {
				return { color, text };
			}
		}
	}
	return { color: null, text: raw };
}

/**
 * Remark plugin to convert Obsidian-style `==highlight==` and `==🔴highlight==` syntax into `<mark>` elements.
 */
export function remarkHighlight() {
	return (tree) => {
		visit(tree, "text", (node, index, parent) => {
			if (!parent || index === undefined || !node.value.includes("==")) {
				return;
			}

			const parts = [];
			let lastIndex = 0;

			for (const match of node.value.matchAll(HIGHLIGHT_RE)) {
				if (match.index > lastIndex) {
					parts.push({
						type: "text",
						value: node.value.slice(lastIndex, match.index),
					});
				}
				const { color, text } = parseHighlightContent(match[1]);
				parts.push({
					type: "highlight",
					data: {
						hName: "mark",
						hProperties: color ? { "data-hl": color } : {},
					},
					children: [{ type: "text", value: text }],
				});
				lastIndex = match.index + match[0].length;
			}

			if (parts.length === 0) {
				return;
			}

			if (lastIndex < node.value.length) {
				parts.push({
					type: "text",
					value: node.value.slice(lastIndex),
				});
			}

			parent.children.splice(index, 1, ...parts);
			return [SKIP, index + parts.length];
		});
	};
}
