/* eslint-env browser */
/* eslint max-statements:0 */

import $ from 'jquery';

function dismissFieldError(elem) {
  $(elem).closest('.error').removeClass('error');
}

function fillInDefaults() {
  $("#form_create_batch .accordion[id^='date-']").each((idx, elem) => {
    let clientMealsDefault;
    try {
      clientMealsDefault = $(elem).data('client-meals-default');  // auto JSON
    } catch (e) {
      return;
    }

    const date = $(elem).attr('id').slice(5);
    // fill in data
    $.each(clientMealsDefault, (key, value) => {
      const selector = `#id_${key}_${date}_quantity`;
      if (!$(selector).val()) {
        $(selector).val(value);
        dismissFieldError($(selector));
      }
    });
    if (Object.prototype.hasOwnProperty.call(clientMealsDefault, 'size')) {
      const selector = `#id_size_${date}`;
      if (!$(selector).dropdown('get value')[0]) {
        $(selector).dropdown('set selected', clientMealsDefault.size);
        dismissFieldError($(selector));
      }
    }
  });
}

function collectInactiveAccordionsDates() {
  const dates = [];
  $('#form_create_batch #order_create_batch_items .accordion')
    .has('.content:not(.active)').each((idx, elem) => {
      const id = $(elem).attr('id');
      const date = id.slice(5);
      dates.push(date);
    });
  $('#form_create_batch #id_accordions_active').val(dates.join('|'));
}


export default {
  init() {
    const $overrideModal = $('.ui.order-override.modal');

    $('#form_create_batch').submit((event) => {
      if (event.originalEvent && $('#id_is_submit').val() === '1') {
        const originalTarget = $(event.originalEvent.explicitOriginalTarget);
        const deliveryDates = ($('#id_delivery_dates').val() || '').split('|');
        const overrideDates = ($('#id_override_dates').val() || '').split('|');
        if (originalTarget.attr('id') === 'original-form-submit' &&
          $overrideModal.length && !arraysEqual(deliveryDates, overrideDates)) {
          event.preventDefault();
          $overrideModal.modal('show');
        }
      }
    });

    $('.order-override.cancel.button').click(() => {
      const deliveryDates = ($('#id_delivery_dates').val() || '').split('|');
      const datesToRemove = $overrideModal.data('orderDates').split('|');
      const newDeliveryDates = deliveryDates.filter(i =>
        datesToRemove.indexOf(i) === -1);

      $('#id_delivery_dates').val(newDeliveryDates.join('|'));
      $('#form_create_batch #id_is_submit').val('0');
      $('#form_create_batch').submit();
    });

    $('.order-override.override.button').click(() => {
      $('#id_override_dates').val($('#id_delivery_dates').val());
      $('#form_create_batch #id_is_submit').val('1');
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
      const sortA = a.map(i => !!i).sort();
      const sortB = b.map(i => !!i).sort();
      for (let i = 0; i < a.length; i += 1) {
        if (sortA[i] !== sortB[i]) {
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

    $('#id_client').change((event) => {
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

    // LXYANG: rename this file as orderbatchcreate.js?
    // Place batch orders

    // Initialize delivery dates
    const initialDates = [];
    $.each(
      ($('#id_delivery_dates').val() || '').split('|'),
      (idx, elem) => {
        if (elem) initialDates.push(elem);
      });

    const orderedDates = [];
    $.each(
      ($('#delivery_dates').data('orderedDates') || '').split('|'),
      (idx, elem) => {
        if (elem) orderedDates.push(elem);
      });
    const orderedDateTooltip = $('#delivery_dates').data('orderedDateTooltip');

    // --
    // Init multidatepicker on input directly would be simpler, but a glitch
    //  would appear, so I init multidatespicker on an empty div#delivery_dates
    //  and link it to an HTML input#id_delivery_dates using altField option
    // https://github.com/dubrox/Multiple-Dates-Picker-for-jQuery-UI/issues/162
    const mdpConfig = {
      dateFormat: 'yy-mm-dd',  // Example: 2017(yy)-03(mm)-24(dd).
      separator: '|',
      minDate: 0,
      numberOfMonths: 2,
      // Don't highlight today. It confuses the user.
      // See the overriden _updateDatepicker method.
      disableTodayHighlight: true,
      // At the server side, the max length of the altField is 200.
      // Therefore 200/11 = 18.
      maxPicks: 18,
      altField: '#id_delivery_dates',
      onSelect: () => {
        $('#form_create_batch #id_is_submit').val('0');
        $('#form_create_batch').submit();
      },
      beforeShowDay: (date) => {
        const dateStr = $.datepicker.formatDate('yy-mm-dd', date);
        if (orderedDates.indexOf(dateStr) !== -1) {
          return [true, 'ordered-date', orderedDateTooltip];
        }
        return [true, '', null];
      },
    };
    if ($.isArray(initialDates) && initialDates.length > 0) {
      // Don't add this when initial_dates is an empty array.
      // MultiDatesPicker will raise an error in this case.
      mdpConfig.addDates = initialDates;
    }
    $('#delivery_dates').multiDatesPicker(mdpConfig);

    $('.ui.accordion.meals').show();

    fillInDefaults();

    $('#form_create_batch #id_client .ui.dropdown')
      .dropdown('setting', 'onChange', () => {
        // on client change, update the form to update the client default.
        $('#form_create_batch #id_is_submit').val('0');
        $('#form_create_batch').submit();
      });

    $('#form_create_batch').on('submit', collectInactiveAccordionsDates);
  },
};
