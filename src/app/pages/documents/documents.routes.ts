import {Routes} from '@angular/router';
import {DocumentsComponent} from './documents.component';
import {DocumentComponent} from './document/document.component';
import {AboutComponent} from './about/about.component';

export const routes: Routes = [
  {
    path: '', component: DocumentsComponent, children: [
      {path: 'about', component: AboutComponent},
      {path: ':id', component: DocumentComponent},
      {path: '', redirectTo: 'about', pathMatch: 'full'},
    ]
  }
];
