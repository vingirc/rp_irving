import { Component } from '@angular/core';
import { RouterModule, Router, Route } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  menuItems: any[] = [];

  constructor(private router: Router) {
    this.generateMenu();
  }

  generateMenu() {
    const homeRoute = this.router.config.find(r => r.path === 'home');
    if (homeRoute && homeRoute.children) {
      this.menuItems = homeRoute.children
        .filter(route => route.data && route.data['title'])
        .map(route => ({
          path: `/home${route.path ? '/' + route.path : ''}`,
          title: route.data!['title'],
          icon: route.data!['icon'],
          exact: route.path === ''
        }));
    }
  }
}
