import {Component} from '@angular/core';
import {guides} from '../../common/resources';
import {Guide} from '../../common/types';
import {MatRipple} from '@angular/material/core';
import {RouterLink} from '@angular/router';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';

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
  get allGuides(): Array<Guide> {
    return guides;
  }
}
