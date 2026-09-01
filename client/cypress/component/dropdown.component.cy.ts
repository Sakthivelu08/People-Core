import { mount } from 'cypress/angular';
import { DropdownComponent } from '../../src/app/shared/components/dropdown/dropdown.component';

describe('DropdownComponent Cypress Component Test', () => {
  it('mounts and renders placeholder option', () => {
    mount(DropdownComponent, {
      componentProperties: {
        placeholder: 'Select Department',
        options: [
          { value: 'eng', label: 'Engineering' },
          { value: 'hr', label: 'Human Resources' }
        ]
      }
    });

    cy.contains('Select Department').should('be.visible');
  });

  it('opens options dropdown list on click', () => {
    mount(DropdownComponent, {
      componentProperties: {
        placeholder: 'Choose Role',
        options: [
          { value: 'admin', label: 'Administrator' },
          { value: 'emp', label: 'Employee' }
        ]
      }
    });

    cy.contains('Choose Role').click();
    cy.contains('Administrator').should('be.visible');
    cy.contains('Employee').should('be.visible');
  });
});
