/* eslint-env browser, jquery */
/* eslint max-statements:0 */

import L from 'leaflet';

import MapComponent from '../components/MapComponent';
import {dateFormatter, distance} from '../core/Utilities';

let mymap;


export default {
  init() {
    mymap = MapComponent.init();

    $('.ui.dropdown.member.status > .menu > .item').click((event) => {
      const value = $(event.currentTarget).data('value');
      const today = new Date();
      const modalCtntURL = $('.ui.dropdown.status').data('url');
      $.get(modalCtntURL, {status: value}, (data) => {
        const modal = $('.ui.modal.status').html(data).modal('setting', {
          closable: false,
          // Inside modal init
          onVisible: () => {
            // Enable status confirmation dropdown
            $('.ui.status_to.dropdown').dropdown();
            // Init dates field (start and end)
            $('#rangestart').calendar({
              type: 'date',
              on: 'click',
              minDate: new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()),
              formatter: {date: dateFormatter},
              endCalendar: $('#rangeend'),
            });
            $('#rangeend').calendar({
              type: 'date',
              formatter: {date: dateFormatter},
              startCalendar: $('#rangestart'),
            });
          },
          // When approvind modal, submit form
          onApprove: () => {
            $.ajax({
              type: 'POST',
              url: $('.ui.dropdown.status').attr('data-url'),
              data: $('#change-status-form').serialize(),
              success: (xhr) => {
                if ($(xhr).find('.errorlist').length > 0) {
                  $('.ui.modal.status').html(xhr);
                  $('.ui.status_to.dropdown').dropdown();
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

    const removeStatusConfirmationModal = $('#remove-status-confirmation');
    $('a.remove-status').click((event) => {
      event.preventDefault();
      removeStatusConfirmationModal.load(event.currentTarget.href);
      removeStatusConfirmationModal.modal('show');
    });

    if ($('#dietary_restriction-delivery_type select').val() === 'E') {
      $('#form-meals-schedule').hide();
      showAllAccordionElements();
    } else {
      $('#form-meals-schedule').show();
      hideUiAccordionDays();
      showUiAccordionSelectedDays();
    }

    $('#dietary_restriction-delivery_type .dropdown').dropdown(
      'setting', 'onChange', (value, text, $selectedItem) => {
        if ($selectedItem.data('value') === 'E') {
          $('#form-meals-schedule').hide();
          showAllAccordionElements();
        } else {
          $('#form-meals-schedule').show();
          hideUiAccordionDays();
          showUiAccordionSelectedDays();
        }
      },
    );

    const sameAsClient = $('#id_payment_information-same_as_client');
    // Initial state
    if (sameAsClient && sameAsClient.checked) {
      $('#billing_select_member').hide();
    }
    $('#id_payment_information-same_as_client').on('change', (event) => {
      if (event.currentTarget.checked) {
        $('#billing_select_member').hide();
      } else {
        $('#billing_select_member').show();
      }
    });

    const body = $('body');
    body.delegate('.ui.button.add.member', 'click', (event) => {
      const $this = $(event.currentTarget);
      const commonParent = $(event.currentTarget).closest('div.ui.segment');
      $this.transition('scale');
      commonParent.find('.ui.add.form.member').transition('scale');
      commonParent.find('.existing--member').val('')
        .attr('disabled', 'disabled');
    });

    body.delegate('.ui.button.cancel.add.member', 'click', (event) => {
      const commonParent = $(event.currentTarget).closest('div.ui.segment');
      commonParent.find('.ui.button.add.member').not('cancel')
        .transition('scale');
      commonParent.find('.existing--member').removeAttr('disabled');
    });

    // Emergency contact formset
    const formsetContainer = $('form.ui.form div.formset-container');
    const formsetItems = $('form.ui.form div.formset-item');
    const $searchUrl = $('.ui.search .ui.input').first().attr('data-url');
    const initMemberQuickSearch = (selector) => {
      selector.search({
        apiSettings: {
          cache: false,
          url: `${$searchUrl}?name={query}`,
        },
        minCharacters: 3,
        maxResults: 10,
      });
    };

    if (formsetItems.length > 0) {
      formsetItems.formset({
        prefix: 'emergency_contacts',
        addText:
          `<i class="plus icon"></i> ${formsetContainer.data('addLabel')}`,
        deleteText:
          `<i class="remove icon"></i> ${formsetContainer.data('removeLabel')}`,
        added: (row) => {
          initMemberQuickSearch(row.find('.ui.search'));
        },
      });
    } else if ($('.firstname').val() !== '' || ($('.lastname').val() !== ''
          && $('.existing--member').val() === '')) {
      $('.ui.button.add.member').transition('scale');
      $('.existing--member').attr('disabled', 'disabled');
      $('.ui.add.form.member').transition('scale');
    }

    initMemberQuickSearch($('.ui.search'));

    function showOneAccordionElement(element) {
      const selector = `.ui.accordion.meals.${element}`;
      $(selector).show();
    }

    function showAllAccordionElements() {
      $('.ui.accordion.meals').not('.default').each((idx, element) => {
        $(element).show();
      });
    }

    function showUiAccordionSelectedDays() {
      const $selected = $("#form-meals-schedule select[multiple='multiple']");
      if ($selected.val()) {
        $selected.val().forEach(showOneAccordionElement);
      }
    }

    function hideUiAccordionDays() {
      $('.ui.accordion.meals').not('.default').each((idx, element) => {
        $(element).hide();
      });
    }

    $("#form-meals-schedule select[multiple='multiple']").change(() => {
      hideUiAccordionDays();
      showUiAccordionSelectedDays();
    });
    const deliveryTypeSelect =
      $('#id_dietary_restriction-delivery_type, #id_delivery_type');
    deliveryTypeSelect.change((event) => {
      if ($(event.currentTarget).val() === 'E') {
        $('#form-meals-schedule').hide();
        showAllAccordionElements();
        $('.ui.accordion.meals.default').hide();
      } else {
        $('#form-meals-schedule').show();
        hideUiAccordionDays();
        showUiAccordionSelectedDays();
        $('.ui.accordion.meals.default').hide();
      }
    });
    if (deliveryTypeSelect.val() === 'E') {
      $('#form-meals-schedule').hide();
      showAllAccordionElements();
      $('.ui.accordion.meals.default').hide();
    } else {
      $('#form-meals-schedule').show();
      hideUiAccordionDays();
      showUiAccordionSelectedDays();
      $('.ui.accordion.meals.default').hide();
    }
  },

  geocodeAddress(event) {
    let marker;

    // Display a loading indicator
    $('form').addClass('loading');
    const notFoundMsg = $(event.currentTarget).data('notFoundMsg');

    // eslint-disable-next-line new-cap
    const geocoder = new L.Control.Geocoder.nominatim({
      geocodingQueryParams: {countrycodes: 'ca'},
    });
    // var yourQuery = "4846 rue cartier, Montreal, Qc";
    const apt = '';
    let street = '';
    let city = '';
    const zipcode = '';

    if ($('.field > .street.name').val()) {
      street = `${$('.field > .street.name').val()}&`;
    }
    if ($('.field > .city').val()) {
      city = `${$('.field > .city').val()}&`;
    }

    const yourQuery = apt + street + city + zipcode;

    geocoder.geocode(yourQuery, (results) => {
      if (results.length > 0) {
        const data = {
          address: results[0].name,
          lat: results[0].center.lat,
          long: results[0].center.lng,
        };

        // calculate distance between santropol and the place found
        const dist = distance(
          45.516564, -73.575145, results[0].center.lat,
          results[0].center.lng, 'K');

        // update text field withe info
        $('.field > .latitude').val(data.lat);
        $('.field > .longitude').val(data.long);
        $('.field .distance').val(dist);

        // Add or update marker for the found address
        if (typeof (marker) === 'undefined') {
          marker = L.marker([data.lat, data.long], {draggable: true});
          marker.addTo(mymap);
          mymap.setView([data.lat, data.long], 17);
        } else {
          marker.setLatLng([data.lat, data.long]);
          mymap.setView([data.lat, data.long], 17);
        }

        // Adjust latitude / longitude if user drag the marker
        marker.on('dragend', (ev) => {
          const chagedPos = ev.target.getLatLng();
          $('.field > .latitude').val(chagedPos.lat);
          $('.field > .longitude').val(chagedPos.lng);
          const newdist = distance(
            45.516564, -73.575145, chagedPos.lat, chagedPos.lng, 'K');
          $('.field > .distance').val(newdist);
        });
      } else {
        // eslint-disable-next-line no-alert
        alert(notFoundMsg);
      }

      // Remove the loading indicator
      $('form').removeClass('loading');
    });
  },
};
