import { Button, Grid } from "@mui/material";
import { Box, spacing } from "@mui/system";
import { ethers } from "ethers";
import React, { Fragment, useEffect, useState } from "react";
import { useWallet } from "use-wallet";
import LoadingComponent from "../components/loading";
import { getNftContract, getNFTMarketContract } from "../utils/contract.utils";
import { TokenData } from "../utils/dtos";

const nftContractAddress = process.env.REACT_APP_ICW_NFT as string;
const nftMarketContractAddress = process.env
  .REACT_APP_NFT_MARKET_CONTRACT_ADDRESS as string;

const BuyPage = () => {
  const wallet = useWallet();
  const [showLoading, setShowLoading] = useState(false);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [paginatedTokens, setPaginatedTokens] = useState<Array<TokenData>>([]);

  const getUri = async (tokenId) => {
    const nft = getNftContract(nftContractAddress, wallet.ethereum);
    const url = await nft.tokenURI(tokenId);
    const metadata = await (await fetch(url)).json();

    return metadata;
  };

  const getAllTokens = async () => {
    if (wallet.isConnected()) {
      setShowLoading(true);
      const nftMarket = getNFTMarketContract(
        nftMarketContractAddress,
        wallet.ethereum
      );
      const nft = getNftContract(nftContractAddress, wallet.ethereum);
      const allNfts = await nft.currentTokenId();
      const tokenInfos = [];
      if (allNfts > 0) {
        const start = rowsPerPage * page;
        let end = start + rowsPerPage;

        if (end > allNfts) {
          end = allNfts;
        }
        if (start < allNfts) {
          for (let i = start; i < end; i++) {
            const blockTokenInfo = await nftMarket.getTokenInfo(i);

            if (blockTokenInfo.forSale) {
              const tokenInfo: TokenData = {
                forAuction: blockTokenInfo.forAuction,
                forLoan: blockTokenInfo.forLoan,
                forSale: blockTokenInfo.forSale ? "yes" : "no",
                minter: blockTokenInfo.minter,
                onLoan: blockTokenInfo.onLoan,
                owner: blockTokenInfo.owner,
                price: ethers.utils.formatEther(blockTokenInfo.price),
                tokenId: blockTokenInfo.tokenId.toNumber(),
                metadata: await getUri(i),
              };
              tokenInfos.push(tokenInfo);
            }
          }
        }

        setPaginatedTokens(tokenInfos);
        setShowLoading(false);
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  useEffect(() => {
    getAllTokens();
  }, [wallet.status, wallet]);

  const buy = (tokenId) => {};
  return (
    <Fragment>
      <LoadingComponent open={showLoading} />
      <Grid container spacing={2}>
        {paginatedTokens.map((token) => (
          <Grid item xs={4} key={token.tokenId}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <img src={token.metadata.image} width="100%" alt="NFT" />
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ fontWeight: "bold" }}>
                  <span>{token.metadata.name}</span>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <span>{Number(token.price).toFixed(5)}</span>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => buy(token.tokenId)}
                >
                  Buy NFT
                </Button>
              </Grid>
            </Grid>
          </Grid>
        ))}
        <Grid item xs={4}>
          <Grid container spacing={2}></Grid>
        </Grid>
        <Grid item xs={4}>
          <Grid container spacing={2}></Grid>
        </Grid>
        <Grid item xs={4}>
          <Grid container spacing={2}></Grid>
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default BuyPage;
