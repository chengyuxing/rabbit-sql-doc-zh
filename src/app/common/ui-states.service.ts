import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiStatesService {
  private showDocumentToggleBtn$ = new BehaviorSubject<boolean>(true);

  get showDocumentToggleBtn(): Observable<boolean> {
    return this.showDocumentToggleBtn$.asObservable();
  }

  get currentDocumentToggleState() {
    return this.showDocumentToggleBtn$.getValue();
  }

  setShowDocumentToggleBtn(show: boolean) {
    this.showDocumentToggleBtn$.next(show);
  }
}
