import {Component, inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'rabbit-sql-open-external-link-confirm',
  imports: [
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButton
  ],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss'
})
export class Confirm {
  dialogRef = inject(MatDialogRef<Confirm>);
  data = inject(MAT_DIALOG_DATA);
}
