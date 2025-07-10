import {AfterViewInit, Component, inject, input} from '@angular/core';
import {MarkdownComponent} from '../../../components/markdown/markdown.component';
import {ScrollService} from '../../../common/scroll.service';
import {ResourceService} from '../../../common/resource.service';

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
  resourceService = inject(ResourceService);

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollService.scrollToCurrentHash(140), 100);
  }

  onAnAction(id: string) {
    this.scrollService.scrollTo(id, 140);
  }
}
