import {DataNode} from './tree';

export interface Guide {
  id: string;
  title: string;
  description: string;
}

export interface Docs extends DataNode<Docs, string> {
  id: string;
  title: string;
}

export interface MarkDownHead {
  id: string;
  level: string;
  content: string;
}
