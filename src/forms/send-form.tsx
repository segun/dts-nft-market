import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { ethers } from "ethers";
import React, { Fragment, useEffect, useState } from "react";
import { useWallet } from "use-wallet";
import { getNftContract, getNFTMarketContract } from "../utils/contract.utils";

const nftContractAddress = process.env.REACT_APP_ICW_NFT as string;
const nftMarketContractAddress = process.env
  .REACT_APP_NFT_MARKET_CONTRACT_ADDRESS as string;

interface Column {
  id: string;
  label: string;
}

interface Data {
  forSale: string;
  forAuction: string;
  forLoan: string;
  onLoan: string;
  tokenId: number;
  price: string;
  minter: string;
  owner: string;
  uri: string;
}

const SendForm = () => {
  const wallet = useWallet();
  const [userTokens, setUserTokens] = useState<Array<Data>>([]);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const columns: readonly Column[] = [
    { id: "tokenId", label: "Token ID" },
    { id: "minter", label: "Minted By" },
    { id: "owner", label: "Owner" },
    { id: "price", label: "Price" },
    { id: "forSale", label: "For Sale" },
  ];

  useEffect(() => {
    let isMounted = true;
    const populateUserTokens = async () => {
      if (wallet.isConnected()) {
        const nftMarket = getNFTMarketContract(
          nftMarketContractAddress,
          wallet.ethereum
        );
        const nft = getNftContract(nftContractAddress, wallet.ethereum);
        const balanceOfAddress = await nft.balanceOf(wallet.account);
        const tokenInfos = [];
        if (balanceOfAddress > 0) {
          for (let i = 0; i < balanceOfAddress; i++) {
            const tokenId = await nft.tokenOfOwnerByIndex(wallet.account, i);
            const blockTokenInfo = await nftMarket.getTokenInfo(
              tokenId.toNumber()
            );

            const tokenInfo: Data = {
              forAuction: blockTokenInfo.forAuction,
              forLoan: blockTokenInfo.forLoan,
              forSale: blockTokenInfo.forSale ? "yes" : "no",
              minter: blockTokenInfo.minter,
              onLoan: blockTokenInfo.onLoan,
              owner: blockTokenInfo.owner,
              price: ethers.utils.formatEther(blockTokenInfo.price),
              tokenId: blockTokenInfo.tokenId.toNumber(),
              uri: "",
            };
            tokenInfos.push(tokenInfo);
          }

          setUserTokens(tokenInfos);
        }
      }

      return () => {
        isMounted = false;
      };
    };

    populateUserTokens();
  }, [wallet.status]);
  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align="center"
                  style={{ minWidth: "auto" }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {userTokens
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={row.tokenId}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align="center">
                          {value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={userTokens.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default SendForm;