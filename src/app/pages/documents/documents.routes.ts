import {Routes} from '@angular/router';
import {DocumentsComponent} from './documents.component';

export const routes: Routes = [
  {path: '', component: DocumentsComponent},
  {path: ':id', component: DocumentsComponent},
];
