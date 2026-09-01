import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.scss']
})
export class DirectoryComponent implements OnInit {
  employees = signal<any[]>([]);
  loading = signal<boolean>(true);

  selectedDept = signal<string>('All');
  searchQuery = signal<string>('');

  departments = ['All', 'Engineering', 'HR', 'Sales', 'Support'];

  filteredEmployees = computed(() => {
    let list = this.employees();
    const dept = this.selectedDept();
    const q = this.searchQuery().toLowerCase().trim();

    if (dept !== 'All') {
      list = list.filter(e => (e.department || 'General') === dept);
    }

    if (q) {
      list = list.filter(e => 
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.job_title?.toLowerCase().includes(q)
      );
    }

    return list;
  });

  private api = inject(ApiService);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load employee directory:', err);
        this.loading.set(false);
      }
    });
  }

  setDepartment(dept: string) {
    this.selectedDept.set(dept);
  }
}
