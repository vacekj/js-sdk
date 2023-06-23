// THIS FILE IS AUTOMATICALLY GENERATED FROM tools/scripts/gen-nodejs.mjs 

import { hasItems } from './helper';
import { manualTest } from './manual-test';

import * as accessControlConditions from '@lit-protocol/access-control-conditions';
import * as authBrowser from '@lit-protocol/auth-browser';
import * as authHelpers from '@lit-protocol/auth-helpers';
import * as blsSdk from '@lit-protocol/bls-sdk';
import * as constants from '@lit-protocol/constants';
import * as contractsSdk from '@lit-protocol/contracts-sdk';
import * as core from '@lit-protocol/core';
import * as crypto from '@lit-protocol/crypto';
import * as ecdsaSdk from '@lit-protocol/ecdsa-sdk';
import * as encryption from '@lit-protocol/encryption';
import * as getlitSdk from '@lit-protocol/getlit-sdk';
import * as litAuthClient from '@lit-protocol/lit-auth-client';
import * as litNodeClient from '@lit-protocol/lit-node-client';
import * as litNodeClientNodejs from '@lit-protocol/lit-node-client-nodejs';
import * as litThirdPartyLibs from '@lit-protocol/lit-third-party-libs';
import * as misc from '@lit-protocol/misc';
import * as miscBrowser from '@lit-protocol/misc-browser';
import * as nacl from '@lit-protocol/nacl';
import * as pkpBase from '@lit-protocol/pkp-base';
import * as pkpClient from '@lit-protocol/pkp-client';
import * as pkpCosmos from '@lit-protocol/pkp-cosmos';
import * as pkpEthers from '@lit-protocol/pkp-ethers';
import * as pkpWalletconnect from '@lit-protocol/pkp-walletconnect';
import * as types from '@lit-protocol/types';
import * as uint8arrays from '@lit-protocol/uint8arrays';

console.log("accessControlConditions:", hasItems(accessControlConditions));
console.log("authBrowser:", hasItems(authBrowser));
console.log("authHelpers:", hasItems(authHelpers));
console.log("blsSdk:", hasItems(blsSdk));
console.log("constants:", hasItems(constants));
console.log("contractsSdk:", hasItems(contractsSdk));
console.log("core:", hasItems(core));
console.log("crypto:", hasItems(crypto));
console.log("ecdsaSdk:", hasItems(ecdsaSdk));
console.log("encryption:", hasItems(encryption));
console.log("getlitSdk:", hasItems(getlitSdk));
console.log("litAuthClient:", hasItems(litAuthClient));
console.log("litNodeClient:", hasItems(litNodeClient));
console.log("litNodeClientNodejs:", hasItems(litNodeClientNodejs));
console.log("litThirdPartyLibs:", hasItems(litThirdPartyLibs));
console.log("misc:", hasItems(misc));
console.log("miscBrowser:", hasItems(miscBrowser));
console.log("nacl:", hasItems(nacl));
console.log("pkpBase:", hasItems(pkpBase));
console.log("pkpClient:", hasItems(pkpClient));
console.log("pkpCosmos:", hasItems(pkpCosmos));
console.log("pkpEthers:", hasItems(pkpEthers));
console.log("pkpWalletconnect:", hasItems(pkpWalletconnect));
console.log("types:", hasItems(types));
console.log("uint8arrays:", hasItems(uint8arrays));

manualTest();