import {Component, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon, MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer, Title} from '@angular/platform-browser';
import {MatButton, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {
  NavigationCancel,
  NavigationEnd, NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import {UiStatesService} from './common/ui-states.service';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {appName, appTitle, appVersion, github} from './common/global';
import {ResourceService} from './common/resource.service';
import {MatProgressBar} from '@angular/material/progress-bar';
import {LoadingService} from './common/loading.service';
import {CommonModule} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';
import mermaid from 'mermaid';
import {ThemeService} from './common/theme.service';
import {NestedMenuComponent} from './pages/documents/nested-menu/nested-menu.component';
import {Docs} from './common/types';

@Component({
  selector: 'rabbit-sql-root',
  imports: [CommonModule, MatToolbar, MatIconButton, MatIcon, MatIconAnchor, RouterOutlet, RouterLink, MatButton, RouterLinkActive, MatMenu, MatMenuItem, MatMenuTrigger, MatProgressBar, MatTooltip, NestedMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  router = inject(Router);
  uiStatesService = inject(UiStatesService);
  resourceService = inject(ResourceService);
  loadingService = inject(LoadingService);
  iconRegister = inject(MatIconRegistry);
  sanitizer = inject(DomSanitizer);
  title = inject(Title);
  themeService = inject(ThemeService);

  document = '文档';
  guides = '指南';

  themeMode = [
    {icon: 'contrast', name: '跟随系统'},
    {icon: 'light_mode', name: '浅色'},
    {icon: 'dark_mode', name: '深色'}
  ];

  docId?: string;

  currentTheme?: string;

  showToggleButton = false;

  loading = false;

  get docsTree() {
    return this.resourceService.docsTree.roots;
  }

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else {
        if (event instanceof NavigationEnd) {
          const currentUrl = event.urlAfterRedirects;
          const segments = this.router.parseUrl(currentUrl).root.children['primary']?.segments || [];
          this.showToggleButton = segments[0]?.path === 'documents';
          this.docId = this.showToggleButton && segments.length === 2 ? segments[1].path : undefined;
          this.uiStatesService.setCurrentDocId(this.docId);
          if (!/\/(documents|guides)\/\w+/.test(currentUrl)) {
            this.title.setTitle(appTitle);
          }
        }
        if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.loading = false;
        }
      }
    });
    this.iconRegister.addSvgIcon('rabbit-sql', this.sanitizer.bypassSecurityTrustResourceUrl('images/rabbit-sql.svg'));
    this.iconRegister.addSvgIcon('github', this.sanitizer.bypassSecurityTrustResourceUrl('images/github.svg'));
  }

  ngOnInit(): void {
    this.themeService.observe().subscribe(isDark => {
      this.updateTheme(isDark);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme === this.themeMode[0].icon) {
        if (this.uiStatesService.isPrinting) {
          return;
        }
        this.themeService.changeTheme(e.matches);
      }
    });

    this.currentTheme = localStorage.getItem('theme') || this.themeMode[0].icon;
    this.toggleTheme(this.currentTheme);
  }

  protected readonly github = github;
  protected readonly appName = appName;
  protected readonly appVersion = appVersion;

  protected navigateTo(docs: Docs) {
    if (docs.external) {
      window.open(docs.external, '_blank');
      return;
    }
    this.router.navigate(['/documents', docs.id]);
  }

  toggleSideNav() {
    const currentState = this.uiStatesService.currentDocumentToggleState;
    this.uiStatesService.setShowDocumentToggleBtn(!currentState);
  }

  toggleTheme(mode: string) {
    let dark: boolean;
    if (mode === 'contrast') {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      dark = mode === this.themeMode[2].icon;
    }
    this.themeService.changeTheme(dark);
    this.currentTheme = mode;
    localStorage.setItem('theme', mode);
  }

  updateTheme(isDark: boolean) {
    document.documentElement.classList.toggle('dark', isDark);
    const link = document.getElementById('hljs-theme') as HTMLLinkElement;
    link.href = isDark
      ? 'hljs-styles/github-dark.css'
      : 'hljs-styles/github.css';
    const mTheme = isDark ? 'dark' : 'default';
    mermaid.initialize({startOnLoad: true, theme: mTheme});
  }
}
