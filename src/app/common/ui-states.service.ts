import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiStatesService {
  private showDocumentToggleBtn$ = new BehaviorSubject<boolean>(true);
  private printing$ = new BehaviorSubject<boolean>(false);

  get showDocumentToggleBtn(): Observable<boolean> {
    return this.showDocumentToggleBtn$.asObservable();
  }

  get currentDocumentToggleState() {
    return this.showDocumentToggleBtn$.getValue();
  }

  get isPrinting() {
    return this.printing$.getValue();
  }

  setShowDocumentToggleBtn(show: boolean) {
    this.showDocumentToggleBtn$.next(show);
  }

  setPrinting(state: boolean) {
    this.printing$.next(state);
  }
}
