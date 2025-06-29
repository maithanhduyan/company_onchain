# Solana info for test

## Smart Contract


## Wallet
root@03c64d7601e8:/workspace# mkdir -p ~/.config/solana && solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json --force
Generating a new keypair
Wrote new keypair to /root/.config/solana/id.json
======================================================================
pubkey: AJVF1pWBn5maiEqUyStTFMzKP9X19QkooudHJLC9Tbfx
======================================================================
Save this seed phrase to recover your new keypair:
round wrong kiwi whale slim device normal cause remember hunt spot boy
======================================================================

Recovered pubkey `"46UErs8JcH6ANhPNXuVhSQEfXPoLkAevYx5hWNB7zoga"`. Continue? (y/n):

solana-keygen recover prompt:// -o /root/.config/solana/id.json --no-bip39-passphrase --force

======================================================================
Tạo ví mới:
root@b94dc0f8c38f:/workspace# solana-keygen new --no-bip39-passphrase -o /tmp/new_id.json --force
Generating a new keypair
Wrote new keypair to /tmp/new_id.json
=========================================================================
pubkey: t1Rr89rba6qRXQYsd9yumKuWGVncAiMTfzyE7Lf1dLh
=========================================================================
Save this seed phrase to recover your new keypair:
grace dragon index silent north bus bicycle flame ensure item hobby focus
=========================================================================

Đặt ví mới làm ví mặc định cho Solana CLI và xác nhận pubkey đúng chuẩn cho quy trình test smart contract.

root@b94dc0f8c38f:/workspace# mkdir -p ~/.config/solana && cp /tmp/new_id.json ~/.config/solana/id.json && solana-keygen pubkey ~/.config/solana/id.json
t1Rr89rba6qRXQYsd9yumKuWGVncAiMTfzyE7Lf1dLh
=========================================================================
root@b94dc0f8c38f:/workspace# solana-keygen new --outfile programs/company_onchain/program-keypair.json --no-bip39-passphrase
Generating a new keypair
Wrote new keypair to programs/company_onchain/program-keypair.json
=========================================================================
pubkey: 5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH
=========================================================================
Save this seed phrase to recover your new keypair:
radar valve fiction lend point route defy monster old palm claim barrel
=========================================================================
Mới nhất: 
root@6700fe446f44:/workspace# mkdir -p /root/.config/solana && solana-keygen new --no-bip39-passphrase --force --outfile /root/.config/solana/id.json
Generating a new keypair
Wrote new keypair to /root/.config/solana/id.json
=========================================================================
pubkey: HMaHbBo5We8Letv9M3ncNo7BJzXZMyHFt5J77NmZiz3o
=========================================================================
Save this seed phrase to recover your new keypair:
abstract online client crater moral pet come assist copper spoil march remain
=========================================================================