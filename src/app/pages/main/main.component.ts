import {Component, inject} from '@angular/core';
import {MatAnchor, MatFabAnchor} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatDivider} from '@angular/material/divider';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatRipple} from '@angular/material/core';
import {github} from '../../common/global';
import {ResourceService} from '../../common/resource.service';

@Component({
  selector: 'rabbit-sql-main',
  imports: [
    MatFabAnchor,
    MatIcon,
    RouterLink,
    MatDivider,
    RouterLinkActive,
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatRipple,
    MatAnchor
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  protected readonly github = github;
  year = new Date().getFullYear();
  resourceService = inject(ResourceService);

  get guidesTop3() {
    return this.resourceService.guides.slice(0, 3);
  }
}
