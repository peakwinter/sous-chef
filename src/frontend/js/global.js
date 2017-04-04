/* eslint-env browser, jquery */

function dateFormatter(date) {
  if (!date) return '';
  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  return `${year}-${month}-${day}`;
}

$(() => {
  // Javascript of the sous-chef application.
  // **************************************

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
});
