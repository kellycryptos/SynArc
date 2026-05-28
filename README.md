# SynArc

![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)
![Arc Testnet](https://img.shields.io/badge/Arc-Testnet-6366f1?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-95%25-3178c6?style=flat-square&logo=typescript)
![Solidity](https://img.shields.io/badge/Solidity-2.3%25-363636?style=flat-square&logo=solidity)

> Governance infrastructure for the agentic economy on Arc Network.

🌐 Live: [synarcdao.xyz](https://www.synarcdao.xyz)
📚 Docs: [docs.synarcdao.xyz](https://docs.synarcdao.xyz)
🔍 Explorer: [testnet.arcscan.app](https://testnet.arcscan.app)

---

## Overview

SynArc enables DAOs, AI agents, and autonomous systems to coordinate, vote, and manage USDC-native treasuries on Arc — Circle's blockchain built for the internet economy.

## Features

- 🏛 **On-chain governance** — proposals, voting, execution
- 💰 **USDC + EURC treasury management**
- 🤖 **AI-powered proposal analysis** via Groq
- 🌉 **Cross-chain USDC bridging** via Circle Bridge Kit
- 🏢 **Multi-DAO registry** — host multiple communities
- 🔐 **Privy embedded wallet** onboarding
- ⚡ **Arc Testnet native** — USDC gas

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, TailwindCSS, Framer Motion |
| **Blockchain** | Arc Testnet (Chain ID: `5042002`) |
| **Contracts** | Solidity, Hardhat |
| **Wallet** | Privy |
| **Stablecoins** | USDC + EURC (Circle) |
| **AI** | Groq (Llama 3.3 70B) |
| **Bridge** | Circle Bridge Kit + CCTP |
| **Email** | Resend |
| **Hosting** | Vercel |

## Smart Contracts (Arc Testnet)

| Contract | Address |
|----------|---------|
| **Governor** | `0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702` |
| **Treasury** | `0x8Ab21363cB0319548B051f129e477393908be7c1` |
| **sARC Token** | `0x637cA7788aBC956832F389A7BB895D5249FE757B` |
| **EURC** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |

## Roadmap

- [x] Governance contracts deployed on Arc Testnet
- [x] USDC + EURC treasury
- [x] Multi-DAO registry
- [x] AI governance analysis
- [x] Circle Bridge Kit integration
- [ ] Mainnet deployment
- [ ] Circle Programmable Wallets
- [ ] Mobile app
- [ ] AI Agent SDK
- [ ] One-click DAO creation

## Contact

- 📧 Email: devsynarc@gmail.com
- 💬 Telegram: [@Kellycryptos](https://t.me/Kellycryptos)
- 🐦 Twitter: [@Kellycryptos](https://x.com/Kellycryptos)

## License

MIT © 2026 SynArc
