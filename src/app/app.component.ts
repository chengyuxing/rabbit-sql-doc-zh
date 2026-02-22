import {Component, inject} from '@angular/core';
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
import {appName, appTitle, github} from './common/global';
import {ResourceService} from './common/resource.service';
import {MatProgressBar} from '@angular/material/progress-bar';
import {LoadingService} from './common/loading.service';
import {CommonModule} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'rabbit-sql-root',
  imports: [CommonModule, MatToolbar, MatIconButton, MatIcon, MatIconAnchor, RouterOutlet, RouterLink, MatButton, RouterLinkActive, MatMenu, MatMenuItem, MatMenuTrigger, MatProgressBar, MatTooltip],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  router = inject(Router);
  uiStatesService = inject(UiStatesService);
  resourceService = inject(ResourceService);
  loadingService = inject(LoadingService);
  iconRegister = inject(MatIconRegistry);
  sanitizer = inject(DomSanitizer);
  title = inject(Title);

  document = '文档';
  guides = '指南';

  showToggleButton = false;

  loading = false;

  get docs() {
    return this.resourceService.docs;
  }

  constructor() {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else {
        if (event instanceof NavigationEnd) {
          const currentUrl = (event as NavigationEnd).urlAfterRedirects;
          this.showToggleButton = currentUrl.startsWith('/documents');
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

  protected readonly github = github;
  protected readonly appName = appName;

  toggleSideNav() {
    const currentState = this.uiStatesService.currentDocumentToggleState;
    this.uiStatesService.setShowDocumentToggleBtn(!currentState);
  }
}
