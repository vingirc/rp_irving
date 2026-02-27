import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CardModule],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group {

}
