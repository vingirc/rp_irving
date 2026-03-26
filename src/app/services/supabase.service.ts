import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Example: Get all groups
  async getGroups() {
    const { data, error } = await this.supabase
      .from('grupos')
      .select('*');
    return { data, error };
  }

  // Tickets
  async getTicketsByGroup(groupId: string) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*, estados(*), prioridades(*)')
      .eq('grupo_id', groupId);
    return { data, error };
  }

  // Users
  async getUsers() {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*');
    return { data, error };
  }

  async updateUser(user: any) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .update({
        nombre_completo: user.nombre_completo || user.fullName, // Support both for now
        username: user.username,
        email: user.email,
        permisos_globales: user.permisos_globales || user.permissions
      })
      .eq('id', user.id);
    return { data, error };
  }

  async deleteUser(id: string) {
    const { error } = await this.supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    return { error };
  }
}
