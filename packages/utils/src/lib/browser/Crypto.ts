import { ABIParams, AccessControlConditions, AccsCOSMOSParams, AccsDefaultParams, AccsEVMParams, AccsOperatorParams, AccsRegularParams, AccsSOLV2Params, EvmContractConditions, ILitError, JsonSigningResourceId, LIT_ERROR, SigShare, SigShares, SolRpcConditions, SYMM_KEY_ALGO_PARAMS, UnifiedAccessControlConditions } from "@litprotocol-dev/constants";
import { wasmBlsSdkHelpers } from "@litprotocol-dev/core";
import * as wasmECDSA from "@litprotocol-dev/core";
import { log, throwError } from "../utils";
import { uint8arrayFromString, uint8arrayToString } from "./Browser";

/** ---------- Local Functions ---------- */
/**
 * 
 * Canonical ABI Params
 * 
 * @param { Array<ABIParams> } params 
 * @returns { Array<ABIParams> }
 */
const canonicalAbiParamss = (params: Array<ABIParams>) : Array<ABIParams> => {
    return params.map((param) => ({
        name: param.name,
        type: param.type,
    }));
}

/** ---------- Exports ---------- */

/**
 * // #browser: TextEncoder() is browser only 
 * // TEST: Add E2E Test
 * Hash the unified access control conditions using SHA-256 in a deterministic way.
 * 
 * @param { Array<object> } unifiedAccessControlConditions - The unified access control conditions to hash.
 * @returns { Promise<ArrayBuffer> } A promise that resolves to an ArrayBuffer that contains the hash
 */
export const hashUnifiedAccessControlConditions = (
    unifiedAccessControlConditions: Array<object>
) : Promise<ArrayBuffer> => {

    console.log("unifiedAccessControlConditions:", unifiedAccessControlConditions);

    const conditions = unifiedAccessControlConditions.map((condition: object) => {
        canonicalUnifiedAccessControlConditionFormatter(condition);
    })

    const toHash = JSON.stringify(conditions);

    log("Hashing unified access control conditions: ", toHash);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(toHash);
    return crypto.subtle.digest("SHA-256", data);

}

/**
 * 
 * Hash resource id
 * 
 * @param { JsonSigningResourceId } resourceId
 * 
 * @returns { Promise<ArrayBuffer> }
 * 
 */
export const hashResourceId = (
    resourceId: JsonSigningResourceId
) : Promise<ArrayBuffer> => {

    const resId = canonicalResourceIdFormatter(resourceId);
    const toHash = JSON.stringify(resId);
    const encoder = new TextEncoder();
    const data = encoder.encode(toHash);
    
    return crypto.subtle.digest("SHA-256", data);
}

/**
 * 
 * Hash access control conditions
 * 
 * @param { AccessControlConditions } accessControlConditions
 * 
 * @returns { Promise<ArrayBuffer> }
 * 
 */
export const hashAccessControlConditions = (
    accessControlConditions: AccessControlConditions
) : Promise<ArrayBuffer> => {

    const conds = accessControlConditions.map((c) =>
        canonicalAccessControlConditionFormatter(c)
    );

    const toHash = JSON.stringify(conds);
    log("Hashing access control conditions: ", toHash);
    const encoder = new TextEncoder();
    const data = encoder.encode(toHash);

    return crypto.subtle.digest("SHA-256", data);
}

/**
 * 
 * Hash EVM access control conditions
 * 
 * @param { EvmContractConditions } evmContractConditions
 * 
 * @returns { Promise<ArrayBuffer> }
 * 
 */
export const hashEVMContractConditions = (
    evmContractConditions: EvmContractConditions
) : Promise<ArrayBuffer> => {

    const conds = evmContractConditions.map((c) =>
        canonicalEVMContractConditionFormatter(c)
    );

    const toHash = JSON.stringify(conds);
    log("Hashing evm contract conditions: ", toHash);
    const encoder = new TextEncoder();
    const data = encoder.encode(toHash);
    return crypto.subtle.digest("SHA-256", data);
}

/**
 * 
 * Hash SOL access control conditions
 * 
 * @param { SolRpcConditions } solRpcConditions
 * 
 * @returns { Promise<ArrayBuffer> }
 * 
 */
export const hashSolRpcConditions = (
    solRpcConditions: SolRpcConditions,
) : Promise<ArrayBuffer> => {

    const conds = solRpcConditions.map((c) =>
        canonicalSolRpcConditionFormatter(c)
    );

    const toHash = JSON.stringify(conds);
    log("Hashing sol rpc conditions: ", toHash);
    const encoder = new TextEncoder();
    const data = encoder.encode(toHash);

    return crypto.subtle.digest("SHA-256", data);
}

/**
 * 
 * Get operator param
 * 
 * @param { object | [] } cond 
 * @returns { AccsOperatorParams }
 */
const getOperatorParam = (cond: object | []) : AccsOperatorParams => {

    const _cond = cond as AccsOperatorParams;

    return {
        operator: _cond.operator,
    };
}

/**
 * 
 * Canonical Unified Access Control Condition Formatter
 * 
 * @param { object } cond 
 * @returns { any[] | AccsOperatorParams | any } 
 */
export const canonicalUnifiedAccessControlConditionFormatter = (cond: object | []) : any[] | AccsOperatorParams | any =>  {

    // -- if it's an array
    if (Array.isArray(cond)) {
        return cond.map((c: object) => canonicalUnifiedAccessControlConditionFormatter(c));
    }
    
    // -- if there's a `operator` key in the object
    if ("operator" in cond) {
        return getOperatorParam(cond);
    }
    
    // -- otherwise 
    if ("returnValueTest" in cond) {
        
        const _cond = (cond as AccsRegularParams);
        const _conditionType = _cond.conditionType;

        switch(_conditionType){
            case 'solRpc':
                return canonicalSolRpcConditionFormatter(cond, true);

            case 'evmBasic':
                return canonicalAccessControlConditionFormatter(cond);

            case 'evmContract':
                return canonicalEVMContractConditionFormatter(cond);

            case 'cosmos':
                return canonicalCosmosConditionFormatter(cond);
                
            default:
                throwError({
                    message: `You passed an invalid access control condition that is missing or has a wrong "conditionType": ${JSON.stringify(
                        cond
                    )}`,
                    error: LIT_ERROR.INVALID_ACCESS_CONTROL_CONDITIONS
                });
        }
    }
  
    throwError({
      message: `You passed an invalid access control condition: ${cond}`,
      error: LIT_ERROR.INVALID_ACCESS_CONTROL_CONDITIONS
    });
}


/**
 * 
 * (SOLANA) Canonical Solana RPC Condition Formatter
 * 
 * need to return in the exact format below:
 * but make sure we don't include the optional fields:
   ---
    #[derive(Debug, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "camelCase")]
    pub struct SolRpcCondition {
        pub method: String,
        pub params: Vec<serde_json::Value>,
        pub pda_params: Option<Vec<serde_json::Value>>,
        pub pda_interface: Option<SolPdaInterface>,
        pub chain: String,
        pub return_value_test: JsonReturnValueTestV2,
    }

    #[derive(Debug, Serialize, Deserialize, Clone)]
    #[serde(rename_all = "camelCase")]
    pub struct SolPdaInterface {
        pub offset: u64,
        pub fields: serde_json::Value,
    }
    ---
 * 
 * @param { object } cond 
 * @param { boolean } requireV2Conditions
 *  
 * @returns { any[] | AccsOperatorParams | AccsRegularParams | AccsSOLV2Params | ILitError | any }
 */
export const canonicalSolRpcConditionFormatter = (
    cond: object | [],
    requireV2Conditions: boolean = false
) : any[] | AccsOperatorParams | AccsRegularParams | AccsSOLV2Params | ILitError | any => {

    // -- if is array
    if (Array.isArray(cond)) {
        return cond.map((c: object) => canonicalSolRpcConditionFormatter(c, requireV2Conditions));
    }

    // -- if there's a `operator` key in the object
    if ("operator" in cond) {
        return getOperatorParam(cond);
    }

    // -- if it has a return value
    if ("returnValueTest" in cond) {

        const { returnValueTest } = (cond as AccsRegularParams);

        const canonicalReturnValueTest = {
            key: returnValueTest.key,
            comparator: returnValueTest.comparator,
            value: returnValueTest.value,
        };

        // -- check if this is a sol v1 or v2 condition
        // -- v1 conditions didn't have any pda params or pda interface or pda key
        // -- SOL version 1:: return V2 must have params
        if ("pdaParams" in cond || requireV2Conditions) {

            const _assumedV2Cond = (cond as AccsSOLV2Params);
            
            if (
                !("pdaInterface" in _assumedV2Cond) ||
                !("pdaKey" in _assumedV2Cond) ||
                !("offset" in _assumedV2Cond.pdaInterface) ||
                !("fields" in _assumedV2Cond.pdaInterface)
            ) {
                throwError({
                    message: `Solana RPC Conditions have changed and there are some new fields you must include in your condition.  Check the docs here: https://developer.litprotocol.com/AccessControlConditions/solRpcConditions`,
                    error: LIT_ERROR.INVALID_ACCESS_CONTROL_CONDITIONS
                });
            }

            // -- else
            const canonicalPdaInterface = {
                offset: _assumedV2Cond.pdaInterface.offset,
                fields: _assumedV2Cond.pdaInterface.fields,
            };

            const _solV2Cond = (cond as AccsSOLV2Params);

            const _requiredParams : AccsSOLV2Params = {
                method: _solV2Cond.method,
                params: _solV2Cond.params,
                pdaParams: _solV2Cond.pdaParams,
                pdaInterface: canonicalPdaInterface,
                pdaKey: _solV2Cond.pdaKey,
                chain: _solV2Cond.chain,
                returnValueTest: canonicalReturnValueTest,
            };

            return _requiredParams;

        // -- SOL version 2:: return default params
        } else {

            const _solV1Cond = (cond as AccsRegularParams);
            
            const _requiredParams : AccsRegularParams = {
                method: _solV1Cond.method,
                params: _solV1Cond.params,
                chain: _solV1Cond.chain,
                returnValueTest: canonicalReturnValueTest,
            };
            
            return _requiredParams
        }
    }

    // -- else
    throwError({
        message: `You passed an invalid access control condition: ${cond}`,
        error: LIT_ERROR.INVALID_ACCESS_CONTROL_CONDITIONS
    });
}


/**
 * 
 * (DEFAULT) Canonical Access Control Condition Formatter
 * 
 * need to return in the exact format below:
   ---
    pub struct JsonAccessControlCondition {
      pub contract_address: String,
      pub chain: String,
      pub standard_contract_type: String,
      pub method: String,
      pub parameters: Vec<String>,
      pub return_value_test: JsonReturnValueTest,
    }
    ---
 * 
 * @param { object } cond 
 *  
 * @returns { any[] | AccsOperatorParams | AccsDefaultParams | any }
 */
export const canonicalAccessControlConditionFormatter = (cond: object | []) : any[] | AccsOperatorParams | AccsDefaultParams | any => {
    
    // -- if it's an array
    if (Array.isArray(cond)) {
        return cond.map((c) => canonicalAccessControlConditionFormatter(c));
    }
  
    // -- if there's a `operator` key in the object
    if ("operator" in cond) {
        return getOperatorParam(cond);
    }

    if ("returnValueTest" in cond) {

        const _cond = cond as AccsDefaultParams;

        const _return : AccsDefaultParams = {
            contractAddress: _cond.contractAddress,
            chain: _cond.chain,
            standardContractType: _cond.standardContractType,
            method: _cond.method,
            parameters: _cond.parameters,
            returnValueTest: {
                comparator: _cond.returnValueTest.comparator,
                value: _cond.returnValueTest.value,
            },
        };

        return _return;
    }
  
    throwError({
        message: `You passed an invalid access control condition: ${cond}`,
        error: LIT_ERROR.INVALID_ACCESS_CONTROL_CONDITIONS
    });
  }


/**
 * 
 * (EVM) Canonical EVM Contract Condition Formatter
 * 
 *  need to return in the exact format below:
    ---
    pub struct JsonAccessControlCondition {
        pub contract_address: String,
        pub chain: String,
        pub standard_contract_type: String,
        pub method: String,
        pub parameters: Vec<String>,
        pub return_value_test: JsonReturnValueTest,
    }
    ---
 * 
 * @param { object } cond
 *  
 * @returns 
 */
export const canonicalEVMContractConditionFormatter = (cond:object | []) : any[] | AccsOperatorParams | AccsEVMParams | any => {

    // -- if it's an array
    if (Array.isArray(cond)) {
        return cond.map((c) => canonicalEVMContractConditionFormatter(c));
    }

    // -- if there's a `operator` key in the object
    if ("operator" in cond) {

        const _cond = cond as AccsOperatorParams;

        return {
            operator: _cond.operator,
        };
    }

    if ("returnValueTest" in cond) {
        /* abi needs to match:
        pub name: String,
        /// Function input.
        pub inputs: Vec<Param>,
        /// Function output.
        pub outputs: Vec<Param>,
        #[deprecated(note = "The constant attribute was removed in Solidity 0.5.0 and has been \
            replaced with stateMutability. If parsing a JSON AST created with \
            this version or later this value will always be false, which may be wrong.")]
        /// Constant function.
        #[cfg_attr(feature = "full-serde", serde(default))]
        pub constant: bool,
        /// Whether the function reads or modifies blockchain state
        #[cfg_attr(feature = "full-serde", serde(rename = "stateMutability", default))]
        pub state_mutability: StateMutability,
        */

        const evmCond = cond as AccsEVMParams;

        const { functionAbi, returnValueTest } = evmCond;

        const canonicalAbi = {
            name: functionAbi.name,
            inputs: canonicalAbiParamss(functionAbi.inputs),
            outputs: canonicalAbiParamss(functionAbi.outputs),
            constant:
                typeof functionAbi.constant === "undefined"
                ? false
                : functionAbi.constant,
            stateMutability: functionAbi.stateMutability,
        };

        const canonicalReturnValueTest = {
            key: returnValueTest.key,
            comparator: returnValueTest.comparator,
            value: returnValueTest.value,
        };

        const _return : AccsEVMParams = {
            contractAddress: evmCond.contractAddress,
            functionName: evmCond.functionName,
            functionParams: evmCond.functionParams,
            functionAbi: canonicalAbi,
            chain: evmCond.chain,
            returnValueTest: canonicalReturnValueTest,
        }

        return _return
    }

    throwError({
        message: `You passed an invalid access control condition: ${cond}`,
        error: LIT_ERROR.INVALID_ACCESS_CONTROL_CONDITIONS
    });
}

/**
 * 
 * (COSMOS) Canonical Condition Formmater for Cosmos
 * 
 * need to return in the exact format below:
   ---
    pub struct CosmosCondition {
        pub path: String,
        pub chain: String,
        pub return_value_test: JsonReturnValueTestV2,
    }
   ---
 * 
 * 
 * @param { object } cond 
 * @returns 
 */
export const canonicalCosmosConditionFormatter = (cond: object) : any[] | AccsOperatorParams | AccsCOSMOSParams | any => {


    // -- if it's an array
    if (Array.isArray(cond)) {
        return cond.map((c) => canonicalCosmosConditionFormatter(c));
    }

    // -- if there's a `operator` key in the object
    if ("operator" in cond) {

        const _cond = cond as AccsOperatorParams;

        return {
            operator: _cond.operator,
        };
    }
  
    if ("returnValueTest" in cond) {

        const _cosmosCond = cond as AccsCOSMOSParams;

        const { returnValueTest } = _cosmosCond;

        const canonicalReturnValueTest = {
            key: returnValueTest.key,
            comparator: returnValueTest.comparator,
            value: returnValueTest.value,
        };

        return {
            path: _cosmosCond.path,
            chain: _cosmosCond.chain,
            returnValueTest: canonicalReturnValueTest,
        };
    }
  
    throwError({
      message: `You passed an invalid access control condition: ${cond}`,
      error: LIT_ERROR.INVALID_ACCESS_CONTROL_CONDITIONS,
    });
}

/**
 * 
 * Canonical ResourceId Formatter returning JSON signing resource id
 * 
 * @param { JsonSigningResourceId } resId
 * 
 * @returns { JsonSigningResourceId }
 * 
 */
export const canonicalResourceIdFormatter = (
    resId: JsonSigningResourceId
) : JsonSigningResourceId =>
{
    // need to return in the exact format below:
    return {
      baseUrl: resId.baseUrl,
      path: resId.path,
      orgId: resId.orgId,
      role: resId.role,
      extraData: resId.extraData,
    };
}

/**
 * 
 * Generate a new random symmetric key using WebCrypto subtle API.  You should only use this if you're handling your own key generation and management with Lit.  Typically, Lit handles this internally for you.
 * 
 * @returns { Promise<CryptoKey> } A promise that resolves to the generated key
 */
export const generateSymmetricKey = async () : Promise<CryptoKey> => {

    const symmKey = await crypto.subtle.generateKey(SYMM_KEY_ALGO_PARAMS, true, [
        "encrypt",
        "decrypt",
    ]);

    return symmKey;
}

/**
 * 
 * Encrypt a blob with a symmetric key
 * 
 * @param { CryptoKey } symmKey The symmetric key
 * @param { BufferSource | Uint8Array } data The blob to encrypt
 * 
 * @returns { Promise<Blob> } The encrypted blob
 */
 export const encryptWithSymmetricKey = async (
    symmKey: CryptoKey, 
    data: BufferSource | Uint8Array
) : Promise<Blob> => {
    
    // encrypt the zip with symmetric key
    const iv = crypto.getRandomValues(new Uint8Array(16));
  
    const encryptedZipData = await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv,
      },
      symmKey,
      data,
    );

    const encryptedZipBlob = new Blob([iv, new Uint8Array(encryptedZipData)], {
      type: "application/octet-stream",
    });
    
    return encryptedZipBlob;
}

/**
 * 
 * Import a symmetric key from a Uint8Array to a webcrypto key.  You should only use this if you're handling your own key generation and management with Lit.  Typically, Lit handles this internally for you.
 * 
 * @param { Uint8Array } symmKey The symmetric key to import
 * 
 * @returns { Promise<CryptoKey> } A promise that resolves to the imported key
 */
 export const importSymmetricKey = async (
    symmKey: BufferSource | Uint8Array
) : Promise<CryptoKey> => {

    const importedSymmKey = await crypto.subtle.importKey(
        "raw",
        symmKey,
        SYMM_KEY_ALGO_PARAMS,
        true,
        ["encrypt", "decrypt"]
    );

    return importedSymmKey;
}

/**
 * 
 * Decrypt an encrypted blob with a symmetric key.  Uses AES-CBC via SubtleCrypto
 * 
 * @param { Blob } encryptedBlob The encrypted blob that should be decrypted
 * @param { CryptoKey } symmKey The symmetric key
 * 
 * @returns { Uint8Array } The decrypted blob
 */
 export const decryptWithSymmetricKey = async (
    encryptedBlob: Blob, 
    symmKey: CryptoKey
) : Promise<Uint8Array> => {

    const recoveredIv = await encryptedBlob.slice(0, 16).arrayBuffer();
    const encryptedZipArrayBuffer = await encryptedBlob.slice(16).arrayBuffer();
    const decryptedZip = await crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: recoveredIv,
      },
      symmKey,
      encryptedZipArrayBuffer
    );
    
    return decryptedZip;
}

/**
 * 
 * Combine BLS Shares
 * 
 * @param { SigShares | Array<SigShare> } sigSharesWithEverything
 * @param { string } networkPubKeySet
 * 
 * @returns { any }
 * 
 */
export const combineBlsShares = (
    sigSharesWithEverything: SigShares, 
    networkPubKeySet: string
) : any => {

    const pkSetAsBytes = uint8arrayFromString(networkPubKeySet, "base16");

    log("pkSetAsBytes", pkSetAsBytes);
  
    const sigShares = sigSharesWithEverything.map((s) => ({
      shareHex: s.shareHex,
      shareIndex: s.shareIndex,
    }));
    
    const combinedSignatures = wasmBlsSdkHelpers.combine_signatures(
      pkSetAsBytes,
      sigShares
    );

    const signature = uint8arrayToString(combinedSignatures, "base16");
    
    log("signature is ", signature);
  
    return { signature };
}

/**
 * 
 * Combine ECDSA Shares
 * 
 * @param { SigShares | Array<SigShare> } sigShares
 * 
 * @returns { any }
 * 
 */
export const combineEcdsaShares = (
    sigShares: SigShares
) : any => {

    // R_x & R_y values can come from any node (they will be different per node), and will generate a valid signature
    const R_x = sigShares[0].localX;
    const R_y = sigShares[0].localY;

    // the public key can come from any node - it obviously will be identical from each node
    const publicKey = sigShares[0].publicKey;
    const dataSigned = "0x" + sigShares[0].dataSigned;
    const validShares = sigShares.map((s) => s.shareHex);
    const shares = JSON.stringify(validShares);
    log("shares is", shares);
    const sig = JSON.parse(wasmECDSA.combine_signature(R_x, R_y, shares));
  
    log("signature", sig);
  
    return sig;
  }

  /**
 * //TODO: Fix 'any' types
 * Combine BLS Decryption Shares
 * 
 * @param { Array<any> } decryptionShares
 * @param { string } networkPubKeySet
 * @param { string } toDecrypt
 * 
 * @returns { any }
 * 
 */
  export const combineBlsDecryptionShares = (
    decryptionShares: Array<any>,
    networkPubKeySet: string,
    toDecrypt: any
  ) : any => {

    // sort the decryption shares by share index.  this is important when combining the shares.
    decryptionShares.sort((a, b) => a.shareIndex - b.shareIndex);
  
    // combine the decryption shares
    // log("combineBlsDecryptionShares");
    // log("decryptionShares", decryptionShares);
    // log("networkPubKeySet", networkPubKeySet);
    // log("toDecrypt", toDecrypt);
  
    // set decryption shares bytes in wasm
    decryptionShares.forEach((s, idx) => {
      wasmExports.set_share_indexes(idx, s.shareIndex);
      const shareAsBytes = uint8arrayFromString(s.decryptionShare, "base16");
      for (let i = 0; i < shareAsBytes.length; i++) {
        wasmExports.set_decryption_shares_byte(i, idx, shareAsBytes[i]);
      }
    });
  
    // set the public key set bytes in wasm
    const pkSetAsBytes = uint8arrayFromString(networkPubKeySet, "base16");
    wasmBlsSdkHelpers.set_mc_bytes(pkSetAsBytes);
  
    // set the ciphertext bytes
    const ciphertextAsBytes = uint8arrayFromString(toDecrypt, "base16");
    for (let i = 0; i < ciphertextAsBytes.length; i++) {
      wasmExports.set_ct_byte(i, ciphertextAsBytes[i]);
    }
  
    const decrypted = wasmBlsSdkHelpers.combine_decryption_shares(
      decryptionShares.length,
      pkSetAsBytes.length,
      ciphertextAsBytes.length
    );

    // log("decrypted is ", uint8arrayToString(decrypted, "base16"));
    return decrypted;
}