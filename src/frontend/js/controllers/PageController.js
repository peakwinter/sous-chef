/* eslint-env browser */

import $ from 'jquery';

export default {
  init() {
    const form = $('.ui.large.form');
    const usernameEmptyMsg = form.data('usernameEmptyMsg');
    const passwordEmptyMsg = form.data('passwordEmptyMsg');
    const passwordMinLengthMsg = form.data('passwordMinLengthMsg');

    $('.ui.large.form').form({
      on: 'submit',
      revalidate: 'false',
      fields: {
        username: {
          identifier: 'username',
          rules: [{
            type: 'empty',
            prompt: usernameEmptyMsg,
          }],
        },
        password: {
          identifier: 'password',
          rules: [{
            type: 'empty',
            prompt: passwordEmptyMsg,
          }, {
            type: 'minLength[6]',
            prompt: passwordMinLengthMsg,
          }],
        },
      },
    });
  },
};
