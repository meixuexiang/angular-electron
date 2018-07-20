import { Kjhm } from './interface';
import { Dict } from '../providers/dict.service';

export class Param {
  values: string[];
  valNumMap: { [key: string]: Kjhm[] } = {};

  name: string;
  getVal: (kjhm: Kjhm) => string;

  constructor(options) {
    options = options || {};
    if (!options.getVal) {
      throw new Error('Missing the method :  "getVal"');
    }
    if (!options.name) {
      throw new Error('Missing the property :  "name"');
    }
    this.getVal = options.getVal;
    this.name = options.name;
    this.init();
  }

  init() {
    Dict.C5.forEach((kjhm: Kjhm) => {
      const v = this.getVal(kjhm).toString();
      if (!this.valNumMap[v]) {
        this.valNumMap[v] = [];
      }
      this.valNumMap[v].push(kjhm);
    });
    this.values = Object.keys(this.valNumMap).sort((a, b) => Number(a) - Number(b));
  }

}

/*
数学期望,方差,标准差,协方差
四分位差 (quartile deviation)
极差 Range
方差：方差（variance)
标准差 (Standard Deviation)
离散系数：离散系数又称变异系数，CV(Coefficient of Variance)表示
偏度与峰度的度量：
偏态系数：偏度(Skewness)亦称偏态
峰态系数：（Kurtosis)


*/
