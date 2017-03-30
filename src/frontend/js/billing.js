/* eslint-env browser, jquery */

$(() => {
  // Javascript of the billing application
  // ****************************************

  $('.billing-delete').click(() => {
    const billingId = $(event.currentTarget).attr('data-billing-id');
    const selector = `.ui.basic.modal.billing-${billingId}`;
    $(selector).modal('show');
  });

  $('#billing_delivery_date').calendar({
    type: 'month',
    formatter: {
      date: (date) => {
        if (!date) return '';
        let month = date.getMonth() + 1;
        const year = date.getFullYear();
        if (month < 10) month = `0${month}`;
        return `${year}-${month}`;
      },
    },
  });

  $('.add.icon').popup();

  $('#create_billing').click(() => {
    $('.ui.dimmer').show();
  });
});
