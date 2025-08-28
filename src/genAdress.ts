import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
console.log("Private key:", privateKey);

const account = privateKeyToAccount(privateKey);
console.log("Address:", account.address);
