import {Component, inject, input, OnInit} from '@angular/core';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent
} from '@angular/material/sidenav';
import {UiStatesService} from '../../common/ui-states.service';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {docs} from '../../common/resources';
import {MatRipple} from '@angular/material/core';
import {MarkdownComponent} from '../../components/markdown/markdown.component';
import {ScrollService} from '../../common/scroll.service';

@Component({
  selector: 'rabbit-sql-documents',
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    RouterLink,
    RouterLinkActive,
    MatRipple,
    MarkdownComponent
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent implements OnInit {
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

  get documents() {
    return docs;
  }

  onAnAction(id: string) {
      this.scrollService.scrollTo(id, 0)
  }
}
