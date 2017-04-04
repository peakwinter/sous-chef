/* eslint-env browser, jquery */
/* eslint max-statements:0 */

$(() => {
  // Javascript of the order application.
  // **************************************

  var $overrideModal = $('.ui.order-override.modal');

  $('#form_create_batch').submit(function(event) {
    if(event.originalEvent && $('#id_is_submit').val() === '1') {
      var originalTarget = $(event.originalEvent.explicitOriginalTarget);
      var deliveryDates = ($('#id_delivery_dates').val() || '').split('|');
      var overrideDates = ($('#id_override_dates').val() || '').split('|');
      if(originalTarget.attr('id') === 'original-form-submit' &&
        $overrideModal.length && !arraysEqual(deliveryDates, overrideDates)) {
        event.preventDefault();
        $overrideModal.modal('show');
      }
    }
  });

  $('.order-override.cancel.button').click(function() {
    var deliveryDates = ($('#id_delivery_dates').val() || '').split('|');
    var datesToRemove = $overrideModal.data('orderDates').split('|');
    var newDeliveryDates = deliveryDates.filter(function(i) {
      return datesToRemove.indexOf(i) === -1;
    });

    $('#id_delivery_dates').val(newDeliveryDates.join('|'));
    $('#form_create_batch #id_is_submit').val("0");
    $('#form_create_batch').submit();
  });

  $('.order-override.override.button').click(function() {
    $('#id_override_dates').val($('#id_delivery_dates').val());
    $('#form_create_batch #id_is_submit').val("1");
    $('#form_create_batch').submit();
  });

  $('.order-delete').click((event) => {
    const orderId = $(event.currentTarget).data('orderId');
    const selector = `.ui.basic.modal.order-${orderId}`;
    $(selector).modal('show');
  });

  function updateOtherFieldStatus() {
    const value =
      $('input[name=reason_select]:checked', '#change-status-form').val();
    if (value !== 'other') {
      $('#reason_other_field textarea').attr('disabled', 'disabled');
    } else {
      $('#reason_other_field textarea').removeAttr('disabled');
    }
  }

  function addReasonSelectListener() {
    $('#reason_select_group input').on('change', updateOtherFieldStatus);
  }

  function arraysEqual(a, b) {
      var sortA = a.map(function(i) { return !!i; }).sort();
      var sortB = b.map(function(i) { return !!i; }).sort();
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
  }

  $('.ui.dropdown.order.status .menu > .item').click((event) => {
    $('.ui.dropdown.order.status').addClass('loading');
    const value = $(event.currentTarget).data('value');
    const modalCtntURL = $('.ui.dropdown.status').data('url');
    $.get(modalCtntURL, {status: value}, (data) => {
      $('.ui.dropdown.order.status').removeClass('loading');
      const modal = $('.ui.modal.status').html(data).modal('setting', {
        closable: false,
        // Inside modal init
        onVisible: () => {
          // Enable dropdown
          $('.ui.status_to.dropdown').dropdown();
          addReasonSelectListener();
          updateOtherFieldStatus();
        },
        // When approving modal, submit form
        onApprove: () => {
          const origdata = $('#change-status-form').serializeArray();
          const origdataObj = {};
          $.each(origdata, (idx, ele) => {
            origdataObj[ele.name] = ele.value;  // build object
          });
          if (origdataObj.reason_select !== 'other') {
            origdataObj.reason = origdataObj.reason_select;
          }
          delete origdataObj.reason_select;
          const postData = $.param(origdataObj);

          $.ajax({
            type: 'POST',
            url: $('.ui.dropdown.status').attr('data-url'),
            data: postData,
            success: (xhr) => {
              if ($(xhr).find('.errorlist').length > 0) {
                $('.ui.modal.status').html(xhr);
                $('.ui.status_to.dropdown').dropdown();
                addReasonSelectListener();
                updateOtherFieldStatus();
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
          $('.ui.dropdown.status').dropdown('restore defaults');
          $('.ui.modal.status').modal('hide');
        },
      });
      modal.modal('setting', 'autofocus', false).modal('show');
    });
  });

  $('#id_delivery_dates').hide();

  $('#id_client').change(() => {
    $.get($(event.currentTarget).attr('data-url'), (data) => {
      if (!$.isEmptyObject(data)) {
        $('#id_main_dish_default_quantity').val(data.maindish_q);
        $('#id_size_default').dropdown('set selected', data.maindish_s);
        $('#id_dessert_default_quantity').val(data.dst_q);
        $('#id_diabetic_default_quantity').val(data.diabdst_q);
        $('#id_fruit_salad_default_quantity').val(data.fruitsld_q);
        $('#id_green_salad_default_quantity').val(data.greensld_q);
        $('#id_pudding_default_quantity').val(data.pudding_q);
        $('#id_compote_default_quantity').val(data.compot_q);
      } else {
        $('#id_main_dish_default_quantity').val('');
        $('#id_size_default').val('');
        $('#id_dessert_default_quantity').val('');
        $('#id_diabetic_default_quantity').val('');
        $('#id_fruit_salad_default_quantity').val('');
        $('#id_green_salad_default_quantity').val('');
        $('#id_pudding_default_quantity').val('');
        $('#id_compote_default_quantity').val('');
      }
    });
  });
});
