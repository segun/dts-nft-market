export interface DialogProps {
  open: boolean;
  handleClose: () => void;
  data: any
}

export interface Column {
  id: string;
  label: string;
}

export interface TokenData {
  forSale: string;
  forAuction: string;
  forLoan: string;
  onLoan: string;
  tokenId: number;
  price: string;
  minter: string;
  owner: string;
  metadata: any;
}
