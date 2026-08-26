import { Pipe, PipeTransform } from '@angular/core';
import { beautifyDate } from '../../core/utils/date.utils';

@Pipe({
  name: 'beautifulDate',
  standalone: true
})
export class BeautifulDatePipe implements PipeTransform {
  transform(value: any): string {
    return beautifyDate(value);
  }
}
