import { Button, Grid, TextareaAutosize, TextField } from "@mui/material";
import React, { Fragment, useContext, useState } from "react";
import LoadingComponent from "../components/loading";
import { toast } from "react-toastify";
import { useWallet } from "use-wallet";
import {
  getNFTMarketContract,
  isTransactionMined,
} from "../utils/contract.utils";
import { WalletStateContext } from "../utils/WalletStateContext";
import { SkynetClient, genKeyPairFromSeed } from "skynet-js";

export interface Entry<T> {
  data: T[];
  dataKey: string;
  revision: number;
}

export interface NftData {
  tokenId: number;
  owner: string;
}

export interface MintFormState {
  uri?: string;
  price?: number;
  feeAddresses?: string;
  feePercentages?: string;
  royaltyAddresses?: string;
  royaltyPercentages?: string;
}

// const loanContractAddress = process.env
//   .REACT_APP_LOAN_CONTRACT_ADDRESS as string;
// const auctionContractAddress = process.env
//   .REACT_APP_AUCTION_CONTRACT_ADDRESS as string;
// const icwContractAddress = process.env.REACT_APP_ICW_CONTRACT_ADDRESS as string;

const nftMarketContractAddress = process.env
  .REACT_APP_NFT_MARKET_CONTRACT_ADDRESS as string;

const onUploadProgress = (progress, { loaded, total }) => {
  toast(`Saving into DB...${Math.round(progress * 100)}%`);
};

const client = new SkynetClient("https://siasky.net", {
  onUploadProgress,
});

const saveNft = async (nft: NftData) => {
  try {
    const { privateKey, publicKey } = genKeyPairFromSeed(nft.owner);
    const savedNftsKey = nft.owner;

    let entry: Entry<NftData>;
    try {
      entry = await client.db.getJSON(publicKey, savedNftsKey);
    } catch (err) {}

    if (!entry.data) {
      entry.data = [];
    }

    entry.data.push(nft);
    await client.db.setJSON(privateKey, savedNftsKey, entry.data);

    return true;
  } catch (err) {
    console.log(err);
  }

  return false;
};

const MintForm = () => {
  const [formState, setFormState] = useState<MintFormState>({});
  const [showLoading, setShowLoading] = useState(false);

  const [isUriError, setIsUriError] = useState(false);
  const [uriError, setUriError] = useState("");
  const [isPriceError, setIsPriceError] = useState(false);
  const [priceError, setPriceError] = useState("");

  const wallet = useWallet();
  const walletStateContext = useContext(WalletStateContext);

  React.useEffect(() => {
    const addGnosisChainNetwork = async () => {
      const chainId = process.env.REACT_APP_CHAIN_ID as string;
      const chainName = process.env.REACT_APP_CHAIN_NAME as string;
      const symbol = process.env.REACT_APP_CHAIN_SYMBOL as string;
      const rpcUrl = process.env.REACT_APP_CHAIN_RPC_URL as string;
      const explorerUrl = process.env.REACT_APP_CHAIN_EXPLORER_URL as string;
      try {
        await wallet.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainId }], // Hexadecimal version of 80001, prefixed with 0x
        });
      } catch (error: any) {
        if (error.code === 4902) {
          try {
            await wallet.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chainId, // Hexadecimal version of 80001, prefixed with 0x
                  chainName: chainName,
                  nativeCurrency: {
                    name: chainName,
                    symbol: symbol,
                    decimals: 18,
                  },
                  rpcUrls: [rpcUrl],
                  blockExplorerUrls: [explorerUrl],
                  iconUrls: [""],
                },
              ],
            });
          } catch (addError) {
            console.log("Did not add network");
          }
        }
      }
    };

    if (
      wallet.isConnected &&
      wallet.status === "connected" &&
      wallet.chainId !== +process.env.NEXT_PUBLIC_CHAIN_ID
    ) {
      addGnosisChainNetwork();
    }
  }, [wallet.status, wallet]);

  const handleTextAreaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFormState({
      ...formState,
      [event.target.name]: event.target.value,
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      [event.target.name]: event.target.value,
    });
  };

  const resetErrors = () => {
    setIsUriError(false);
    setIsPriceError(false);
  };

  const validateUri = async () => {
    // {"name":"EVERGLOW - Yiren Common Card","description":"Bon Bon Chocolat [THE SHOW April 9th, 2019] It seems like Yiren's beauty can be seen from the universe","image":"https://ipfs.featured.market/ipfs/QmdEkZaTxr3vgCautYqd3KfeKLac9MVRDyGerLiyMsotYu","external_url":"0.04","external_metadata_ipfs":"","attributes":{"thumbnail_url":"https://ipfs.featured.market/ipfs/QmUDjR73nLuVjH6B4MgqPwb3Uzq9uKUzisv1LNYGwGdM6j","content_type":"video/mp4"}}
    try {
      const response = await (await fetch(formState.uri)).json();
      if (response.name && response.description && response.image) {
        return true;
      }
    } catch (error) {
      toast.error("Error validating URI: " + error);
    }
    return false;
  };

  const validateRoyaltyAddresses = () => {
    const royaltyAddresses = formState.royaltyAddresses.split(",");
    const royaltyPercentages = formState.royaltyPercentages.split(",");

    if (royaltyAddresses.length === 0 || royaltyAddresses[0].length === 0) {
      toast.error("Royalty address can not be empty");
      return;
    }

    if (royaltyPercentages.length === 0 || royaltyPercentages[0].length === 0) {
      toast.error("Royalty share percentages can not be empty");
      return;
    }

    if (royaltyAddresses.length !== royaltyPercentages.length) {
      toast.error(
        "Royalties and Percentages not the same length - " +
          royaltyAddresses.length +
          " : " +
          royaltyPercentages.length
      );
      return false;
    }

    let sum = royaltyPercentages
      .map((el) => +el)
      .reduce((el, sum) => (sum += el));
    if (sum !== 100) {
      toast.error("Sum of Royalty percentages must equal 100");
      return false;
    }
    return true;
  };

  const validateFeeAddresses = () => {
    const feeAddresses = formState.feeAddresses.split(",");
    const feePercentages = formState.feePercentages.split(",");

    if (feeAddresses.length === 0 || feeAddresses[0].length === 0) {
      toast.error("Owner address can not be empty");
      return;
    }

    if (feePercentages.length === 0 || feePercentages[0].length === 0) {
      toast.error("Owner share percentages can not be empty");
      return;
    }

    if (feeAddresses.length !== feePercentages.length) {
      toast.error(
        "Owners and Percentages not the same length - " +
          feeAddresses.length +
          " : " +
          feePercentages.length
      );
      return false;
    }

    let sum = feePercentages.map((el) => +el).reduce((el, sum) => (sum += el));
    if (sum !== 100) {
      toast.error("Sum of Fee percentages must equal 100");
      return false;
    }
    return true;
  };

  const getMintedTokenIdFromTransactionReceipt = (txReceipt) => {
    const relevantTransferEvent = txReceipt.events.find(
      (e) => e.event === "Minted"
    );

    const tokenId = relevantTransferEvent.args.tokenId.toNumber();
    const address = relevantTransferEvent.args.to;
    return { tokenId, address };
  };

  const validate = async () => {
    resetErrors();
    toast.info("Checking URI...." + formState.uri);
    if (formState.uri && formState.uri.length <= 0) {
      setUriError("Please enter the token URI");
      setIsUriError(true);
      return false;
    }

    if (!(await validateUri())) {
      setUriError("URI is not a valid NFT json file");
      setIsUriError(true);
      return false;
    }
    toast.info("URI is valid");

    if (formState.price < 1) {
      setPriceError("Price can not be less than one");
      setIsPriceError(true);
      return false;
    }

    if (!validateFeeAddresses()) {
      return false;
    }

    if (!validateRoyaltyAddresses()) {
      return false;
    }

    return true;
  };

  const mint = async () => {
    try {
      setShowLoading(true);
      if (await validate()) {
        if (wallet.isConnected()) {
          const nftMarket = getNFTMarketContract(
            nftMarketContractAddress,
            wallet.ethereum
          );
          toast("Minting....");
          const mintTxPromise = nftMarket.mint(
            formState.uri,
            formState.price,
            formState.feeAddresses.split(","),
            formState.feePercentages.split(","),
            formState.royaltyAddresses.split(","),
            formState.royaltyPercentages.split(",")
          );

          walletStateContext.addNewQueuedTx(
            mintTxPromise,
            "Minting NFT Market",
            {}
          );

          const mintTx = await mintTxPromise;
          const mintTxExecuted = await mintTx.wait(1);

          const isMined = await isTransactionMined(
            wallet.ethereum,
            mintTxExecuted.transactionHash,
            +(process.env.REACT_APP_TX_WAIT_BLOCK_COUNT as string)
          );

          if (!isMined) {
            toast.error(
              `Transaction not found after ${
                process.env.REACT_APP_TX_WAIT_BLOCK_COUNT as string
              } blocks`
            );
          } else {
            const { tokenId, address } =
              getMintedTokenIdFromTransactionReceipt(mintTxExecuted);

            if (address !== wallet.account) {
              throw Error("Account and Wallet Address Minted not the same");
            }

            toast.success(
              "NFT Minted Successfully. Check your wallet for the token"
            );

            toast("Cleaning up...");

            await saveNft({
              tokenId: tokenId,
              owner: address,
            });

            toast(`New Token Minted: ${tokenId}`);
          }
        } else {
          toast.error("Wallet is not connected");
        }
      }
    } catch (error) {
      toast(`Error occured during minting: ${error}`);
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <Fragment>
      <LoadingComponent open={showLoading} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            name="uri"
            type="url"
            label="Token URI"
            defaultValue={formState.uri}
            fullWidth
            margin="dense"
            onChange={handleChange}
            error={isUriError}
            helperText={uriError}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="price"
            type="price"
            label="Price (in iCW token)"
            defaultValue={formState.price}
            fullWidth
            margin="dense"
            onChange={handleChange}
            error={isPriceError}
            helperText={priceError}
          />
        </Grid>

        <Grid item xs={12}>
          <label>Owners (comma separated for multiple addresses)</label>
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosize
            name="feeAddresses"
            aria-label="owners addresses"
            minRows={3}
            placeholder="Owner Addreses: the price is shared among these addreses"
            style={{ width: "100%" }}
            defaultValue={formState.feeAddresses}
            onChange={handleTextAreaChange}
          />
        </Grid>

        <Grid item xs={12}>
          <label>
            Owners Percentages (comma separated for multiple percentages)
          </label>
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosize
            name="feePercentages"
            aria-label="owners percentages"
            minRows={3}
            placeholder="Owner Percentages: the price is shared using these percentages"
            style={{ width: "100%" }}
            defaultValue={formState.feePercentages}
            onChange={handleTextAreaChange}
          />
        </Grid>

        <Grid item xs={12}>
          <label>
            Royalty Addresses (comma separated for multiple addresses)
          </label>
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosize
            name="royaltyAddresses"
            aria-label="royalty addresses"
            minRows={3}
            placeholder="Royalty Addreses: the royalty (20%) is shared among these addreses"
            style={{ width: "100%" }}
            defaultValue={formState.royaltyAddresses}
            onChange={handleTextAreaChange}
          />
        </Grid>

        <Grid item xs={12}>
          <label>
            Royalty Percentages (comma separated for multiple percentages)
          </label>
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosize
            name="royaltyPercentages"
            aria-label="royalty percentages"
            minRows={3}
            placeholder="Royalty Percentages: the royalty (20%) is shared using these percentages"
            style={{ width: "100%" }}
            defaultValue={formState.royaltyPercentages}
            onChange={handleTextAreaChange}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="outlined" color="secondary" onClick={() => mint()}>
            Mint NFT
          </Button>
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default MintForm;
