const { ethers } = require('ethers');
const chalk = require('chalk');

function bigIntToString(obj) {
    for (let prop in obj) {
        if (typeof obj[prop] === 'bigint') {
            obj[prop] = obj[prop].toString();
        } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
            obj[prop] = bigIntToString(obj[prop]);
        }
    }
    return obj;
}

async function queryTransactionByHash(rpcUrl, txHash) {
    try {
        // Create a provider instance
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Query the transaction
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
            throw new Error('Transaction not found');
        }

        // Get transaction receipt for additional information
        const receipt = await provider.getTransactionReceipt(txHash);

        const result = {
            transaction: {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                nonce: tx.nonce,
                gasPrice: tx.gasPrice,
                gasLimit: tx.gasLimit,
                data: tx.data,
                chainId: tx.chainId,
                type: tx.type,
            },
            receipt: receipt ? {
                status: receipt.status,
                blockNumber: receipt.blockNumber,
                blockHash: receipt.blockHash,
                transactionIndex: receipt.index,
                gasUsed: receipt.gasUsed,
                cumulativeGasUsed: receipt.cumulativeGasUsed,
                effectiveGasPrice: receipt.gasPrice,
                logsBloom: receipt.logsBloom,
                contractAddress: receipt.contractAddress,
                type: receipt.type,
                root: receipt.root,
                logs: receipt.logs
            } : 'Receipt not available'
        };

        return bigIntToString(result);
    } catch (error) {
        throw new Error(`Failed to query transaction: ${error.message}`);
    }
}

// Get command-line arguments
const rpcUrl = process.argv[2] || 'http://localhost:8545';
const txHash = process.argv[3];

if (!txHash) {
    console.error('Usage: node query_tx.js <rpc_url> <transaction_hash>');
    process.exit(1);
}

queryTransactionByHash(rpcUrl, txHash)
    .then(result => {
        console.log(chalk.cyan('Transaction Details:'));
        console.log(chalk.yellow('Transaction:'));
        console.log(JSON.stringify(result.transaction, null, 2)
            .replace(/"(\w+)":/g, (m, p1) => `${chalk.green('"' + p1 + '"')}:`));
        
        console.log(chalk.yellow('\nReceipt:'));
        if (typeof result.receipt === 'string') {
            console.log(chalk.red(result.receipt));
        } else {
            console.log(JSON.stringify(result.receipt, null, 2)
                .replace(/"(\w+)":/g, (m, p1) => `${chalk.green('"' + p1 + '"')}:`));
        }
    })
    .catch(error => console.error(chalk.red('Error:'), error.message));
