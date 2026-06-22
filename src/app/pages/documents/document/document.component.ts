import {AfterViewInit, Component, computed, inject, input} from '@angular/core';
import {MarkdownComponent} from '../../../components/markdown/markdown.component';
import {ScrollService} from '../../../common/scroll.service';
import {ResourceService} from '../../../common/resource.service';

@Component({
  selector: 'rabbit-sql-document',
  imports: [
    MarkdownComponent
  ],
  templateUrl: './document.component.html',
  styleUrl: './document.component.scss'
})
export class DocumentComponent implements AfterViewInit {
  scrollService = inject(ScrollService);
  resourceService = inject(ResourceService);

  id = input.required<string>();

  readonly docUrl = computed(() => this.resourceService.geDocFileUrl(this.id()));

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollService.scrollToCurrentHash(140), 100);
  }

  onAnAction(id: string) {
    this.scrollService.scrollTo(id, 140)
  }
}
