export interface Guide {
  id: string;
  title: string;
  description: string;
}

export type DocType = 'readme' | 'page';

export interface Docs {
  id: string;
  title: string;
  type: DocType;
}

export interface MarkDownHead {
  id: string;
  level: string;
  content: string;
}
