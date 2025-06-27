import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: 'main', loadComponent: () => import('./pages/main/main.component').then(c => c.MainComponent)},
  {
    path: 'documents',
    loadChildren: () => import('./pages/documents/documents.routes').then(m => m.routes)
  }, {
    path: 'guides',
    loadChildren: () => import('./pages/guides/guides.routes').then(m => m.routes)
  },
  {path: '', redirectTo: 'main', pathMatch: 'full'},
  {path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent)},
];
