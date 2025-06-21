import {Component, inject} from '@angular/core';
import {MatRipple} from '@angular/material/core';
import {RouterLink} from '@angular/router';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {ResourceService} from '../../common/resource.service';

@Component({
  selector: 'rabbit-sql-guides',
  imports: [
    MatRipple,
    RouterLink,
    MatCard,
    MatCardContent,
    MatCardTitle
  ],
  templateUrl: './guides.component.html',
  styleUrl: './guides.component.scss'
})
export class GuidesComponent {
  resourceService = inject(ResourceService);

  get allGuides() {
    return this.resourceService.guides;
  }
}
