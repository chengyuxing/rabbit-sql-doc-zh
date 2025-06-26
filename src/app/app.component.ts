import {Component, inject, OnInit} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon, MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {MatButton, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs';
import {UiStatesService} from './common/ui-states.service';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {gitee, github} from './common/global';
import {ResourceService} from './common/resource.service';
import {MatProgressBar} from '@angular/material/progress-bar';
import {LoadingService} from './common/loading.service';
import {AsyncPipe} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'rabbit-sql-root',
  imports: [MatToolbar, MatIconButton, MatIcon, MatIconAnchor, RouterOutlet, RouterLink, MatButton, RouterLinkActive, MatMenu, MatMenuItem, MatMenuTrigger, MatProgressBar, AsyncPipe, MatTooltip],
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

  title = 'Rabbit-SQL';
  document = '文档';
  guides = '指南';

  showToggleButton = false;

  get docs() {
    return this.resourceService.docs;
  }

  constructor() {
    this.iconRegister.addSvgIcon('rabbit-sql', this.sanitizer.bypassSecurityTrustResourceUrl('images/rabbit-sql.svg'));
    this.iconRegister.addSvgIcon('github', this.sanitizer.bypassSecurityTrustResourceUrl('images/github.svg'));
    this.iconRegister.addSvgIcon('gitee', this.sanitizer.bypassSecurityTrustResourceUrl('images/gitee.svg'));
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
    ).subscribe((event: any) => {
      const currentUrl = (event as NavigationEnd).urlAfterRedirects;
      this.showToggleButton = currentUrl.startsWith('/documents');
    })
  }

  protected readonly github = github;
  protected readonly gitee = gitee;

  toggleSideNav() {
    const currentState = this.uiStatesService.currentDocumentToggleState;
    this.uiStatesService.setShowDocumentToggleBtn(!currentState);
  }

}
