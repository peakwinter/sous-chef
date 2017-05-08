/* eslint-env browser */

import $ from 'jquery';
import {monthFormatter} from '../core/Utilities';


export default {
  init() {
    $('.billing-delete').click((event) => {
      const billingId = $(event.currentTarget).attr('data-billing-id');
      const selector = `.ui.basic.modal.billing-${billingId}`;
      $(selector).modal('show');
    });

    $('#billing_delivery_date').calendar({
      type: 'month',
      formatter: {date: monthFormatter},
    });

    $('.add.icon').popup();

    $('#create_billing').click(() => {
      $('.ui.dimmer').show();
    });
  },
};
