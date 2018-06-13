import { Kjhm } from './interface';
import { Dict } from '../providers/dict.service';

export class Tolerant {
  map: Map<Kjhm, number>;
  constructor() {
    this.map = new Map();
    Dict.C5.forEach((kjhm: Kjhm) => this.map.set(kjhm, 0));
  }

  add(arKjhm: Kjhm[]) {
    arKjhm.forEach((kjhm: Kjhm) => this.map.set(kjhm, this.map.get(kjhm) + 1));
  }

  genResult(): string[][] {
    const entries = Array.from(this.map.entries());
    return entries.reduce((acc, entry, i) => {
      const kjhm = entry[0], index = entry[1];
      acc[index].push(kjhm);
      return acc;
    }, new Array(Math.max(...entries.map(e => e[1])) + 1).fill(0).map(() => []));
  }
}
