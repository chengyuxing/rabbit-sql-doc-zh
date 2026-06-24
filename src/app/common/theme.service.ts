import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeChanged$ = new Subject<boolean>();

  observe() {
    return this.themeChanged$.asObservable();
  }

  changeTheme(isDark: boolean) {
    this.themeChanged$.next(isDark);
  }
}
