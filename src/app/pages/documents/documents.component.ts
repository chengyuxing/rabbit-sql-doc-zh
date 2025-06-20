import {AfterViewInit, Component, inject, input, OnInit} from '@angular/core';
import {UiStatesService} from '../../common/ui-states.service';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatRipple} from '@angular/material/core';
import {MarkdownComponent} from '../../components/markdown/markdown.component';
import {ScrollService} from '../../common/scroll.service';
import {docs} from '../../common/resources';

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

  get url() {
    return `docs/guides/${this.id()}.md`;
  }

  uiStatesService = inject(UiStatesService);

  isOpen = false;

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

  protected readonly docs = docs;
}
