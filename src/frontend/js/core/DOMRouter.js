/* eslint-env browser */
/* global $ */

class DOMRouter {
  constructor(controllers) {
    this.controllers = (controllers === undefined) ? {} : controllers;
  }

  /**
   * Executes the given action associated with the considered controller.
   * @param {String} controller - The codename of the controller.
   * @param {String} action - The name of the action to execute.
   */
  execAction(controller, action) {
    if (controller !== '' && this.controllers[controller]
        && typeof this.controllers[controller][action] == 'function') {
      this.controllers[controller][action]();
    }
  }

  getAction(controller, action) {
    if (controller !== '' && this.controllers[controller]
        && typeof this.controllers[controller][action] == 'function') {
      return this.controllers[controller][action];
    }
    return undefined;
  }

  listActions(controller) {
    if (controller !== '' && this.controllers[controller]) {
      return Object.keys(this.controllers[controller]);
    }
    return [];
  }

  /**
   * Initializes the router object.
   */
  init() {
    if (document.body) {
      const body = document.body;
      const controller = body.getAttribute('data-controller');
      const initialAction = body.getAttribute('data-action');

      if (controller) {
        this.execAction(controller, 'init');

        this.listActions(controller).forEach((action) => {
          if (action === 'init') {
            return;
          }

          const target = $(`[data-action='${action}']`);
          if (!target.length) {
            return;
          }

          target.on(
            target.data('actionOn') || 'click',
            this.getAction(controller, action),
          );
        });

        this.execAction(controller, initialAction);
      }
    }
  }
}


export default DOMRouter;
