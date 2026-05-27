import {Routes} from '@angular/router';
import {GuidesComponent} from './guides.component';

export const routes: Routes = [
  {path: '', component: GuidesComponent},
  {path: ':id', loadComponent: () => import('./guide/guide.component').then(c => c.GuideComponent)},
  {
    path: '**',
    data: {to: '/guides'},
    loadComponent: () => import('../not-found/not-found.component').then(c => c.NotFoundComponent)
  },
];
