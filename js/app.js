function scheduler(action, ms = 1000, runRightNow = true) {
  if (runRightNow) action();
  setInterval(action, ms);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const config = {
  contracts: {
    ERC20: {
      abi: abi.ERC20,
      address: '0x74fC142f8482c1a9E8092c0D7dfb3a3ddeE3943A',
    },
    buyBBGT: {
      abi: abi.buyBBGT,
      address: '0xa5883859d03f60ae3Be90CF8837DAfC3fa02aC7C',
    },
    ERC721: {
      abi: abi.ERC721,
      address: '0x7532b68eE49324C06AA33F109d65F56e00912E3c',
    },
    buyERC721: {
      abi: abi.buyERC721,
      address: '0xC41dB5BD156Fd1d28c37102A6FB987e434bf7bE6',
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
};
const App = {
  web3Provider: null,
  currentAccount: null,
  connected: false,

  init: async function () {
    await App.initWeb3();
    await ERC20.init();
    await buyERC20.init();
    await ERC721.init();
    await buyERC721.init();

    if (pageName === 'MAIN') {
      // await buyERC20.pageInit();
    }
    if (pageName === 'NFT') {
      await ERC721.pageInit();
    }
  },
  initWeb3: async function () {
    App.web3Provider = new Web3.providers.HttpProvider(
      config.network.rpcUrls[0],
    ); // 노드와의 연결
    window.web3 = new Web3(App.web3Provider);

    if (window.ethereum) {
      try {
        await App.switchNetwork();
        await App.connect();
        await App.chnaged();
      } catch (error) {
        if (error.code === 4001) {
          // User rejected request
          Alert('Please reflesh this page (F5)').close(3000);
        }
        console.log(error);
      }
    } else {
      Alert('There is no Metamask. Please install Metamask.').close(5000);
    }
  },
  switchNetwork: async function () {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x' + config.network.chainId.toString(16),
          chainName: config.network.chainName,
          nativeCurrency: config.network.nativeCurrency,
          rpcUrls: config.network.rpcUrls,
          blockExplorerUrls: config.network.blockExplorerUrls,
        },
      ],
    });
  },
  connect: async function () {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    App.currentAccount = accounts[0];
    App.connected = true;
  },
  chnaged: async function () {
    ethereum.on('accountsChanged', async () => {
      await App.connect();
    });
  },
};

function Alert(msg) {
  const div = document.createElement('div');
  div.classList.add('alert');
  div.classList.add('alert-warning');
  div.innerText = msg;
  document.getElementsByTagName('main')[0].prepend(div);
  this.close = function (ms) {
    if (ms && ms > 0) {
      setTimeout(() => div.remove(), ms);
    } else {
      div.remove();
    }
  };
  return this;
}

const ERC20 = {
  contract: null,

  init: async function () {
    this.contract = new web3.eth.Contract(
      config.contracts.ERC20.abi,
      config.contracts.ERC20.address,
    );
  },
  getAllowance: async function (spender, owner) {
    return await ERC20.contract.methods.allowance(spender, owner).call();
  },
  increaseAllowance: async function (spender, addedValue) {
    const evmData = ERC20.contract.methods
      .increaseAllowance(spender, addedValue)
      .encodeABI();
    const params = [
      {
        from: App.currentAccount,
        to: config.contracts.ERC20.address,
        data: evmData,
        value: '0x0',
      },
    ];
    return ethereum.request({
      method: 'eth_sendTransaction',
      params,
    });
  },

  addTokenOnMetaMask: async function () {
    const tokenAddress = '0x74fC142f8482c1a9E8092c0D7dfb3a3ddeE3943A';
    const tokenSymbol = 'BBGT';
    const tokenDecimals = 18;

    try {
      await ethereum.request({
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
    } catch (error) {
      console.log(error);
    }
  },
};
const buyERC20 = {
  init: async function () {
    // do nothing
  },
  pageInit: async function () {
    this.changePOP();
    scheduler(this.writeBalance, 1000);
  },
  getRequiredBlock: async function () {
    const contract = new web3.eth.Contract(
      config.contracts.buyBBGT.abi,
      config.contracts.buyBBGT.address,
    );
    const requiredBlock = await contract.methods.requiredBlock().call();
    document.getElementById('required-block').innerHTML =
      Number(requiredBlock) + 1;
  },
  getBalance: async function () {
    // erc20 contract에서 balanceOf(buyContractAddress) 해도 되는걸... 실수 ㅎ;
    const contract = new web3.eth.Contract(
      config.contracts.buyBBGT.abi,
      config.contracts.buyBBGT.address,
    );
    return await contract.methods.getBalance().call();
  },

  changePOP: async function () {
    const value = document.querySelector('#value').value;
    document.getElementById('BBGT-value').innerHTML = new BigNumber(value)
      .multipliedBy(2)
      .toString();
  },
  writeBalance: async function () {
    const balance = await buyERC20.getBalance();
    document.getElementById('Buy-BBGT-getBalance').innerHTML = new BigNumber(
      balance,
    )
      .dividedBy(1e18)
      .toFixed(0);
  },

  buyBBGT: async function () {
    const params = [
      {
        from: App.currentAccount,
        to: config.contracts.buyBBGT.address,
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
        ERC20.addTokenOnMetaMask();
      })
      .catch((error) => {
        console.error(error);
      });
  },
};

const ERC721 = {
  contract: null,
  baseURI: '',

  init: async function () {
    // do nothing
    this.contract = new web3.eth.Contract(
      config.contracts.ERC721.abi,
      config.contracts.ERC721.address,
    );
  },
  pageInit: async function () {
    this.writeMaxSupply();
    scheduler(this.writeTotalSupply, 1000);

    this.baseURI = await this.getBaseURI();
    if (App.connected) this.showMyNFTs();
  },

  getBaseURI: async function () {
    return await ERC721.contract.methods.getBaseURI().call();
  },
  getMaxSupply: async function () {
    return await ERC721.contract.methods.MAX_SUPPLY().call();
  },
  getTotalSupply: async function () {
    return await ERC721.contract.methods.totalSupply().call();
  },
  getBalanceOf: async function (address) {
    return await ERC721.contract.methods.balanceOf(address).call();
  },
  getOwnerOf: async function (address) {
    return await ERC721.contract.methods.ownerOf(address).call();
  },
  sendToken: async function (tokenID, toAddress) {
    const alert = Alert(`send #${tokenID} to ${toAddress}...`);
    const evmData = ERC721.contract.methods
      .transferFrom(App.currentAccount, toAddress, tokenID)
      .encodeABI();

    const params = [
      {
        from: App.currentAccount,
        to: config.contracts.ERC721.address,
        data: evmData,
        value: '0x0',
      },
    ];
    ethereum
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then((result) => {
        alert.close();
        console.log(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },

  getMetadata: async function (tokenId) {
    const tokenURI = ERC721.baseURI + tokenId;
    const result = await fetch(tokenURI);
    return await result.json();
  },

  clickTokenTransfer: async function (tokenId) {
    const toAddress = prompt(`send your #${tokenId}, input toAddress`);
    if (!toAddress) Alert('input valid ToAddress').close(2000);
    ERC721.sendToken(tokenId, toAddress);
  },
  makeNFTElement: function (tokenId, imagePath, attribute) {
    const div = document.createElement('div');
    div.classList.add('col');
    div.style = 'width: 15%;';
    {
      // card
      const card = document.createElement('div');
      card.classList.add('card');
      card.classList.add('h-100');
      div.appendChild(card);
      div.onclick = function () {
        ERC721.clickTokenTransfer(tokenId);
      };
      {
        // image
        const img = document.createElement('img');
        img.classList.add('card-img-top');
        img.src = imagePath;
        img.alt = '...';
        card.appendChild(img);
      }
      {
        // desc
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const title = document.createElement('h5');
        title.classList.add('card-title');
        title.innerText = `#${tokenId}`;
        cardBody.appendChild(title);

        // const text = document.createElement('p');
        // text.classList.add('card-text');
        // text.innerText = JSON.stringify(attribute);
        // cardBody.appendChild(text);

        card.appendChild(cardBody);
      }
    }

    return div;
  },
  appendNFT: async function (tokenId) {
    const metadata = await ERC721.getMetadata(tokenId);
    const nftElement = ERC721.makeNFTElement(
      tokenId,
      metadata.image,
      metadata.attributes,
    );
    document.getElementById('my-nft-list').appendChild(nftElement);

    const tmp = document.querySelector('#my-nft-list span');
    if (tmp) {
      tmp.remove();
    }
  },
  showMyNFTs: async function () {
    const balance = await ERC721.getBalanceOf(App.currentAccount);
    const total = await ERC721.getTotalSupply();

    let ownerCount = 0;
    for (const index of Array.from(Array(Number(total)).keys())) {
      const tokenId = index + 1;
      const owner = await ERC721.getOwnerOf(tokenId);
      if (owner.toLowerCase() == App.currentAccount.toLowerCase()) {
        ownerCount += 1;
        ERC721.appendNFT(tokenId);
        await sleep(1000); // for Pinata GWS req limit
        if (balance <= ownerCount) break;
      }
    }
  },
  writeMaxSupply: async function () {
    document.getElementById('max-supply').innerHTML =
      await ERC721.getMaxSupply();
  },
  writeTotalSupply: async function () {
    document.getElementById('total-supply').innerHTML =
      await ERC721.getTotalSupply();
  },
};

const buyERC721 = {
  contract: null,
  pricePerPOP: 9999, // TMP
  pricePerBBGT: 1999, // TMP
  init: async function () {
    // do nothing
    this.contract = new web3.eth.Contract(
      config.contracts.buyERC721.abi,
      config.contracts.buyERC721.address,
    );
  },

  getIsSale: async function () {
    return await buyERC721.contract.methods.isSale().call();
  },

  mintWithPOP: async function () {
    const numberOfTokens = document.getElementById('number-of-tokens').value;
    if (numberOfTokens > 5)
      return Alert('only mint 3 NFT at a time').close(3000);
    const value = new BigNumber(web3.utils.toWei(numberOfTokens, 'ether'))
      .multipliedBy(buyERC721.pricePerPOP)
      .toFixed();

    const evmData = buyERC721.contract.methods
      .mintByPOP(numberOfTokens)
      .encodeABI();

    buyERC721.sendMint(web3.utils.toHex(value), evmData);
  },
  mintWithBBGT: async function () {
    const numberOfTokens = document.getElementById('number-of-tokens').value;
    if (numberOfTokens > 5)
      return Alert('only mint 5 NFT at a time').close(3000);
    const amount = new BigNumber(numberOfTokens).multipliedBy(
      buyERC721.pricePerBBGT,
    );
    const amountWei = new BigNumber(
      web3.utils.toWei(amount.toString(), 'ether'),
    );
    const allowanceWei = await ERC20.getAllowance(
      App.currentAccount,
      config.contracts.buyERC721.address,
    );
    const diffWei = amountWei.minus(allowanceWei);

    const evmData = buyERC721.contract.methods
      .mintByBBGT(numberOfTokens)
      .encodeABI();

    if (diffWei.isGreaterThan(0)) {
      // need more approve
      const hash = await ERC20.increaseAllowance(
        config.contracts.buyERC721.address,
        diffWei.toFixed(),
      );
      const alert = Alert(
        'Please wait for the increaseAllowance transaction will be confirmed.',
      );
      const interval = setInterval(function () {
        web3.eth.getTransactionReceipt(hash, function (err, rec) {
          console.log('watting increaseAllowance tx receipt...');
          if (rec) {
            alert.close();
            buyERC721.sendMint(0, evmData);
            clearInterval(interval);
          }
        });
      }, 2000);
    } else {
      buyERC721.sendMint(0, evmData);
    }
  },

  sendMint: async function (value, evmData) {
    const isSale = await buyERC721.getIsSale();
    // if (!isSale) {
    //   Alert('The sale has not started.').close(3000);
    //   return;
    // }

    const params = [
      {
        from: App.currentAccount,
        to: config.contracts.buyERC721.address,
        data: evmData,
        value,
      },
    ];
    ethereum
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },
};

App.init();
