import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiStatesService {
  private showDocumentToggleBtn$ = new BehaviorSubject<boolean>(true);
  private printing$ = new BehaviorSubject<boolean>(false);
  private currentDocId$ = new BehaviorSubject<string | undefined>(undefined);

  get showDocumentToggleBtn(): Observable<boolean> {
    return this.showDocumentToggleBtn$.asObservable();
  }

  get currentDocumentToggleState() {
    return this.showDocumentToggleBtn$.getValue();
  }

  get isPrinting() {
    return this.printing$.getValue();
  }

  get currentDocId() {
    return this.currentDocId$.asObservable();
  }

  setCurrentDocId(docId?: string) {
    this.currentDocId$.next(docId);
  }

  setShowDocumentToggleBtn(show: boolean) {
    this.showDocumentToggleBtn$.next(show);
  }

  setPrinting(state: boolean) {
    this.printing$.next(state);
  }
}
