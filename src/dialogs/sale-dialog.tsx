import React, { Fragment, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { DialogProps } from "../utils/dtos";
import { getNftContract } from "../utils/contract.utils";
import { useWallet } from "use-wallet";
import LoadingComponent from "../components/loading";
import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

const nftContractAddress = process.env.REACT_APP_ICW_NFT as string;

const SaleDialog = (props: DialogProps) => {
  const { open, handleClose, data } = props;
  const [showLoading, setShowLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState();
  const [disableSale, setDisableSale] = useState(false);
  const [saleType, setSaleType] = useState("Auction");
  const [description, setDescription] = useState();

  const wallet = useWallet();

  useEffect(() => {
    let isMounted = true;
    const getUri = async () => {
      if (wallet.isConnected()) {
        setShowLoading(true);
        const { tokenId } = data;
        const nft = getNftContract(nftContractAddress, wallet.ethereum);
        const url = await nft.tokenURI(tokenId);
        const metadata = await (await fetch(url)).json();
        setImageUrl(metadata.image);
        setDescription(metadata.description);
        setShowLoading(false);

        setDisableSale(data.forSale === "yes" ? true : false);
      }
    };

    getUri();

    return () => {
      if (isMounted) {
        isMounted = false;
      }
    };
  }, [data, wallet]);

  const handleChange = (event: SelectChangeEvent) => {
    setSaleType(event.target.value);
    console.log(saleType);
  };

  const sell = () => {};

  return (
    <Fragment>
      <LoadingComponent open={showLoading} />
      {imageUrl && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth={true}
        >
          <DialogTitle>Token Details</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <DialogContentText>
                  <img src={imageUrl} width="400" alt="NFT" />
                </DialogContentText>
              </Grid>
              <Grid item xs={6}>
                <Grid item xs={12}>
                  <p>{description ? description : "NFT Details"}</p>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="price"
                      type="price"
                      label="Price (in iCW token)"
                      value={data.price}
                      fullWidth
                      margin="dense"
                      disabled={disableSale}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl sx={{ m: 1, minWidth: 120 }} fullWidth>
                      <Select
                        disabled={disableSale}
                        value={saleType}
                        defaultValue={saleType}
                        onChange={handleChange}
                        displayEmpty
                        inputProps={{ "aria-label": "Select Sale Type" }}
                      >
                        <MenuItem value="Auction">Auction</MenuItem>
                        <MenuItem value="Sale">Sale</MenuItem>
                      </Select>
                      <FormHelperText>Select Sale Type</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      disabled={disableSale}
                      onClick={() => sell()}
                    >
                      Sell NFT
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      onClick={handleClose}
                    >
                      Close
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Fragment>
  );
};

export default SaleDialog;
