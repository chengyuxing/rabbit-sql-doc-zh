import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {provideHttpClient} from '@angular/common/http';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AppComponent} from '../../app.component';
import {ResourceService} from '../../common/resource.service';
import {ThemeService} from '../../common/theme.service';
import {UiStatesService} from '../../common/ui-states.service';
import {Tree} from '../../common/tree';
import {Docs} from '../../common/types';
import {DocumentsComponent} from './documents.component';

@Component({standalone: true, template: ''})
class EmptyPageComponent {}

describe('Document menu state', () => {
  it('syncs document navigation, clears non-document IDs and releases destroyed subscriptions', async () => {
    const docs: Docs[] = [
      {id: 'core-baki', title: '核心接口'},
      {id: 'core-args', title: '参数对象'}
    ];
    TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([
          {path: 'documents', component: DocumentsComponent, children: [
            {path: '', component: EmptyPageComponent},
            {path: ':id', component: EmptyPageComponent}
          ]},
          {path: 'guides/:id', component: EmptyPageComponent},
          {path: 'legacy', redirectTo: 'documents/core-baki', pathMatch: 'full'},
          {path: '', component: EmptyPageComponent, pathMatch: 'full'}
        ]),
        {provide: ResourceService, useValue: {docs, docsTree: new Tree(docs)}},
        {provide: ThemeService, useValue: {}}
      ]
    }).overrideComponent(AppComponent, {set: {template: '', imports: []}});

    // Its constructor owns the real NavigationEnd subscription; the harness renders document pages.
    const appFixture = TestBed.createComponent(AppComponent);
    const app = appFixture.componentInstance;
    const states = TestBed.inject(UiStatesService);
    let sharedId: string | undefined;
    const subscription = states.currentDocId.subscribe(id => sharedId = id);
    const harness = await RouterTestingHarness.create('/legacy');
    const page = harness.routeDebugElement!.componentInstance as DocumentsComponent;
    expect(app.docId).toBe('core-baki');
    expect(sharedId).toBe('core-baki');
    expect(page.docId).toBe('core-baki');
    expect(app.showToggleButton).toBeTrue();

    await harness.navigateByUrl('/documents/core-args?mode=compact#section');
    expect(harness.routeDebugElement!.componentInstance).toBe(page);
    expect(app.docId).toBe('core-args');
    expect(sharedId).toBe('core-args');
    expect(page.docId).toBe('core-args');
    states.setShowDocumentToggleBtn(false);
    expect(page.isOpen).toBeFalse();

    await harness.navigateByUrl('/guides/core-args');
    expect(app.docId).toBeUndefined();
    expect(sharedId).toBeUndefined();
    expect(app.showToggleButton).toBeFalse();
    states.setCurrentDocId('later');
    states.setShowDocumentToggleBtn(true);
    expect(page.docId).toBe('core-args');
    expect(page.isOpen).toBeFalse();

    await harness.navigateByUrl('/documents');
    const reopened = harness.routeDebugElement!.componentInstance as DocumentsComponent;
    expect(reopened).not.toBe(page);
    expect(reopened.docId).toBeUndefined();
    expect(app.docId).toBeUndefined();
    expect(sharedId).toBeUndefined();
    expect(app.showToggleButton).toBeTrue();
    expect(reopened.isOpen).toBeTrue();

    await harness.navigateByUrl('/documents/core-baki');
    expect(app.docId).toBe('core-baki');
    expect(reopened.docId).toBe('core-baki');
    await harness.navigateByUrl('/');
    expect(app.docId).toBeUndefined();
    expect(sharedId).toBeUndefined();
    expect(app.showToggleButton).toBeFalse();
    subscription.unsubscribe();
    appFixture.destroy();
  });
});
