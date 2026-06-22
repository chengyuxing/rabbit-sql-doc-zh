import {computed, inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Docs, Guide} from './types';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, of} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  http = inject(HttpClient);
  snack = inject(MatSnackBar);

  private _docs = toSignal(this.http.get<{ host: string, resources: Docs[] }>('datas/docs.json', {
    responseType: 'json'
  }).pipe(catchError(err => {
    this.snack.open(`[${err.status}] 加载资源错误：${err.statusText}`, 'x', {duration: 3000});
    return of(null)
  })));

  private _guides = toSignal(this.http.get<{ host: string, resources: Guide[] }>('datas/guides.json', {
    responseType: 'json'
  }).pipe(catchError(err => {
    this.snack.open(`[${err.status}] 加载资源错误：${err.statusText}`, 'x', {duration: 3000});
    return of(null);
  })));

  readonly isDocsLoaded = computed(() => !!this._docs());
  readonly isGuidesLoaded = computed(() => !!this._guides());

  get docs() {
    return this._docs()?.resources || [];
  }

  get guides() {
    return this._guides()?.resources || [];
  }

  geDocFileUrl(id: string) {
    const host = this._docs()?.host;
    if (!host) {
      return null;
    }
    return `${host}${id}.md`;
  }

  getGuideFileUrl(id: string) {
    const host = this._guides()?.host;
    if (!host) {
      return null;
    }
    return `${host}${id}.md`;
  }
}
