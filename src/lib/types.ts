export type RankMode = 'latest' | 'top' | 'rising';

export interface Link {
	id: string;
	url: string;
	domain: string;
	title?: string;
	content?: string;
	ts: number;
	count: number;
	score?: number;
	meta?: Record<string, unknown>;
	submittedBy?: string;
}

export interface RelatedLink {
	id: string;
	url: string;
	domain: string;
	title: string;
	roomComment: string;
	count: number;
	ts: number;
	score: number;
}

export interface RelatedGroup {
	name: string;
	count: number;
}
