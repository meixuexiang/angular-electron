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
  ks?: number[][];
  ims?: { issue: number, money: number }[];
  weight?: number;
}
