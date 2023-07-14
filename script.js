const contractAddress = "0xA2D4cE5F37AF9F6c85277fD5f7729F5c129e20aD";
const contractABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address"
      },
      {
        internalType: "string",
        name: "message",
        type: "string"
      }
    ],
    name: "sendMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getReceivedMessages",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address"
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256"
          },
          {
            internalType: "string",
            name: "content",
            type: "string"
          }
        ],
        internalType: "struct ChatDapp.Message[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getSentMessages",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address"
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256"
          },
          {
            internalType: "string",
            name: "content",
            type: "string"
          }
        ],
        internalType: "struct ChatDapp.Message[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

let signer;
let contract;

async function connectMetamask() {
  const provider = new ethers.providers.Web3Provider(window.ethereum, 80001);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  contract = new ethers.Contract(contractAddress, contractABI, signer);

  // MetaMask -> request switch to Mumbai
  window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x13881",
        rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
        chainName: "Mumbai",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18
        },
        blockExplorerUrls: ["https://mumbai.polygonscan.com"]
      }
    ]
  });

  if (signer) {
    let connectBtn = document.getElementById("connectMetamask");
    let address = await signer.getAddress();
    let truncAddress = `${address.slice(0, 5)}...${address.slice(-4)}`;
    connectBtn.innerHTML = `Connected: ${truncAddress}`;
    connectBtn.classList.remove("btn-warning");
    connectBtn.classList.add("btn-light", "border-warning");
  } else {
    connectBtn.innerHTML = "Connect MetaMask";
    connectBtn.classList.remove("btn-dark");
    connectBtn.classList.add("btn-warning");
  }

  // Refresh immediately after connecting metamask
  await getSortedMessages();
}

async function sendMessage() {
  const recipientAddress = document.getElementById("recipientAddress").value;
  const message = document.getElementById("message").value;

  // send the transaction and wait for confirmation
  const tx = await contract.sendMessage(recipientAddress, message);
  await tx.wait();
  alert("Message sent");

  getSortedMessages();
}

// Gets all messages and displays them in the chat container

async function getSortedMessages() {
  const receivedMessages = await contract.getReceivedMessages();
  const sentMessages = await contract.getSentMessages();

  const allMessages = [...receivedMessages, ...sentMessages];
  allMessages.sort((a, b) => a.timestamp - b.timestamp);

  const messagesWithDirection = allMessages.map((message) => {
    if (receivedMessages.includes(message)) {
      return { ...message, direction: "received" };
    } else {
      return { ...message, direction: "sent" };
    }
  });

  // Displays all messages on the front-end

  const messagesDiv = document.querySelector("#messages");

  messagesWithDirection.forEach((msg) => {
    if (msg.direction == "sent") {
      let messageRow = document.createElement("div");
      messageRow.classList.add("d-flex", "flex-column", "align-items-end");

      let msgInfoDiv = document.createElement("p");
      let truncAddress = `${msg.recipient.slice(0, 5)}...${msg.recipient.slice(
        -4
      )}`;
      msgInfoDiv.innerHTML = `To: ${truncAddress} on ${msg.timestamp}`;
      msgInfoDiv.classList.add(
        "text-end",
        "text-secondary",
        "mt-2",
        "mb-0",
        "mx-0"
      );
      messageRow.appendChild(msgInfoDiv);

      let messageNode = document.createElement("p");
      messageNode.classList.add(
        "lead",
        "bg-success",
        "text-light",
        "py-2",
        "px-3",
        "mt-0",
        "mb-2",
        "mx-0",
        "rounded-pill",
        "text-end",
        "mw-50"
      );
      messageNode.innerText = msg.content;
      messageRow.appendChild(messageNode);
      messagesDiv.appendChild(messageRow);
    } else if (msg.direction == "received") {
      let messageRow = document.createElement("div");
      messageRow.classList.add("d-flex", "flex-column", "align-items-start");

      let msgInfoDiv = document.createElement("p");
      let truncAddress = `${msg.sender.slice(0, 5)}...${msg.sender.slice(-4)}`;
      msgInfoDiv.innerHTML = `From: ${truncAddress} on ${msg.timestamp}`;
      msgInfoDiv.classList.add(
        "text-start",
        "text-secondary",
        "mt-2",
        "mb-0",
        "mx-0"
      );
      messageRow.appendChild(msgInfoDiv);

      let messageNode = document.createElement("p");
      messageNode.classList.add(
        "lead",
        "bg-primary",
        "text-light",
        "py-2",
        "px-3",
        "mt-0",
        "mb-2",
        "mx-0",
        "rounded-pill",
        "text-start",
        "mw-50"
      );
      messageNode.innerText = msg.content;
      messageRow.appendChild(messageNode);
      messagesDiv.appendChild(messageRow);
    }
  });
}
