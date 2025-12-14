import * as admin from 'firebase-admin';

declare global {
  namespace admin {
    export = admin;
  }
}

