import {Routes} from '@angular/router';
import {GuidesComponent} from './guides.component';

export const routes: Routes = [
  {path: '', component: GuidesComponent},
  {path: ':id', loadComponent: () => import('./guide/guide.component').then(c => c.GuideComponent)},
];
