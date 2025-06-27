import {
  AfterViewInit,
  Component, effect,
  HostListener,
  inject,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {marked} from 'marked';
import {SafehtmlPipe} from '../../pipes/safehtml.pipe';
import hljs from 'highlight.js/lib/common';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MarkDownHead} from '../../common/types';
import {LoadingService} from '../../common/loading.service';
import {catchError, of} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import mermaid from 'mermaid';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'rabbit-sql-markdown',
  imports: [
    SafehtmlPipe,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    RouterLink
  ],
  templateUrl: './markdown.component.html',
  styleUrl: './markdown.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MarkdownComponent implements AfterViewInit {
  top = input<string>('0px');
  url = input.required<string>();
  anAction = output<string>();

  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  router = inject(Router);
  loadingService = inject(LoadingService);
  snack = inject(MatSnackBar);
  title = inject(Title);

  content?: string;
  titles: MarkDownHead[] = [];

  currentHash = location.hash.replace('#', '');

  constructor() {
    effect(() => {
      const currentUrl = this.url();
      if (currentUrl) {
        this.currentHash = '';
        this.loadReadmeContent(currentUrl);
      }
    });
  }

  ngAfterViewInit(): void {
    this.route.fragment.subscribe(id => {
      if (id) {
        this.currentHash = id;
        if (this.anAction) {
          this.anAction.emit(id);
        }
      }
    });
    mermaid.initialize({startOnLoad: true});
  }

  @HostListener('click', ['$event', '$event.target', '$event.target.classList'])
  doClickDoc(event: Event, target: HTMLElement, classList: DOMTokenList): void {
    if (classList.contains('code-copy')) {
      const code = target.parentElement?.getElementsByTagName('code');
      if (code && code.length > 0) {
        navigator.clipboard.writeText(code[0].textContent || '').then(() => {
          target.innerHTML = 'check';
          setTimeout(() => target.innerHTML = 'content_copy', 1500);
        });
      }
      return;
    }
    if (classList.contains('head-link')) {
      const id = target.parentElement?.id;
      if (id) {
        this.router.navigate([], {fragment: id});
      }
    }
  }

  loadReadmeContent(url: string) {
    this.loadingService.loading();
    this.http.get(url, {
      responseType: 'text'
    }).pipe(catchError((err: any) => {
      this.snack.open(err.statusText, 'x', {duration: 3000});
      return of(null);
    })).subscribe(res => {
      if (res !== null) {
        const html = marked(res) as string;
        const myContent = this.parsing(html);
        const h1 = this.titles[0];
        if (h1) {
          this.title.setTitle(h1.content);
        }
        this.content = myContent;
        setTimeout(() => mermaid.contentLoaded(), 50);
      }
      this.loadingService.loaded();
    });
  }

  parsing(content: string): string {
    const div = document.createElement('div');
    div.innerHTML = content;
    const titles: MarkDownHead[] = [];
    let idx = 0;
    for (const child of div.children) {
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(child.tagName)) {
        const id = `md-head-${idx++}`;
        child.id = id;
        child.className = 'md-head';
        titles.push({
          id: id,
          level: child.tagName.toLowerCase(),
          content: child.innerHTML
        });
        const link = document.createElement('a');
        link.className = 'material-icons mat-mdc-icon-button head-link';
        link.innerHTML = 'link';
        child.appendChild(link);
      }
    }
    this.titles = titles;

    const codeBlocks = div.getElementsByTagName('code');
    if (codeBlocks && codeBlocks.length > 0) {
      for (const codeBlock of codeBlocks) {
        const parent = codeBlock.parentElement;
        const lang = this.getLanguageName(codeBlock.classList);
        if (lang) {
          if (lang === 'mermaid') {
            if (parent && parent.tagName === 'PRE') {
              const mermaidPre = document.createElement('pre');
              mermaidPre.className = "mermaid";
              mermaidPre.innerHTML = codeBlock.innerHTML;
              parent.style.display = 'none';
              parent.insertAdjacentElement('beforebegin', mermaidPre);
            }
            continue;
          }
          if (hljs.autoDetection(lang)) {
            codeBlock.innerHTML = hljs.highlight(codeBlock.textContent || '', {
              language: lang,
              ignoreIllegals: true,
            }).value;
          }
        }
        if (parent && parent.tagName === 'PRE') {
          codeBlock.classList.add('hljs');
          const copy = document.createElement('span');
          copy.className = 'material-icons mat-mdc-icon-button code-copy';
          copy.innerHTML = 'content_copy';
          copy.title = '拷贝到剪切板';
          parent.appendChild(copy);
        }
      }
    }
    return div.innerHTML;
  }

  getLanguageName(classList: DOMTokenList) {
    for (const clazz of classList) {
      if (clazz.startsWith('language-')) {
        return clazz.substring(9);
      }
    }
    return null;
  }

  download() {
    const a = document.createElement('a');
    const href = this.url();
    a.href = href;
    a.download = href.substring(href.lastIndexOf('/') + 1);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
