import { Button, Grid, TextareaAutosize, TextField } from "@mui/material";
import React, { Fragment, useState } from "react";
import LoadingComponent from "../components/loading";
import { toast } from "react-toastify";

export interface MintFormState {
  uri: string;
  price: number;
  feeAddresses: Array<string>;
  feePercentages: Array<number>;
  royaltyAddresses: Array<string>;
  royaltyPercentages: Array<number>;
}
const MintForm = () => {
  const [formState, setFormState] = useState<MintFormState>({
    uri: "",
    price: 0,
    feeAddresses: [],
    feePercentages: [],
    royaltyAddresses: [],
    royaltyPercentages: [],
  });
  const [showLoading, setShowLoading] = useState(false);

  const [isUriError, setIsUriError] = useState(false);
  const [uriError, setUriError] = useState("");
  const [isPriceError, setIsPriceError] = useState(false);
  const [priceError, setPriceError] = useState("");

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
        setShowLoading(true);
        const response = await (await fetch(formState.uri)).json();
        setShowLoading(false);
        if(response.name && response.description && response.image) {
            return true;
        }
    } catch(error) {
        toast.error("Error validating URI: " + error);
        setShowLoading(false);
    }
    setShowLoading(false);
    return false;
  };

  const validate = async () => {
    resetErrors();
    toast.info("Checking URI...." + formState.uri);
    if (formState.uri && formState.uri.length <= 0) {
      setUriError("Please enter the token URI");
      setIsUriError(true);
      return;
    }

    if (!(await validateUri())) {
        setUriError("URI is not a valid NFT json file");
        setIsUriError(true);        
        return;
    }
    toast.info("URI is valid");
  };

  const mint = () => {
    validate();
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
            label="Price"
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
            defaultValue={formState.feeAddresses.join(",")}
          />
        </Grid>

        <Grid item xs={12}>
          <label>
            Owners Percentages (comma separated for multiple percentages)
          </label>
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosize
            name="feePercetanges"
            aria-label="owners percentages"
            minRows={3}
            placeholder="Owner Percentages: the price is shared using these percentages"
            style={{ width: "100%" }}
            defaultValue={formState.feePercentages.join(",")}
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
            defaultValue={formState.royaltyAddresses.join(",")}
          />
        </Grid>

        <Grid item xs={12}>
          <label>
            Royalty Percentages (comma separated for multiple percentages)
          </label>
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosize
            name="royaltyPercetanges"
            aria-label="royalty percentages"
            minRows={3}
            placeholder="Royalty Percentages: the royalty (20%) is shared using these percentages"
            style={{ width: "100%" }}
            defaultValue={formState.royaltyPercentages.join(",")}
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
