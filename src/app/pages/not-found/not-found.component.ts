import {Component, input} from '@angular/core';

@Component({
  selector: 'rabbit-sql-not-found',
  imports: [],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  to = input<string>();
}
