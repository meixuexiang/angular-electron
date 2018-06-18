import { ParamGroup } from './param-group';
import { Param } from './param';

export type Kjhm = string[];

export interface Draw {
  issue: number;
  kjhm: Kjhm;
}

export interface Arg {
  pg?: ParamGroup;
  p?: Param;
  v?: string;
  vs?: { issue: number; value: string; money: number; }[];
  ks?: number[][];
  weight?: number;
  delta?: number[];
  distance?: number;
}
