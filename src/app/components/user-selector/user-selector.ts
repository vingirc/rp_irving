import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { User } from '../../models/ticket.model';

@Component({
  selector: 'app-user-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  templateUrl: './user-selector.html',
  styleUrl: './user-selector.css'
})
export class UserSelectorComponent {
  /** Array of users to display in the dropdown */
  @Input() users: User[] = [];

  /** The currently selected user */
  @Input() selectedUser: User | null = null;

  /** Placeholder text for the dropdown */
  @Input() placeholder: string = 'Seleccionar usuario...';

  /** Whether the dropdown is disabled */
  @Input() disabled: boolean = false;

  /** Emitted when the user selects a new user */
  @Output() selectedUserChange = new EventEmitter<User | null>();

  onUserChange(event: any) {
    this.selectedUserChange.emit(this.selectedUser);
  }
}
