import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import * as Rx from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MysqlService {

  mysql: any;
  mysql2: any;
  connection: any;
  connection2: any;

  constructor(private es: ElectronService) {
    this.init();
  }

  async init() {

    this.mysql = this.es.remote.require('mysql');
    this.connection = this.mysql.createConnection({
      host: '192.168.1.4',
      user: 'meixx',
      password: '47944980',
      database: 'lot115'
    });
    this.mysql2 = this.es.remote.require('mysql2/promise');
    this.connection2 = await this.mysql2.createConnection({
      host: '192.168.1.4',
      user: 'meixx',
      password: '47944980',
      database: 'lot115'
    });
  }

  _query(tableName: string) {
    return Rx.from(this.connection2.execute('select issue, n1, n2, n3, n4, n5 from bj order by issue desc limit 10000;'));
  }

  // _query(tableName: string) {
  //   return Observable.create(observer => {
  //     const ds = +new Date();
  //     this.connection.connect();
  //     const query = this.connection.query('select issue, n1, n2, n3, n4, n5 from bj order by issue desc limit 100000;');
  //     query
  //       .on('error', function (err) {
  //         // Handle error, an 'end' event will be emitted after this as well
  //         observer.error();
  //       })
  //       .on('fields', function (fields) {
  //         // the field packets for the rows to follow
  //       })
  //       .on('result', function (row) {
  //         // Pausing the connnection is useful if your processing involves I/O
  //         // connection.pause();

  //         // processRow(row, function () {
  //         //   connection.resume();
  //         // });
  //         observer.next(row);
  //       })
  //       .on('end', function () {
  //         // all rows have been received
  //         console.log('cost: ', Date.now() - ds, 'ms');
  //         observer.complete();
  //       });

  //     // this.connection.query('select issue, n1, n2, n3, n4, n5 from bj order by issue desc limit 100000;', function (error, results, fields) {
  //     //   console.log('cost: ', Date.now() - ds, 'ms');
  //     //   if (error) {
  //     //     return observer.error();
  //     //   }
  //     //   observer.next([results, fields]);
  //     // });
  //     this.connection.end();
  //   });
  // }

  queryBJ() {
    return this._query('bj');
  }

  queryGD() {
    return this._query('gd');
  }
}
