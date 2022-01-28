App = {
  web3Provider: null,
  contracts: {
    buyBBGT: {
      abi: abi.buyBBGT,
      address: '0xa5883859d03f60ae3Be90CF8837DAfC3fa02aC7C',
    },
  },
  network: {
    chainName: 'Popcateum',
    chainId: 1213,
    nativeCurrency: {
      name: 'Pop',
      symbol: 'POP',
      decimals: 18,
    },
    rpcUrls: ['https://dataseed.popcateum.org'],
    blockExplorerUrls: ['https://explorer.popcateum.org'],
  },
  chairPerson: null,
  currentAccount: null,

  init: function () {
    App.initWeb3();
    App.changePOP();
  },
  initWeb3: async function () {
    // Is there is an injected web3 instance?
    App.web3Provider = new Web3.providers.HttpProvider(App.network.rpcUrls[0]); // 노드와의 연결
    window.web3 = new Web3(App.web3Provider);

    if (window.ethereum) {
      try {
        await App.switchNetwork();
        await App.connect();
        await App.chnaged();
      } catch (error) {
        if (error.code === 4001) {
          // User rejected request
          alert('Please reflesh this page (F5)');
        }
        console.log(error);
      }
    } else {
      alert('There is no Metamask. Please install Metamask.');
    }
    App.getBalance();
    App.getRequiredBlock();
    setInterval(App.getBalance, 1000);
  },
  switchNetwork: async function () {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x' + App.network.chainId.toString(16),
          chainName: App.network.chainName,
          nativeCurrency: App.network.nativeCurrency,
          rpcUrls: App.network.rpcUrls,
          blockExplorerUrls: App.network.blockExplorerUrls,
        },
      ],
    });
  },
  connect: async function () {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    App.currentAccount = accounts[0];
  },
  chnaged: async function () {
    ethereum.on('accountsChanged', async () => {
      console.log('chnaged address on metaMask');
      await App.connect();
    });
  },
  buyBBGT: async function () {
    const params = [
      {
        from: App.currentAccount,
        to: App.contracts.buyBBGT.address,
        data: '0xa6f2ae3a',
        value: parseInt(
          web3.utils.toWei(document.querySelector('#value').value, 'ether'),
        ).toString(16),
      },
    ];

    ethereum
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then((result) => {
        console.log(result);
        App.addTokenOnMetaMask();
      })
      .catch((error) => {
        console.error(error);
      });
  },
  changePOP: async function () {
    const value = document.querySelector('#value').value;
    document.getElementById('BBGT-value').innerHTML = new BigNumber(value)
      .multipliedBy(2)
      .toString();
  },
  addTokenOnMetaMask: async function () {
    const tokenAddress = '0x74fC142f8482c1a9E8092c0D7dfb3a3ddeE3943A';
    const tokenSymbol = 'BBGT';
    const tokenDecimals = 18;
    // const tokenImage = '';

    try {
      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            // image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        console.log('Thanks for your interest!');
      } else {
        console.log('Your loss!');
      }
    } catch (error) {
      console.log(error);
    }
  },
  getBalance: async function () {
    const contract = new web3.eth.Contract(
      App.contracts.buyBBGT.abi,
      App.contracts.buyBBGT.address,
    );
    const balance = await contract.methods.getBalance().call();
    document.getElementById('Buy-BBGT-getBalance').innerHTML = new BigNumber(
      balance,
    )
      .dividedBy(1e18)
      .toFixed(0);
  },
  getRequiredBlock: async function () {
    const contract = new web3.eth.Contract(
      App.contracts.buyBBGT.abi,
      App.contracts.buyBBGT.address,
    );
    const requiredBlock = await contract.methods.requiredBlock().call();
    document.getElementById('required-block').innerHTML =
      Number(requiredBlock) + 1;
  },
};
App.init();
