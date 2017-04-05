/* eslint-env browser, jquery */

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


$(() => {
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
});
