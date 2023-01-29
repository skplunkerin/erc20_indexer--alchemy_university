import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';

function App() {
  const config = {
    apiKey: import.meta.env.VITE_ALCHEMY_APIKEY,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(config);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userENS, setUserENS] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  async function getAddress(address) {
    setUserENS('');
    setUserAddress(address);
    try {
      const resolvedAddress = await alchemy.core.resolveName(address);
      if (resolvedAddress !== undefined) {
        console.log('resolvedAddress:', resolvedAddress);
        setUserAddress(resolvedAddress);
        setUserENS(address);
      }
    } catch (error) {
      // not sure why "reason" is the more user-friendly error, but it is.
      console.log('resolveName() error:', error.message);
      setErrorMessage(error.reason);
    }
    console.log('user address:', userAddress);
    return userAddress;
  }

  async function getTokenBalance() {
    setIsLoading(true);
    setErrorMessage('');
    const address = await getAddress(userAddress);
    // TODO: if address isn't an ENS, check if the address has an ENS
    //
    // const ensContractAddress = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
    // const ensNfts = await alchemy.nft.getNftsForOwner(walletAddress, {
    //   contractAddresses: [ensContractAddress],
    // });

    let data;
    try {
      data = await alchemy.core.getTokenBalances(address);
    } catch (error) {
      // not sure why "reason" is the more user-friendly error, but it is.
      console.log('getTokenBalances() error:', error.message);
      setErrorMessage(error.reason);
      setIsLoading(false);
      return;
    }

    setResults(data);
    const tokenDataPromises = [];
    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setIsLoading(false);
    setHasQueried(true);
  }
  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        {errorMessage != '' && (
          <p status="error">
            <strong>Something went wrong!</strong>
            <br />
            <strong>{errorMessage}</strong>
          </p>
        )}
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button
          fontSize={20}
          onClick={getTokenBalance}
          mt={36}
          bgColor="blue"
          disabled={isLoading}
        >
          {!isLoading && 'Check ERC-20 Token Balances'}
          {isLoading && 'Loading...'}
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  bg="blue"
                  w={'20vw'}
                  key={i}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    {Utils.formatUnits(
                      e.tokenBalance,
                      tokenDataObjects[i].decimals
                    )}
                  </Box>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! This may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
