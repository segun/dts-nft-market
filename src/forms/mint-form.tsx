import { Button, Grid, TextareaAutosize, TextField } from "@mui/material";
import React, { Fragment, useState } from "react";
import LoadingComponent from "../components/loading";
import { toast } from "react-toastify";

export interface MintFormState {
  uri: string;
  price: number;
  feeAddresses: string;
  feePercentages: string;
  royaltyAddresses: string;
  royaltyPercentages: string;
}
const MintForm = () => {
  const [formState, setFormState] = useState<MintFormState>({
    uri: "",
    price: 0,
    feeAddresses: "",
    feePercentages: "",
    royaltyAddresses: "",
    royaltyPercentages: "",
  });
  const [showLoading, setShowLoading] = useState(false);

  const [isUriError, setIsUriError] = useState(false);
  const [uriError, setUriError] = useState("");
  const [isPriceError, setIsPriceError] = useState(false);
  const [priceError, setPriceError] = useState("");

  const handleTextAreaChange= (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      console.log(event.target);
    setFormState({
        ...formState,
        [event.target.name]: event.target.value,
      });
  }

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

  const validateRoyaltyAddresses = () => {
    const royaltyAddresses = formState.royaltyAddresses.split(",");
    const royaltyPercentages = formState.royaltyPercentages.split(",");

    if(royaltyAddresses.length === 0 || royaltyAddresses[0].length === 0) {
      toast.error("Royalty address can not be empty");
      return;
    }

    if(royaltyPercentages.length === 0 || royaltyPercentages[0].length === 0) {
      toast.error("Royalty share percentages can not be empty");
      return;
    }      

    if(royaltyAddresses.length != royaltyPercentages.length) {
        toast.error("Royalties and Percentages not the same length - " + royaltyAddresses.length + " : " + royaltyPercentages.length);
        return false;
    }

    let sum = royaltyPercentages.map(el => +el).reduce((el, sum) => sum += el);
    if(sum !== 100) {
      toast.error("Sum of Royalty percentages must equal 100");
      return false;
    }
    return true;
  }

  const validateFeeAddresses = () => {
      const feeAddresses = formState.feeAddresses.split(",");
      const feePercentages = formState.feePercentages.split(",");

      console.log("feeAddresses: ", feeAddresses);

      if(feeAddresses.length === 0 || feeAddresses[0].length === 0) {
        toast.error("Owner address can not be empty");
        return;
      }

      if(feePercentages.length === 0 || feePercentages[0].length === 0) {
        toast.error("Owner share percentages can not be empty");
        return;
      }      

      if(feeAddresses.length != feePercentages.length) {
          toast.error("Owners and Percentages not the same length - " + feeAddresses.length + " : " + feePercentages.length);
          return false;
      }

      let sum = feePercentages.map(el => +el).reduce((el, sum) => sum += el);
      if(sum !== 100) {
        toast.error("Sum of Fee percentages must equal 100");
        return false;
      }
      return true;
  }

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

    if(formState.price < 1) {
        setPriceError("Price can not be less than one");
        setIsPriceError(true);
        return;
    }

    if(!validateFeeAddresses()) {
        return;
    }

    if(!validateRoyaltyAddresses()) {
        return;
    }    
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
            name="royaltyPercetanges"
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
