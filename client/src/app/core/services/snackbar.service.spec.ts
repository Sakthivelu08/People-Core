import { SnackbarService } from './snackbar.service';

describe('SnackbarService Unit Tests', () => {
  let service: SnackbarService;

  beforeEach(() => {
    service = new SnackbarService();
  });

  it('should emit success, error, warning, and info alerts', (done) => {
    let count = 0;
    service.alerts$.subscribe(alert => {
      count++;
      expect(alert.message).toBeDefined();
      if (count === 4) done();
    });

    service.success('Success alert');
    service.error('Error alert');
    service.warning('Warning alert');
    service.info('Info alert');
  });
});
