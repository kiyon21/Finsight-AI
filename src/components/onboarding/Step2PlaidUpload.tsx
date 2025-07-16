import React from "react";
import type { StepsProps } from "../../pages/Onboarding";
import { useEffect, useState } from "react";
import axios from "axios";
import { usePlaidLink } from "react-plaid-link";


axios.defaults.baseURL = "http://localhost:8000"

type PlaidAuthProps = {
  publicToken: string;
};

const PlaidAuth = ({publicToken}:PlaidAuthProps) => {
  useEffect(() => {

    async function fetchData(){
      let accessToken = await axios.post('/exchange_public_token',{public_token: publicToken});
      console.log('access token ', accessToken.data);
      const auth = await axios.post('/auth', {access_token: accessToken.data.accessToken});
      console.log('auth data', auth.data);
    }

    fetchData();
  }, []);
  
  return (
    <span>
      {publicToken}
    </span>
  );
}

const Step2PlaidUpload = ({goNext, goBack}: StepsProps) => {

    const [linkToken, setLinkToken] = useState('');
    const [publicToken, setPublicToken] = useState('');

    useEffect(() => {
      async function fetch(){
        const response = await axios.post("/create_link_token");
        setLinkToken(await response.data.link_token);
        console.log("response ", (await response).data);

      }
      fetch();
    },[]);

    const { open, ready } = usePlaidLink({
      token: linkToken,
      onSuccess: (public_token, metadata) => {
        setPublicToken(public_token);
        console.log('success', public_token, metadata);
      },
    });

    return publicToken ? (<PlaidAuth publicToken={publicToken}/>) : (
        <div>
          <h2>STEP 2 PLAID UPLOAD</h2>
          <p>Let's get started on setting up your financial profile.</p>
            <button onClick={() => open()} disabled={!ready }>Connect Bank Account</button>
            <button onClick={goBack}>Back</button>
            <button onClick={goNext}>Next</button>
        </div>
      );

};

export default Step2PlaidUpload;