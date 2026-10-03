// First H1 outside code fences, returned separately from the body.
export function extractFirstHeading(markdown: string | undefined): { h1: string; content: string } {
	if (!markdown) {
		return { h1: '', content: '' };
	}

	const lines = markdown.split(/\r?\n/);
	let inFence = false;
	let fenceToken = '';
	let foundHeading = '';
	const outputLines: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const fenceMatch = line.match(/^(`{3,}|~{3,})/);

		if (fenceMatch) {
			if (!inFence) {
				inFence = true;
				fenceToken = fenceMatch[1];
			} else if (line.startsWith(fenceToken)) {
				inFence = false;
				fenceToken = '';
			}
			outputLines.push(line);
			continue;
		}

		if (!inFence && !foundHeading) {
			const headingMatch = line.match(/^#\s+(.+)$/);
			if (headingMatch) {
				foundHeading = headingMatch[1].trim();
				continue;
			}
		}

		outputLines.push(line);
	}

	return {
		h1: foundHeading,
		content: outputLines.join('\n').trimStart()
	};
}
