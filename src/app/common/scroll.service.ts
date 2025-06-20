import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  scrollTo(id: string, offset = 80) {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({top: top, behavior: 'smooth'});
    }
  }

  scrollToCurrentHash(offset = 80) {
    const id = location.hash.replace('#', '');
    if (id) {
      setTimeout(() => this.scrollTo(id, offset), 50);
    }
  }
}
