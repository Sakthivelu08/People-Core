import { mount } from 'cypress/angular';
import { DatePickerComponent } from '../../src/app/shared/components/date-picker/date-picker.component';

describe('DatePickerComponent Cypress Component Test', () => {
  it('mounts date picker with placeholder', () => {
    mount(DatePickerComponent, {
      componentProperties: {
        placeholder: 'Select start date',
        theme: 'employee'
      }
    });

    cy.contains('Select start date').should('be.visible');
  });

  it('opens calendar grid on trigger click', () => {
    mount(DatePickerComponent, {
      componentProperties: {
        placeholder: 'Select date',
        theme: 'admin'
      }
    });

    cy.contains('Select date').click();
    cy.contains('Today').should('be.visible');
    cy.contains('Clear').should('be.visible');
  });
});
