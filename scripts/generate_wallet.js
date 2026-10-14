const { ethers } = require('ethers');

const w = ethers.Wallet.createRandom();
console.log('Address:', w.address);
console.log('Private Key:', w.privateKey);
