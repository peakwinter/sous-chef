/* eslint-env browser */

import $ from 'jquery';

import controllers from './controllers';
import DOMRouter from './core/DOMRouter';
import {dateFormatter} from './core/Utilities';


// Defines the router and initializes it!
const router = new DOMRouter(controllers);
$(document).ready(() => {
  $('.ui.open-menu').on('click', () => {
    $('.ui.sidebar').sidebar('toggle');
  });

  $('.help-text').popup();

  $('.message .close').on('click', (event) => {
    $(event.currentTarget).closest('.message').transition('fade');
  });

  $('.ui.accordion').accordion();
  $('.ui.dropdown').dropdown({
    transition: 'drop',
    fullTextSearch: 'exact',
    forceSelection: false,
  });

  $('.ui.calendar').calendar({
    type: 'date',
    formatter: {date: dateFormatter},
  });

  // Don't use HTML5 validation on hidden <select> elements that are
  //  replaced by Semantic UI.
  $('.ui.dropdown > select[required]').each((event) => {
    $(event.currentTarget).removeAttr('required');
  });

  // Initializes the router.
  router.init();
});
