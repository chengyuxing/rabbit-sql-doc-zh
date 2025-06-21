import {AfterViewInit, Component, inject, input, OnInit} from '@angular/core';
import {UiStatesService} from '../../common/ui-states.service';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatRipple} from '@angular/material/core';
import {MarkdownComponent} from '../../components/markdown/markdown.component';
import {ScrollService} from '../../common/scroll.service';
import {ResourceService} from '../../common/resource.service';

@Component({
  selector: 'rabbit-sql-documents',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatRipple,
    MarkdownComponent
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent implements OnInit, AfterViewInit {
  id = input<string>();

  scrollService = inject(ScrollService);
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

  ngAfterViewInit(): void {
    this.scrollService.scrollToCurrentHash(140);
  }

  onAnAction(id: string) {
    this.scrollService.scrollTo(id, 140)
  }

}
