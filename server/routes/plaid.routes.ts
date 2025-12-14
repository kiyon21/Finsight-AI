import { Router } from 'express';
import { PlaidController } from '../controllers/plaid.controller';

export function createPlaidRoutes(plaidController: PlaidController): Router {
  const router = Router();

  router.post('/auth', (req, res) => plaidController.getAuth(req, res));
  router.post('/accounts/get', (req, res) => plaidController.getAccounts(req, res));
  router.post('/sandbox/item/fire_webhook', (req, res) => plaidController.fireWebhook(req, res));
  router.post('/webhook', (req, res) => plaidController.handleWebhook(req, res));
  router.post('/link/token/create', (req, res) => plaidController.createLinkToken(req, res));
  router.post('/create_link_token', (req, res) => plaidController.createSimpleLinkToken(req, res));
  router.post('/exchange_public_token', (req, res) => plaidController.exchangePublicToken(req, res));
  router.post('/transactions/enrich', (req, res) => plaidController.enrichTransactions(req, res));
  router.post('/hello', (req, res) => plaidController.hello(req, res));

  return router;
}

