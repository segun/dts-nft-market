import Loans from "../contract-abis/Loans.json";
import Auctions from "../contract-abis/Auctions.json";
import NFTMarket from "../contract-abis/NFTMarket.json";
import Nft from "../contract-abis/ERC721Standard.json";

import { ethers } from "ethers";

export const getNFTMarketContract = (address: string, ethereum: any) => {
  const abi = NFTMarket.abi;
  return getContract(address, ethereum, abi);
};

export const getAuctionContract = (address: string, ethereum: any) => {
  const abi = Auctions.abi;
  return getContract(address, ethereum, abi);
};

export const getLoanContract = (address: string, ethereum: any) => {
  const abi = Loans.abi;
  return getContract(address, ethereum, abi);
};

export const getNftContract = (address: string, ethereum: any) => {
  const abi = Nft.abi;
  return getContract(address, ethereum, abi);
};


const getContract = (address: string, ethereum: any, abi: any) => {
  const provider = new ethers.providers.Web3Provider(ethereum); //providers.Web3Provider(web3.currentProvider);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(address, abi, signer);
  const contractWithSigner = contract.connect(signer);
  return contractWithSigner;
};

export const isTransactionMined = async (
  ethereum: any,
  hash: string,
  numberOfBlocks: number
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      let blockCount = 0;
      provider.on("block", async (_blockNumber) => {
        blockCount++;
        if (blockCount > numberOfBlocks) {
          provider.removeAllListeners("block");
          resolve(false);
        }
        const txReceipt = await provider.getTransactionReceipt(hash);
        if (txReceipt && txReceipt.blockNumber) {
          provider.removeAllListeners("block");
          resolve(true);
        }
      });
    } catch (error) {
      console.log(`waiting for transaction rejected with error`, error);
      reject(error);
    }
  });
};
