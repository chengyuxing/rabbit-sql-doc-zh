import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from "@angular/material/icon";
import {MatRippleModule} from "@angular/material/core";
import {debounceTime, distinctUntilChanged, map, Subject} from "rxjs";
import {Tree} from '../../../common/tree';
import {Docs} from '../../../common/types';

@Component({
  selector: 'app-folder-menu',
  imports: [CommonModule, MatIconModule, MatRippleModule],
  templateUrl: './folder-menu.component.html',
  styleUrls: ['./folder-menu.component.scss']
})
export class FolderMenuComponent implements OnInit, OnChanges {
  @Input() datasource: Docs[] = [];
  @Input() currentId?: string;
  @Output() forward = new EventEmitter<Docs>();
  @Output() backward = new EventEmitter<Docs>();

  tree!: Tree<Docs, string>;

  searchTerms$ = new Subject<string>();

  displayData: Docs[] = [];
  path: Docs[] = [];

  get menuTitle() {
    return this.path[0]?.title;
  }

  ngOnInit(): void {
    this.searchTerms$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(term => term.trim())
    ).subscribe(term => {
      if (term) {
        const ids = this.tree.search(n => n.title.toLowerCase().includes(term.toLowerCase()));
        this.displayData = ids.map(id => this.tree.getNode(id)!);
      } else {
        this.displayData = this.tree.roots;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datasource']) {
      this.tree = new Tree(changes['datasource'].currentValue);
      if (this.currentId) {
        this.initMenu(this.currentId);
      }
    }
    if (changes['currentId']) {
      const id = changes['currentId'].currentValue;
      this.initMenu(id);
    }
  }

  protected initMenu(id: string) {
    const node = this.tree.getNode(id);
    if (!node) {
      this.displayData = this.tree.roots;
      return;
    }
    if (node.children && node.children.length > 0) {
      this.displayData = node.children;
      this.path = [node];
    } else {
      this.displayData = this.tree.getSiblings(id);
      this.path = this.tree.getAncestors(id);
    }
  }

  protected searchMenu(value: string) {
    this.searchTerms$.next(value);
  }

  protected forwardMenu(node: Docs) {
    const children = node.children!;
    if (children.length > 0) {
      this.path.unshift(node);
      this.displayData = children;
    }
    this.currentId = node.id;
    this.forward.emit(node);
  }

  protected backwardMenu() {
    if (this.path.length > 0) {
      const node = this.path.shift();
      const last = this.path[0];
      if (last) {
        this.displayData = last.children!;
      } else {
        this.displayData = this.tree.roots;
      }
      this.backward.emit(node);
    }
  }
}
