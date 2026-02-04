# Quick Start Guide 🚀

Get your Solana DexScreener bot running in under 5 minutes!

## Step 1: Prerequisites ✓

Make sure you have:
- ✓ Node.js 18+ installed
- ✓ A Telegram account
- ✓ 5 minutes of your time

## Step 2: Get Telegram Bot Token 🤖

1. Open Telegram and search for **@BotFather**
2. Send: `/newbot`
3. Enter a name: `Solana Token Monitor`
4. Enter a username: `your_unique_bot_name_bot`
5. Copy the token (looks like `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)

## Step 3: Get Your Chat ID 💬

### Method A: Using Web Browser
1. Add your bot to your Telegram group
2. Send any message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find the number after `"chat":{"id":`
5. Copy this number (e.g., `-1001234567890`)

### Method B: Using @myidbot
1. Add **@myidbot** to your group
2. Send: `/getgroupid`
3. Copy the group ID
4. Remove @myidbot (optional)

## Step 4: Configure the Bot ⚙️

```bash
# Clone and setup
cd solana
cp .env.example .env
nano .env  # or use your favorite editor
```

Edit `.env`:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHAT_ID=-1001234567890
CHECK_INTERVAL=60
```

## Step 5: Install & Run 🎯

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the bot
npm start
```

## What You'll See 👀

### On Startup:
```
[2026-02-04T10:00:00.000Z] [INFO] Bot initialized with 60s check interval
[2026-02-04T10:00:00.100Z] [INFO] 🚀 Starting Solana DexScreener Token Bot...
[2026-02-04T10:00:00.500Z] [INFO] ✅ Connected to Telegram as @your_bot_name
[2026-02-04T10:00:00.600Z] [INFO] Loaded 0 previously sent tokens
[2026-02-04T10:00:00.700Z] [INFO] 🔍 Checking for new tokens...
[2026-02-04T10:00:01.200Z] [INFO] Fetched 3 recent Solana pairs
[2026-02-04T10:00:02.000Z] [INFO] ✅ Sent alert for token: NEWTOKEN
[2026-02-04T10:00:03.500Z] [INFO] ✨ Found and sent 1 new token(s)
[2026-02-04T10:00:03.600Z] [INFO] ✅ Bot started successfully. Checking every 60s
```

### In Your Telegram Group:
```
🚀 New Solana Token Detected!

Token: Awesome Token (AWSM)
Contract: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

Chain: Solana
DEX: Raydium
Price: $0.0001234
Liquidity: $12.5K
FDV: $1.23M
Created: Wed, 04 Feb 2026 10:00:00 GMT

🔗 Links:
📊 DexScreener
�� Solscan
```

## Troubleshooting 🔧

### "Failed to connect to Telegram"
- ✓ Check your bot token is correct
- ✓ Make sure there are no extra spaces
- ✓ Verify the bot hasn't been deleted

### "No new tokens found"
- ✓ This is normal! Wait for new token launches
- ✓ The bot checks every 60 seconds automatically

### Bot not sending to group
- ✓ Verify your chat ID is correct (should be negative for groups)
- ✓ Make sure the bot is a member of the group
- ✓ Check the bot has permission to send messages

## Stopping the Bot 🛑

Press `Ctrl+C` to stop the bot gracefully:
```
[2026-02-04T10:30:00.000Z] [INFO] 📛 Received SIGINT signal
[2026-02-04T10:30:00.100Z] [INFO] Stopping bot...
[2026-02-04T10:30:00.200Z] [INFO] ✅ Bot stopped successfully
```

## Next Steps 🎓

- ✓ Read the full [README.md](README.md) for advanced configuration
- ✓ Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand how it works
- ✓ Join the Solana community and share your bot!

## Need Help? 💡

1. Check the logs for error messages
2. Review the [README.md](README.md) troubleshooting section
3. Ensure your Telegram credentials are correct
4. Verify Node.js version is 18+

---

**Happy Token Hunting! 🎯**

*Remember: Always DYOR (Do Your Own Research) before investing in any token!*
