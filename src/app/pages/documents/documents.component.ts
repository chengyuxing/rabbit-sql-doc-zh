import {Component, inject, input, OnInit} from '@angular/core';
import {UiStatesService} from '../../common/ui-states.service';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatRipple} from '@angular/material/core';
import {ResourceService} from '../../common/resource.service';

@Component({
  selector: 'rabbit-sql-documents',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatRipple,
    RouterOutlet
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent implements OnInit {
  id = input<string>();

  resourceService = inject(ResourceService);
  uiStatesService = inject(UiStatesService);

  isOpen = false;

  get docs() {
    return this.resourceService.docs;
  }

  ngOnInit(): void {
    this.uiStatesService.showDocumentToggleBtn.subscribe(toggle => {
      this.isOpen = toggle;
    })
  }
}
