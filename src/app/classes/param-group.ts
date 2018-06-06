import { Kjhm } from './interface';
import { Param } from './param';

export class ParamGroup {
  params: Param[];
  name: string;
  getValFactory: () => ((kjhm: Kjhm) => number | string)[];

  constructor(
    options
  ) {
    if (typeof options === 'function') {
      options = {
        getValFactory: options
      };
    }
    options = options || {};
    this.getValFactory = options.getValFactory;
    this.name = options.name;
    this.init();
  }

  init() {
    this.params = this.getValFactory().map(getVal => new Param({
      name: getVal['pname'],
      getVal
    }));
  }

}
