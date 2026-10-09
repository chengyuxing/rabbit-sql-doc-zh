import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);
  resourceService = inject(ResourceService);
  uiStatesService = inject(UiStatesService);
  router = inject(Router);

  isOpen = false;

  docId?: string;

  get docs() {
    return this.resourceService.docs;
  }

  ngOnInit(): void {
    this.uiStatesService.currentDocId.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(docId => {
      this.docId = docId;
    });
    this.uiStatesService.showDocumentToggleBtn.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(toggle => {
      this.isOpen = toggle;
    });
  }

  protected navigateTo(docs: Docs) {
    if (docs.external) {
      window.open(docs.external, '_blank');
      return;
    }
    this.router.navigate(['/documents', docs.id]);
  }
}
