import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'documents',
    loadChildren: () => import('./pages/documents/documents.routes').then(m => m.routes)
  }, {
    path: 'guides',
    loadChildren: () => import('./pages/guides/guides.routes').then(m => m.routes)
  },
  {path: '', loadComponent: () => import('./pages/main/main.component').then(c => c.MainComponent)},
  {path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent)},
];
