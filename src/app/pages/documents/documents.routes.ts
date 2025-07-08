import {Routes} from '@angular/router';
import {DocumentsComponent} from './documents.component';

export const routes: Routes = [
  {
    path: '', component: DocumentsComponent, children: [
      {path: '', loadComponent: () => import('./about/about.component').then(c => c.AboutComponent)},
      {path: ':id', loadComponent: () => import('./document/document.component').then(c => c.DocumentComponent)},
    ]
  }
];
