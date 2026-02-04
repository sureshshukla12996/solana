# Solana DexScreener Bot 🚀

A Node.js bot that monitors DexScreener for newly launched Solana tokens and automatically sends their contract addresses and details to a Telegram group.

## Features

- 🔍 **Ultra-Fast Monitoring**: Checks DexScreener every 20 seconds for newly launched tokens
- ⏱️ **Strict Time Filter**: Only shows tokens launched in the last 60 seconds (1 minute)
- 📦 **Batch Sending**: Sends up to 10 tokens at once when multiple new launches are detected
- 📱 **Telegram Notifications**: Sends formatted alerts with token details to your Telegram group
- 🚫 **Duplicate Prevention**: Tracks sent tokens to avoid duplicate notifications (auto-cleans after 2 minutes)
- 🛡️ **Error Handling**: Continues batch sending even if individual tokens fail
- 📊 **Comprehensive Details**: Includes token name, symbol, contract address, liquidity, price, and launch time in seconds
- ⚙️ **Configurable**: Easy configuration via environment variables
- 📋 **Enhanced Logging**: Detailed processing information showing filters, batches, and status

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- A Telegram bot token
- A Telegram chat/group ID

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sureshshukla12996/solana.git
   cd solana
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your configuration:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   CHECK_INTERVAL=20
   MAX_TOKEN_AGE_SECONDS=60
   MAX_TOKENS_PER_BATCH=10
   MIN_LIQUIDITY_USD=50
   DEBUG_MODE=true
   ```

## Getting Telegram Credentials

### Getting Your Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the prompts to create your bot:
   - Choose a name for your bot (e.g., "Solana Token Monitor")
   - Choose a username (must end with 'bot', e.g., "solana_token_monitor_bot")
4. BotFather will give you a token that looks like: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`
5. Copy this token and add it to your `.env` file as `TELEGRAM_BOT_TOKEN`

### Getting Your Chat ID

**Option 1: Using a Web Browser**

1. Add your bot to your group/channel
2. Send a message in the group (any message)
3. Open this URL in your browser (replace `<YOUR_BOT_TOKEN>` with your actual token):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. Look for `"chat":{"id":` in the JSON response
5. The number after `"id":` is your chat ID (e.g., `-1001234567890` for groups)
6. Add this to your `.env` file as `TELEGRAM_CHAT_ID`

**Option 2: Using IDBot**

1. Add [@myidbot](https://t.me/myidbot) to your group
2. Send `/getgroupid` in the group
3. The bot will reply with your group's chat ID
4. Remove @myidbot from the group (optional)

## Usage

### Build the Project

```bash
npm run build
```

### Start the Bot

**Production mode:**
```bash
npm start
```

**Development mode (with ts-node):**
```bash
npm run dev
```

### What to Expect

Once started, the bot will:
1. Connect to Telegram and verify credentials
2. Start monitoring DexScreener every 20 seconds (or your configured interval)
3. Filter tokens strictly to only those launched within the last 60 seconds
4. Send up to 10 new tokens per check cycle
5. Display detailed logging showing filtering and batch processing

**Example notification:**
```
🚀 NEW TOKEN #1

Token: Example Token (EXT)
Contract: 7xK...asU

⚡ Launched 15 seconds ago
💰 $0.0001 | 💧 $250
⛓️ Solana | Raydium
🔗 DexScreener | Solscan
```

**Example log output:**
```
[07:30:00] 🔍 Checking DexScreener...
[07:30:00] 📊 Found 50 total Solana pairs
[07:30:00] ⏱️  After time filter: 6 tokens within last 60 seconds
[07:30:00] 💧 After liquidity filter: 5 tokens meet liquidity requirement ($50+)
[07:30:00] 📦 Returning 5 tokens (max batch size: 10)
[07:30:00] Already sent: 0, New: 5
[07:30:00] ✅ Sending 5 token(s) to Telegram
[07:30:00]   ✅ Token 1: TokenA (15s old) - SENT
[07:30:01]   ✅ Token 2: TokenB (25s old) - SENT
[07:30:03]   ✅ Token 3: TokenC (40s old) - SENT
[07:30:04]   ✅ Token 4: TokenD (50s old) - SENT
[07:30:06]   ✅ Token 5: TokenE (58s old) - SENT
[07:30:06] 📊 Batch complete: 5 sent, 0 failed
[07:30:06] Total tokens tracked: 5
[07:30:06] Next check in 20 seconds.
```

## Configuration Options

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from BotFather | - | Yes |
| `TELEGRAM_CHAT_ID` | Target chat/group ID for notifications | - | Yes |
| `CHECK_INTERVAL` | How often to check for new tokens (seconds) | 20 | No |
| `MAX_TOKEN_AGE_SECONDS` | Maximum age of tokens to report (seconds) | 60 | No |
| `MAX_TOKENS_PER_BATCH` | Maximum number of tokens to send per batch | 10 | No |
| `MIN_LIQUIDITY_USD` | Minimum liquidity in USD to filter tokens | 50 | No |
| `DEBUG_MODE` | Enable detailed logging (true/false) | true | No |

## Project Structure

```
solana/
├── src/
│   ├── index.ts                 # Main bot application
│   ├── config.ts                # Configuration loader
│   ├── logger.ts                # Logging utility
│   ├── types.ts                 # TypeScript type definitions
│   ├── dexscreener.service.ts   # DexScreener API integration
│   ├── telegram.service.ts      # Telegram bot integration
│   └── token-tracker.ts         # Duplicate prevention system
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## How It Works

1. **Ultra-Fast Monitoring**: The bot polls the DexScreener API every 20 seconds (configurable)
2. **Strict Time Filtering**: Only shows tokens launched within the last 60 seconds
3. **Liquidity Filtering**: Filters tokens by minimum liquidity threshold (default: $50 USD)
4. **Batch Processing**: Collects up to 10 qualifying tokens per check
5. **Duplicate Check**: Prevents re-sending tokens already sent (tracks for 2 minutes)
6. **Batch Notification**: Sends all new tokens with 1.5-second delays between messages to respect rate limits
7. **Error Resilience**: Continues sending remaining tokens even if individual sends fail
8. **Auto Cleanup**: Automatically removes tokens from tracking after 2 minutes

## Error Handling

- **API Failures**: Automatically retries on next interval if API calls fail
- **Telegram Errors**: Logs individual token send failures and continues with remaining batch
- **Rate Limiting**: Adds 1.5-second delays between messages to respect Telegram's rate limits (~20 messages/minute)
- **Batch Resilience**: If one token fails to send, the bot continues with the next tokens in the batch
- **Graceful Shutdown**: Handles SIGINT and SIGTERM signals for clean shutdowns
- **Auto Cleanup**: Removes old tokens from tracking automatically every 30 seconds

## Logging

The bot logs all activities to the console with timestamps:
- ℹ️ Info: General operations and status updates
- ⚠️ Warnings: Non-critical issues
- ❌ Errors: Failed operations with details

## Troubleshooting

### "TELEGRAM_BOT_TOKEN environment variable is required"
- Make sure you've created a `.env` file with your bot token
- Verify the token is correctly copied from BotFather

### "Failed to connect to Telegram"
- Check that your bot token is valid
- Ensure your bot is not blocked
- Verify network connectivity

### "No new tokens found"
- This is normal if there are no recent token launches
- The bot checks every configured interval
- DexScreener API may have rate limits

### Bot sends messages but not to my group
- Verify your chat ID is correct (should be negative for groups)
- Ensure the bot is added to the group as a member
- Check that the bot has permission to send messages in the group

## Development

### Watch Mode

For development with automatic recompilation:
```bash
npm run watch
```

### Adding New Features

The codebase is modular and easy to extend:
- **DexScreener Service**: Modify `dexscreener.service.ts` to change data fetching
- **Telegram Service**: Update `telegram.service.ts` to customize message formatting
- **Token Tracker**: Extend `token-tracker.ts` for advanced tracking logic

## Security

- Never commit your `.env` file to version control
- Keep your bot token private
- Regularly rotate your bot token if compromised
- Use environment variables for all sensitive configuration

## Performance

- **Memory Usage**: The bot tracks sent tokens in memory and persists to disk
- **API Limits**: Respects DexScreener and Telegram API rate limits
- **Scalability**: Can handle hundreds of new tokens per day

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this bot for your own projects!

## Disclaimer

This bot is for informational purposes only. Always do your own research (DYOR) before investing in any cryptocurrency. The developers are not responsible for any financial losses.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Open an issue on GitHub with detailed information

---

**Made with ❤️ for the Solana community**