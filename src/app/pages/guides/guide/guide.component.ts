import {AfterViewInit, Component, inject, input} from '@angular/core';
import {MarkdownComponent} from '../../../components/markdown/markdown.component';
import {ScrollService} from '../../../common/scroll.service';

@Component({
  selector: 'rabbit-sql-guide',
  imports: [
    MarkdownComponent
  ],
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.scss'
})
export class GuideComponent implements AfterViewInit {
  id = input.required<string>();

  scrollService = inject(ScrollService);

  get url() {
    return `docs/guides/${this.id()}.md`;
  }

  ngAfterViewInit(): void {
    this.scrollService.scrollToCurrentHash(140);
  }

  onAnAction(id: string) {
    this.scrollService.scrollTo(id, 140);
  }
}
