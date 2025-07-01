import {Component, inject, input} from '@angular/core';
import {QRCodeComponent} from 'angularx-qrcode';
import {MAT_DIALOG_DATA, MatDialogContent} from '@angular/material/dialog';

@Component({
  selector: 'rabbit-sql-qrcode',
  imports: [
    QRCodeComponent,
    MatDialogContent
  ],
  templateUrl: './qrcode.component.html',
  styleUrl: './qrcode.component.scss'
})
export class QrcodeComponent {
  data = inject(MAT_DIALOG_DATA);

  get content() {
    return this.data['content'];
  }
}
