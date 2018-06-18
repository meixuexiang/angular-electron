import { Injectable } from '@angular/core';
import { ParamGroup } from '../classes/param-group';
import { Kjhm } from '../classes/interface';
import { Dict } from './dict.service';
import { Param } from '../classes/param';


@Injectable({
  providedIn: 'root'
})
export class ParamService {

  paramGroups: ParamGroup[];
  pvs: { pg: ParamGroup; p: Param; v: string; }[];

  constructor() {
    this.paramGroups = [
      ...[1, 2, 3, 4, 5/*, 6, 7, 8*/].map(n => {
        const name = `C${n}`;
        return new ParamGroup({
          name,
          getValFactory: () => {
            return Dict[name].map((d: Kjhm) => {
              const set = new Set(d);
              const fn = ([k0, k1, k2, k3, k4]) => {
                return String(+set.has(k0) + +set.has(k1) + +set.has(k2) + +set.has(k3) + +set.has(k4));
              };
              fn['pname'] = d.join('');
              return fn;
            });
          }
        });
      }),

      new ParamGroup({
        name: 'KD',
        getValFactory: () => {
          const fn = (kjhm: Kjhm) => {
            const ar = kjhm.map(s => +s);
            return String(Math.max(...ar) - Math.min(...ar) - 4);
          };
          fn['pname'] = 'kd';
          return [fn];
        }
      }),

      new ParamGroup({
        name: 'BIN',
        getValFactory: () => {
          return [5, 6, 7, 8, 9, 10, 11].map(n => {
            const fn = (kjhm: Kjhm) => {
              const set = new Set(kjhm.map(s => +s));
              const ar = new Array(11).fill(0).map((i) => set.has(i + 1) ? 1 : 0);
              return String(parseInt(ar.join(''), 2) % n);
            };
            fn['pname'] = 'bin' + n;
            return fn;
          });
        }
      }),

      new ParamGroup({
        name: 'HW',
        getValFactory: () => {
          return [5, 6, 7, 8, 9, 10, 11].map(n => {
            const fn = (kjhm: Kjhm) => {
              return String(kjhm.reduce((acc, s) => +s + acc, 0) % n);
            };
            fn['pname'] = 'hw' + n;
            return fn;
          });
        }
      }),

    ];

    this.pvs = [].concat(...this.paramGroups.map(pg => [].concat(...pg.params.map(p => p.values.map(v => ({ pg, p, v }))))));
  }

}
