import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatMenu, MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from "@angular/material/icon";
import {Docs} from '../../../common/types';

@Component({
  selector: 'app-nested-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule],
  template: `
    <mat-menu #menu="matMenu">
      <ng-template matMenuContent>
        <ng-container *ngFor="let node of nodes">
          <ng-container *ngIf="node.children?.length; else leaf">
            <app-nested-menu #child [nodes]="node.children || []"
                             [selectedNodeId]="selectedNodeId"
                             (forward)="forward.emit($event)"/>
            <button mat-menu-item (click)="forward.emit(node)"
                    [class.active]="node.id === selectedNodeId"
                    [matMenuTriggerFor]="child.menu">
              {{ node.title }}
            </button>
          </ng-container>
          <ng-template #leaf>
            <button mat-menu-item (click)="forward.emit(node)" [class.active]="node.id === selectedNodeId">
              @if (node.external) {
                <mat-icon>open_in_new</mat-icon>
              }
              {{ node.title }}
            </button>
          </ng-template>
        </ng-container>
      </ng-template>
    </mat-menu>
  `,
  styles: [`.active {
    background-color: rgba(170, 170, 170, 0.51);
  }`]
})
export class NestedMenuComponent {
  @Input() nodes: Docs[] = [];
  @Input() selectedNodeId?: string | number;
  @Output() forward = new EventEmitter<Docs>();
  // Each level declares its items inside its own MatMenu so Material can resolve the parent menu.
  @ViewChild('menu', {static: true}) menu!: MatMenu;
}
