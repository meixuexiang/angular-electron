import * as Combinatorics from 'js-combinatorics';
// import * as _ from 'lodash';

// @Injectable({
//   providedIn: 'root'
// })
// export class DictService {

//   digits = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
//   _CCS: Kjhm[];

//   constructor() {
//     console.error('DictService constructor');

//   }

//   get CCS() {
//     return this._CCS || (this._CCS = Combinatorics.combination(this.digits, 5));
//   }

// }
const Digits = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];

export const Dict = {
  C1: Combinatorics.combination(Digits, 1).toArray(),
  C2: Combinatorics.combination(Digits, 2).toArray(),
  C3: Combinatorics.combination(Digits, 3).toArray(),
  C4: Combinatorics.combination(Digits, 4).toArray(),
  C5: Combinatorics.combination(Digits, 5).toArray(),
  C6: Combinatorics.combination(Digits, 6).toArray(),
  C7: Combinatorics.combination(Digits, 7).toArray(),
  C8: Combinatorics.combination(Digits, 8).toArray(),
};

// const els = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
// const ar = Combinatorics.baseN(els, 5).toArray();
// const arr = ar.map(a => [_.sumBy(a, function (o) { return o[0]; }), _.sumBy(a, function (o) { return o[1]; }), _.sumBy(a, function (o) { return o[2]; })].join(''));

// const d = Date.now();
// const ds = '0123456789'.split(''), s = new Set(ds);
// const r4 = Combinatorics.combination(ds, 4).toArray();
// const C443 = [].concat(...r4.map(r => {
//   const others = ds.filter(n => !r.includes(n));
//   let C63 = Combinatorics.combination(others, 3).toArray();
//   let N63 = C63.map(m => others.filter(n => !m.includes(n)));
//   C63 = C63.map(a => a.join(''));
//   N63 = N63.map(a => a.join(''));
//   const C63Keys = C63.map((n, i) => (C63[i] < N63[i] ? [C63[i], N63[i]] : [N63[i], C63[i]]).join('-'));
//   const C63UniqKeys = Array.from(new Set(C63Keys));
//   return C63UniqKeys.map(key => `${r.join('')}-${key}`);
// }));
// console.log(Date.now() - d);
// console.log(
//   C443
// );








// function weight(ar, n) {
//   return ar.reduce((acc, v) => acc += (v === '1' ? 100000 - n : -n), 0);
// }

// function audition(arParams) {
//   const ar = arParams.reduce((acc, { vn, str }, i) => {
//     const keys = Object.keys(vn), values = str.split('');
//     return acc.concat(...Combinatorics.power(keys).toArray().map(vs => {
//       if (vs.length === 0 || vs.length === keys.length) { return []; }
//       const ns = [].concat(...vs.map(v => vn[v])), vsSet = new Set(vs);
//       const ar01 = values.map(v => vsSet.has(v) ? '1' : '0');
//       const w = weight(ar01, ns.length);
//       return [{ vs, ns, w }];
//     }));
//   }, []);
//   return ar.sort((a, b) => b.w - a.w);
// }

// const arr = [
//   { vn: { 0: new Array(10000), 1: new Array(20000), 2: new Array(30000), 3: new Array(40000) }, str: '210320321031031022012013212131310320132210320321031031022012013212131310320132' },
//   { vn: { 0: new Array(20000), 1: new Array(20000), 2: new Array(20000), 3: new Array(40000) }, str: '210320321031031022012013212131310320132210320321031031022012013212131310320132' },
//   { vn: { 0: new Array(40000), 1: new Array(10000), 2: new Array(10000), 3: new Array(40000) }, str: '210320321031031022012013212131310320132210320321031031022012013212131310320132' },
//   { vn: { 0: new Array(25000), 1: new Array(25000), 2: new Array(25000), 3: new Array(25000) }, str: '210320321031031022012013212131310320132210320321031031022012013212131310320132' },
// ];

// console.log(
//   audition(arr)
// );
