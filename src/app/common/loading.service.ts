import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingStatus = new BehaviorSubject<boolean>(false);

  loading() {
    setTimeout(()=>this.loadingStatus.next(true));
  }

  loaded() {
    setTimeout(()=>this.loadingStatus.next(false));
  }

  status() {
    return this.loadingStatus.asObservable();
  }

  constructor() {
  }
}
