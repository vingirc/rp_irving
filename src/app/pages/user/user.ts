import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CardModule, FieldsetModule, AvatarModule, ButtonModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {

}
