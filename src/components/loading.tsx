import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";

export interface DialogProps {
  open: boolean;
}

const LoadingComponent = (props: DialogProps) => {
  const { open } = props;

  return (    
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
      >
        <CircularProgress color="warning" />
      </Backdrop>
  );
}

export default LoadingComponent;