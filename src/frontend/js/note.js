/* eslint-env browser, jquery */

$(() => {
  const toggleIds = {};

  let doOnce = (fn) => {
    fn();
    doOnce = () => {};
  };

  $('button[data-batch-commit-btn]').click((event) => {
    const self = event.currentTarget;
    const noteId = $(self).data('note-id');
    const origVal = toggleIds[noteId];
    if (origVal) {
      // selected. then deselect it.
      $(self)
        .removeClass('active')
        .removeClass('labeled')
        .removeClass('icon')
        .addClass('basic')
        .blur()
        .find('> i')
        .remove();
      delete toggleIds[noteId];
      if ($.isEmptyObject(toggleIds)) {
        $($(self).data('batch-commit-btn')).hide();
      }
    } else {
      // not selected. then select it.
      $(self)
        .addClass('active')
        .addClass('labeled')
        .addClass('icon')
        .removeClass('basic')
        .prepend('<i class="checkmark icon"></i>');
      toggleIds[noteId] = true;

      const $btn = $($(self).data('batch-commit-btn'));
      $btn.show();
      doOnce(() => {
        $btn.on('click', () => {
          const $form = $btn.closest('form');
          $.each(toggleIds, (k) => {
            $('<input>').attr({
              type: 'hidden',
              name: 'note',
              value: k,
            }).appendTo($form);
          });
          return true; // form submit
        });
      });
    }
    return false;
  });
});
