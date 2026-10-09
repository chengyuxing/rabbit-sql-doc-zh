import {Component, inject} from '@angular/core';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {OverlayContainer} from '@angular/cdk/overlay';
import {MatMenuModule} from '@angular/material/menu';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Docs} from '../../../common/types';
import {ResourceService} from '../../../common/resource.service';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {NestedMenuComponent} from './nested-menu.component';

@Component({
  standalone: true,
  imports: [MatMenuModule, NestedMenuComponent],
  template: `
    <app-nested-menu #root [nodes]="nodes" (forward)="select($event)"/>
    <button [matMenuTriggerFor]="root.menu">打开菜单</button>
  `
})
class TestHostComponent {
  select = jasmine.createSpy('select');
  nodes: Docs[] = [
    {id: '1', title: '用户管理', children: [
      {id: '2', title: '任职单位管理', children: [{id: '3', title: '单位列表'}]}
    ]},
    {id: '4', title: '角色管理'}
  ];
}

@Component({
  standalone: true,
  imports: [MatMenuModule, NestedMenuComponent],
  template: `
    <app-nested-menu #root [nodes]="nodes" (forward)="select($event)"/>
    <button [matMenuTriggerFor]="root.menu">打开菜单</button>
  `
})
class ResourceTestHostComponent {
  resourceService = inject(ResourceService);
  select = jasmine.createSpy('select');

  get nodes() {
    return this.resourceService.docsTree.roots;
  }
}

describe('NestedMenuComponent', () => {
  it('opens multiple levels on hover, keeps parent menus open on click and forwards a leaf once', fakeAsync(() => {
    TestBed.configureTestingModule({imports: [TestHostComponent, NoopAnimationsModule]});
    const fixture = TestBed.createComponent(TestHostComponent);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const settle = () => { fixture.detectChanges(); tick(500); fixture.detectChanges(); };
    const item = (title: string) => Array.from(overlay.querySelectorAll<HTMLButtonElement>('[mat-menu-item]'))
      .find(button => button.querySelector('.mat-mdc-menu-item-text')?.textContent?.trim() === title)!;
    const panels = () => overlay.querySelectorAll('[role="menu"]').length;
    settle();
    fixture.nativeElement.querySelector('button').click();
    settle();
    expect(panels()).toBe(1);

    item('用户管理').dispatchEvent(new MouseEvent('mouseenter'));
    settle();
    expect(panels()).toBe(2);
    item('用户管理').click();
    settle();
    expect(panels()).toBe(2);
    expect(fixture.componentInstance.select).toHaveBeenCalledOnceWith(fixture.componentInstance.nodes[0]);
    fixture.componentInstance.select.calls.reset();

    item('任职单位管理').dispatchEvent(new MouseEvent('mouseenter'));
    settle();
    expect(panels()).toBe(3);
    item('单位列表').click();
    settle();
    expect(fixture.componentInstance.select).toHaveBeenCalledOnceWith({id: '3', title: '单位列表'});
    expect(panels()).toBe(0);

    // Missing children is a valid leaf, and replacing the module updates the menu.
    fixture.componentInstance.nodes = [{id: '5', title: '新模块页面'}];
    settle();
    fixture.nativeElement.querySelector('button').click();
    settle();
    expect(item('新模块页面')).toBeDefined();
    expect(item('用户管理')).toBeUndefined();
    item('新模块页面').click();
    settle();
    expect(panels()).toBe(0);
    fixture.destroy();
  }));
});

describe('ResourceService-backed nested menu', () => {
  it('loads HTTP nodes reactively and preserves open submenus through change detection', fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [ResourceTestHostComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(ResourceTestHostComponent);
    const service = fixture.componentInstance.resourceService;
    const http = TestBed.inject(HttpTestingController);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const settle = () => { fixture.detectChanges(); tick(500); fixture.detectChanges(); };
    const item = (title: string) => Array.from(overlay.querySelectorAll<HTMLButtonElement>('[mat-menu-item]'))
      .find(button => button.querySelector('.mat-mdc-menu-item-text')?.textContent?.trim() === title)!;
    const panels = () => overlay.querySelectorAll('[role="menu"]').length;

    settle();
    const emptyTree = service.docsTree;
    expect(fixture.componentInstance.nodes).toEqual([]);
    expect(service.docsTree).toBe(emptyTree);

    http.expectOne('datas/docs.json').flush({host: '_documents/', resources: [
      {id: 'root', title: '核心功能'},
      {id: 'queries', pid: 'root', title: '查询'},
      {id: 'page', pid: 'queries', title: '分页查询'}
    ]});
    http.expectOne('datas/guides.json').flush({host: '_guides/', resources: []});
    settle();
    const tree = service.docsTree;
    const nodes = fixture.componentInstance.nodes;
    expect(tree).not.toBe(emptyTree);
    expect(nodes.length).toBe(1);

    fixture.nativeElement.querySelector('button').click();
    settle();
    item('核心功能').dispatchEvent(new MouseEvent('mouseenter'));
    settle();
    expect(panels()).toBe(2);
    expect(service.docsTree).toBe(tree);
    expect(fixture.componentInstance.nodes).toBe(nodes);

    item('查询').dispatchEvent(new MouseEvent('mouseenter'));
    settle();
    expect(panels()).toBe(3);
    item('分页查询').click();
    settle();
    expect(fixture.componentInstance.select).toHaveBeenCalledOnceWith(tree.getNode('page')!);
    expect(panels()).toBe(0);
    http.verify();
    fixture.destroy();
  }));
});
