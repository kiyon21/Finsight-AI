const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
import * as ngrok from 'ngrok'
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products, ClientProvidedEnrichedTransaction, ClientProvidedTransaction, EnrichTransactionDirection, TransactionsEnrichRequest, AccountsGetRequest, SandboxItemFireWebhookRequest, SandboxItemFireWebhookRequestWebhookCodeEnum, LinkTokenCreateRequest, AccountSubtype, DepositoryAccountSubtype, CreditAccountSubtype, AuthGetRequest } from 'plaid';


dotenv.config();

const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);
const app = express();

let webhookUrl: string;
const PORT = Number.isInteger(Number(process.env.PORT)) ? Number(process.env.PORT) : 8000;
(async () => {
  try {
    webhookUrl = await ngrok.connect(PORT);
    console.log(`🔗 Ngrok tunnel running: ${webhookUrl}`);
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start ngrok:", error);
  }
})();


app.use(cors());

app.use(bodyParser.json());

app.post('/auth', async function (req, res){

    const accessToken = req.body.access_token;
    const plaidRequest:AuthGetRequest = {
        access_token: accessToken,
      };
      try {
        const plaidResponse = await plaidClient.authGet(plaidRequest);
        res.json(plaidResponse.data);
      } catch (error) {
        // handle error
        res.status(500).send('failed');
        console.log(error)
      };
    
});
app.post('/accounts/get', async function(req, res) {
  const request: AccountsGetRequest = {
    access_token: req.body.access_token,
  };
  try {
    const response = await plaidClient.accountsGet(request);
    const accounts = response.data.accounts;
    res.json(accounts);
  } catch (error) {
    // handle error
  }
});

app.post('/sandbox/item/fire_webhook', async function (req, res) {
  console.log('trying to fire webhook');
  if (!req.body.access_token) {
    return res.status(400).json({ error: "Missing access_token" });
  }
  console.log(req.body.access_token)
  const request: SandboxItemFireWebhookRequest = {
    access_token: req.body.access_token.data.accessToken,
    webhook_code: SandboxItemFireWebhookRequestWebhookCodeEnum.NewAccountsAvailable
  };
  try {
    const response = await plaidClient.sandboxItemFireWebhook(request);
    res.json(response.data);
  } catch (error) {
    // handle error
    console.error(error.response?.data || error.message || error);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.post('/webhook', (req, res) => {
  console.log('📡 Plaid webhook received:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.post('/link/token/create', async (req, res) => {
  const request: LinkTokenCreateRequest = {
    user: {
      client_user_id: 'user-id',
      phone_number: '+1 415 5550123'
    },
    client_name: 'Finsight-Ai',
    products: [Products.Transactions],
    transactions: {
      days_requested: 730
    },
    country_codes: [CountryCode.Ca],
    language: 'en',
    webhook: `${webhookUrl}/webhook`,
    account_filters: {
      depository: {
        account_subtypes: [DepositoryAccountSubtype.Checking, DepositoryAccountSubtype.Savings]
      },
      credit: {
        account_subtypes: [CreditAccountSubtype.CreditCard]
      }
    }
  };
  try {
    const response = await plaidClient.linkTokenCreate(request);
    const linkToken = response.data.link_token;
    res.json(linkToken)
  } catch (error) {
    // handle error
    console.log(error)
  }
});

app.post('/transactions/enrich', async function (req,res) {
  try {
    const transactionsToEnrich: Array<ClientProvidedTransaction> = [
      {
        id: '1',
        description: 'PURCHASE WM SUPERCENTER #1700',
        amount: 72.1,
        iso_currency_code: 'USD',
        location: {
          city: 'Poway',
          region: 'CA',
        },
        direction: EnrichTransactionDirection.Outflow,
      },
      {
        id: '2',
        description: 'DD DOORDASH BURGERKIN 855-123-4567 CA',
        amount: 28.34,
        iso_currency_code: 'USD',
        direction: EnrichTransactionDirection.Outflow,
      },
    ];
    
    const request: TransactionsEnrichRequest = {
      account_type: 'depository',
      transactions: transactionsToEnrich,
    };
    
    const response = await plaidClient.transactionsEnrich(request);
    const enrichedTransactions = response.data.enriched_transactions;
    res.json(enrichedTransactions)
  }
  catch(err){
    res.status(500, 'failure');
  }
});


app.post('/create_link_token', async function (req, res) {

  const request = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: 'user',
    },
    client_name: 'Plaid Test App',
    products: [Products.Auth],
    language: 'en',
    redirect_uri: 'http://localhost:5173/onboarding',
    country_codes: [CountryCode.Us, CountryCode.Ca],

  };
  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(request);
    res.json(createTokenResponse.data);
  } catch (error) {
    // handle error
    res.status(500, 'failure');
  }
});

app.post('/exchange_public_token', async function (
    req,
    res,
    next,
  ) {
    const publicToken = req.body.public_token;
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });
  
      // These values should be saved to a persistent database and
      // associated with the currently signed-in user
      const accessToken = response.data.access_token;
      const itemID = response.data.item_id;
  
      res.json({ accessToken });
    } catch (error) {
      // handle error
        res.status(500).send('failed');
    }
  });
  


app.post('/hello', (req,res) => {
    res.json({message:"Hello "+ req.body.name})
});
