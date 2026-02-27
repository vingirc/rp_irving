import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, Sidebar, AvatarModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {

}
