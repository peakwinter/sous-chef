/* eslint-env browser, jquery */

export default {
  init() {
    $('.ui.dropdown.maindish.selection')
    .dropdown('setting', 'onChange', (value) => {
      const $url = $('.field.dish.selection').data('url');
      window.location.replace($url + value);
    });

    $('.button.orders').click((event) => {
      $('.button.orders i').addClass('loading');
      $.ajax({
        type: 'GET',
        url: $(event.currentTarget).attr('data-url'),
        success: (xhr) => {
          $('#generated-orders').html(xhr);
          const count = $('#generated-orders tbody tr').length;
          $('.orders-count span').html(count);
          $('.orders-count').attr('data-order-count', count);
          $('.button.orders i').removeClass('loading');
        },
      });
    });

    $('.ui.order.cancel.button').click(() => {
      const self = event.currentTarget;
      const modalCtntURL = $(self).attr('data-url');
      $.get(modalCtntURL, {status: 'C'}, (data) => {
        const modal = $('.ui.modal.status').html(data).modal('setting', {
          closable: false,
          // When approving modal, submit form
          onApprove: () => {
            const formData = $('#change-status-form').serializeArray();

            $.ajax({
              type: 'POST',
              url: $(self).attr('data-url'),
              data: formData,
              success: (xhr) => {
                if ($(xhr).find('.errorlist').length > 0) {
                  $('.ui.modal.status').html(xhr);
                } else {
                  $('.ui.modal.status').modal('hide');
                  location.reload();
                }
              },
            });
            return false; // don't hide modal until we have the response
          },
          // When denying modal, restore default value for status dropdown
          onDeny: () => {
            $('.ui.modal.status').modal('hide');
          },
        });
        modal.modal('setting', 'autofocus', false).modal('show');
      });
    });

    $('input[name=include_a_bill]').change((event) => {
      const self = event.currentTarget;
      const url = $(self).data('url');
      const checked = $(self).is(':checked');
      $.ajax({
        type: (checked) ? 'POST' : 'DELETE',
        url,
        success: () => {
          $(self).removeAttr('disabled');
        },
      });
      $(self).attr('disabled', 'disabled');
    });
  },
};
