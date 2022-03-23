import React, { useState } from 'react';

const WalletStateSkeleton = {
    queuedTx: null,
    pendingTx: [],
    completedTx: null,
    warning: null,
    noOperations: 0,
    addNewQueuedTx: (action: Promise<any>, description: any, meta: any) => null,
    convertQueuedToPending: (_tx: any, _description: any, _meta: any) => null,
    doAnOperation: () => null,
    isBusy: () => null,
};

const WalletStateContext = React.createContext(WalletStateSkeleton); // Create context with defaults

export const getWalletStateContext = () => {
    return WalletStateContext;
};

const DISMISS_WARNINGS_TIMEOUT = 3000; // time to let warnings linger on state
const DISMISS_SUCCESS_TIMEOUT = 3000; // time to let successes linger on state
const NUMBER_OF_CONFIRMATIONS_REQUIRED = 1;

const WalletStateProvider = ({ children }) => {
    // TODO: potentially load state saved in localstorage
    const [queuedTx, setQueuedTx] = useState<any>();
    const [pendingTx, setPendingTx] = useState<any>();
    const [completedTx, setCompletedTx] = useState<any>();
    const [noOperations, setNoOperations] = useState(0);
    const [warning, setWarning] = useState<any>();

    const doAnOperation = () => {
        setNoOperations(noOperations + 1);
    };

    // Close Pending TX on SUCCESS.
    const closePendingTx = (hash: string, description: any, meta: any) => {
        console.log(
            '[WALLETCONTEXT]: closePendingTx called with has: ',
            hash,
            ' and current pendingTx array which is: ',
            pendingTx,
        );
        const existingPendingTx = pendingTx.find((e: any) => e.hash === hash);
        if (existingPendingTx) {
            setPendingTx(pendingTx.filter((e: any) => e.hash !== hash));
            // const appendedCompleted = completedTx.concat(existingPendingTx);
            setCompletedTx(existingPendingTx);
            setTimeout(() => {
                setCompletedTx(undefined);
            }, DISMISS_SUCCESS_TIMEOUT);
        } else {
            // if the update was so fast that a close was called on pendingTx and that is not yet there, we can just append straight to the completed:
            setCompletedTx({ hash, description, meta });

            setTimeout(() => {
                setCompletedTx(null);
            }, DISMISS_SUCCESS_TIMEOUT);
            setPendingTx([]);
        }
    };

    const convertQueuedToPending = (tx: { hash: any; wait: (arg0: number) => Promise<any>; }, description: any, meta: any) => {
        console.log('Converting Queued To Pending');
        setNoOperations(noOperations + 1);
        setQueuedTx(null); // There will only ever be ONE queued TX.
        const appendedPending = pendingTx.concat({
            tx,
            description,
            meta,
            hash: tx.hash,
        });
        // Add to the pending tx array:
        setPendingTx(appendedPending);
        // Create a hook for moving this pending item to completed

        // const boundClosePendingCall = closePendingTx.bind(this, appendedPending, tx.hash);
        console.log('Waiting for Confirmation');
        tx.wait(NUMBER_OF_CONFIRMATIONS_REQUIRED).then(
            () => {
                console.log('Should be success');
                closePendingTx(tx.hash, description, meta);
            },
            (error: any) => {
                closePendingTx(tx.hash, description, meta);
                console.log('Should be Error');
                console.log(error);
            },
        );
    };

    const addNewQueuedTx = (action: Promise<any>, description: any, meta: any) => {
        setNoOperations(noOperations + 1);
        setWarning(null);
        setQueuedTx({ action, description });
        // subscribe to this event:
        action
            .then((result: any) => {
                // this is the on receipt, basically accepted on blockchain w/ hash, move from queuedTx to pendingTx:
                convertQueuedToPending(result, description, meta);
            })
            .catch((err: { data: { message: any; }; message: any; }) => {
                // if it fails to be accepted by user, display as warning (i guess):
                const warning = (err.data && err.data.message) || err.message;
                setWarning(warning);
                setTimeout(() => {
                    setWarning(null);
                }, DISMISS_WARNINGS_TIMEOUT);
                setCompletedTx(null);
                setPendingTx([]);
                setQueuedTx(null);
            });
    };

    const isBusy = () => {
        return pendingTx.length > 0 || queuedTx;
    };

    return (
        <WalletStateContext.Provider
            value={{
                queuedTx,
                pendingTx,
                completedTx,
                noOperations,
                warning,
                addNewQueuedTx,
                convertQueuedToPending,
                doAnOperation,
                isBusy,
            }}
        >
            {children}
        </WalletStateContext.Provider>
    );
};

export { WalletStateProvider, WalletStateContext };
