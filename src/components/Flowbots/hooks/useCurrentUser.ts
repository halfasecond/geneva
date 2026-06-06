import { useEffect, useState } from 'react';
import { getFcl } from 'utils/flowCore';

const useFlowUser = () => {
  const [flowUser, setFlowUser] = useState(undefined);

  useEffect(() => {
    const fcl = getFcl();
    const unsubscribe = fcl.currentUser.subscribe(setFlowUser);

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, []);

  return flowUser;
};

export default useFlowUser