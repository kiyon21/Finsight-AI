import { Request, Response } from 'express';
import { PlaidService } from '../services/plaid.service';

export class PlaidController {
  constructor(private plaidService: PlaidService) {}

  async getAuth(req: Request, res: Response) {
    try {
      const accessToken = req.body.access_token;
      const data = await this.plaidService.getAuth(accessToken);
      res.json(data);
    } catch (error) {
      console.log(error);
      res.status(500).send('failed');
    }
  }

  async getAccounts(req: Request, res: Response) {
    try {
      const accessToken = req.body.access_token;
      const accounts = await this.plaidService.getAccounts(accessToken);
      res.json(accounts);
    } catch (error) {
      console.log(error);
      res.status(500).send('failed');
    }
  }

  async fireWebhook(req: Request, res: Response) {
    try {
      console.log('trying to fire webhook');
      
      if (!req.body.access_token) {
        return res.status(400).json({ error: 'Missing access_token' });
      }

      console.log(req.body.access_token);
      const accessToken = req.body.access_token.data.accessToken;
      const data = await this.plaidService.fireWebhook(accessToken);
      res.json(data);
    } catch (error: any) {
      console.error(error.response?.data || error.message || error);
      res.status(500).json({ error: error.response?.data || error.message });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    console.log('[Plaid Webhook] Received:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  }

  async createLinkToken(req: Request, res: Response) {
    try {
      const linkToken = await this.plaidService.createLinkToken();
      res.json(linkToken);
    } catch (error) {
      console.log(error);
      res.status(500).send('failed');
    }
  }

  async createSimpleLinkToken(req: Request, res: Response) {
    try {
      const data = await this.plaidService.createSimpleLinkToken();
      res.json(data);
    } catch (error) {
      console.log(error);
      res.status(500).send('failed');
    }
  }

  async exchangePublicToken(req: Request, res: Response) {
    try {
      const publicToken = req.body.public_token;
      const { accessToken } = await this.plaidService.exchangePublicToken(publicToken);
      res.json({ accessToken });
    } catch (error) {
      console.log(error);
      res.status(500).send('failed');
    }
  }

  async enrichTransactions(req: Request, res: Response) {
    try {
      const enrichedTransactions = await this.plaidService.enrichTransactions();
      res.json(enrichedTransactions);
    } catch (error) {
      console.log(error);
      res.status(500).send('failure');
    }
  }

  async hello(req: Request, res: Response) {
    res.json({ message: 'Hello ' + req.body.name });
  }
}

