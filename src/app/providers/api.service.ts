import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Draw, Kjhm } from '../classes/interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  host = 'http://192.168.1.4:8080/v1';
  constructor(
    private http: HttpClient
  ) { }

  _load(tbName): Observable<{ issue: number; kjhm: Kjhm }[]> {
    return this.http.get<{ issue: number; n1: string; n2: string; n3: string; n4: string; n5: string; }[]>(`${this.host}/${tbName}?sortby=Issue&order=desc&limit=11000`)
      .pipe(
        map(res => res.map(o => ({
          issue: o.issue,
          kjhm: [o.n1, o.n2, o.n3, o.n4, o.n5]
        })).reverse()
        )
      );
  }

  loadGD() {
    return this._load('gd');
  }

  loadBJ() {
    return this._load('bj');
  }

}
