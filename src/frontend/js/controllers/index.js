/* eslint-env browser, jquery */

import BillingController from './BillingController';
import DeliveryController from './DeliveryController';
import MemberController from './MemberController';
import NoteController from './NoteController';
import OrderController from './OrderController';
import PageController from './PageController';
import RoutingController from './RoutingController';


const controllers = {
  'souschef:billing': BillingController,
  'souschef:delivery': DeliveryController,
  'souschef:member': MemberController,
  'souschef:note': NoteController,
  'souschef:order': OrderController,
  'souschef:page': PageController,
  'souschef:routing': RoutingController,
};

export default controllers;
