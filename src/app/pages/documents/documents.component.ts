import {Component, inject, OnInit} from '@angular/core';
import {UiStatesService} from '../../common/ui-states.service';
import {Router, RouterOutlet} from '@angular/router';
import {ResourceService} from '../../common/resource.service';
import {FolderMenuComponent} from './folder-menu/folder-menu.component';
import {Docs} from '../../common/types';

@Component({
  selector: 'rabbit-sql-documents',
  imports: [
    RouterOutlet,
    FolderMenuComponent
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent implements OnInit {
  resourceService = inject(ResourceService);
  uiStatesService = inject(UiStatesService);
  router = inject(Router);

  isOpen = false;

  docId?: string;

  get docs() {
    return this.resourceService.docs;
  }

  ngOnInit(): void {
    this.docId = location.pathname.split('/').pop();
    this.uiStatesService.showDocumentToggleBtn.subscribe(toggle => {
      this.isOpen = toggle;
    });
  }

  protected navigateTo(docs: Docs) {
    this.router.navigate(['/documents', docs.id]);
  }
}
