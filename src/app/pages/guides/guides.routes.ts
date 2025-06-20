import {Routes} from '@angular/router';
import {GuidesComponent} from './guides.component';
import {GuideComponent} from './guide/guide.component';

export const routes: Routes = [
  {path: '', component: GuidesComponent},
  {path: ':id', component: GuideComponent},
];
