import {Routes} from '@angular/router';
import {MainComponent} from './pages/main/main.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';

export const routes: Routes = [
  {path: 'main', component: MainComponent},
  {
    path: 'documents',
    loadChildren: () => import('./pages/documents/documents.routes').then(m => m.routes)
  }, {
    path: 'guides',
    loadChildren: () => import('./pages/guides/guides.routes').then(m => m.routes)
  },
  {path: '', redirectTo: 'main', pathMatch: 'full'},
  {path: '**', component: NotFoundComponent}
];
