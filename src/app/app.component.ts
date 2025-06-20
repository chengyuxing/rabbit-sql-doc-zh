import {Component, inject, OnInit} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon, MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {MatButton, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs';
import {UiStatesService} from './common/ui-states.service';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {docs, github} from './common/resources';

@Component({
  selector: 'rabbit-sql-root',
  imports: [MatToolbar, MatIconButton, MatIcon, MatIconAnchor, RouterOutlet, RouterLink, MatButton, RouterLinkActive, MatMenu, MatMenuItem, MatMenuTrigger],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  router = inject(Router);
  uiStatesService = inject(UiStatesService);

  title = 'Rabbit-SQL';
  document = '文档';
  guides = '指南';

  showToggleButton = false;

  constructor(iconRegister: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegister.addSvgIcon('rabbit-sql', sanitizer.bypassSecurityTrustResourceUrl('images/rabbit-sql.svg'));
    iconRegister.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('images/github.svg'));
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

  toggleSideNav() {
    const currentState = this.uiStatesService.currentDocumentToggleState;
    this.uiStatesService.setShowDocumentToggleBtn(!currentState);
  }

  protected readonly docs = docs;
}
