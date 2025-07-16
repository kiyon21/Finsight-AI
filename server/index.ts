const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid';


dotenv.config();

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);
const app = express();
app.use(cors());

app.use(bodyParser.json());

app.post('/auth', async function (req, res){

    const accessToken = req.body.access_token;
    const plaidRequest = {
        access_token: accessToken,
      };
      try {
        const plaidResponse = await plaidClient.authGet(plaidRequest);
        res.json(plaidResponse.data);
      } catch (error) {
        // handle error
        res.status(500).send('failed');
      };
    
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

app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`)
})