import React from 'react'

const Docs: React.FC = () => {
    return (
        <>
            <h2>How to use this app</h2>
            <p>This app will help you add a new address that will act as both authorized / cosigner pair to your Dapper Legacy wallet. This means if / when the current chrome extension is retired you will still be able to administer the wallet using a new ethereum address under your control. You also have the option of removing Dapper Labs as an authorized address. Make sure you are logged out of your Metamask wallet before starting step 1.</p>
            <h2>Step 1.</h2>
            <p>Sign in with your Dapper Legacy Wallet and then paste a new ethereum wallet address - e.g. your Metamask address - into the provided input field. After triple checking (!) this is the definitely the address you want to use, press the "Add new authorization" button and then confirm the transaction in your dapper legacy wallet. Make a note of your Dapper wallet address, sign out of your wallet (as in fully log out of the extension) and then reload this page.</p>
            <h2>Step 2.</h2>
            <p>Sign into this page using Metamask or a similar Ethereum wallet extension provider. Set the Dapper Wallet address in the provided input field. This should then show your Metamask address as the cosigner for this wallet if the previous step was successful. This now means the address you are signed in with is an <b>authorized / cosigner pair</b> for your Dapper Legacy wallet and therefore has complete control of the wallet and removing the need for Dapper Labs to cosign your transactions.</p>
        </>
    )
}

export default Docs