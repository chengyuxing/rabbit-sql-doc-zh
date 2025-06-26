import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Docs, Guide} from './types';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private _docs: { host: string, resources: Docs[] } = {host: '', resources: []};
  private _guides: { host: string, resources: Guide[] } = {host: '', resources: []};

  get docs() {
    return this._docs.resources;
  }

  get guides() {
    return this._guides.resources;
  }

  geDocFileUrl(id: string) {
    return `${this._docs.host}${id}.md`;
  }

  getGuideFileUrl(id: string) {
    return `${this._guides.host}${id}.md`;
  }

  constructor(private http: HttpClient, private snack: MatSnackBar) {
    this.http.get<{ host: string, resources: Docs[] }>('datas/docs.json', {
      responseType: 'json'
    }).pipe(catchError(err => {
      snack.open(`[${err.status}] 加载资源错误：${err.statusText}`, 'x', {duration: 3000});
      return of(null)
    })).subscribe((res) => {
      if (res) {
        this._docs = res;
      }
    });
    this.http.get<{ host: string, resources: Guide[] }>('datas/guides.json', {
      responseType: 'json'
    }).pipe(catchError(err => {
      snack.open(`[${err.status}] 加载资源错误：${err.statusText}`, 'x', {duration: 3000});
      return of(null);
    })).subscribe((res) => {
      if (res) {
        this._guides = res;
      }
    })
  }
}
