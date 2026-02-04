# Solana DexScreener Bot Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SOLANA DEXSCREENER BOT                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   User Sets Up   │         │   Bot Starts     │
│   .env File      │────────▶│   & Validates    │
│   (Telegram)     │         │   Configuration  │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  Initialize Services │
                            │  • DexScreener API   │
                            │  • Telegram Bot      │
                            │  • Token Tracker     │
                            └─────────┬───────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │   Test Telegram     │
                            │   Connection        │
                            └─────────┬───────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │    START MONITORING LOOP          │
                    │    (Every 60 seconds)             │
                    └─────────────────┬─────────────────┘
                                      │
                                      ▼
              ┌───────────────────────────────────────┐
              │  1. Fetch New Solana Pairs from       │
              │     DexScreener API                   │
              │     • Filter for Solana chain         │
              │     • Get pairs from last 5 minutes   │
              └───────────────────┬───────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────┐
              │  2. For Each Token Pair:              │
              │     • Extract token address           │
              │     • Check if already sent           │
              └───────────────────┬───────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                ┌───▼────────────┐     ┌────────▼──────────┐
                │  Already Sent? │     │  New Token Found! │
                │  Skip it       │     │                   │
                └────────────────┘     └────────┬──────────┘
                                                │
                                                ▼
                                  ┌─────────────────────────┐
                                  │  3. Format Message:     │
                                  │  • Token name & symbol  │
                                  │  • Contract address     │
                                  │  • Price & liquidity    │
                                  │  • DexScreener link     │
                                  │  • Solscan link         │
                                  └───────────┬─────────────┘
                                              │
                                              ▼
                                  ┌─────────────────────────┐
                                  │  4. Send to Telegram    │
                                  │  Group via Bot API      │
                                  └───────────┬─────────────┘
                                              │
                                              ▼
                                  ┌─────────────────────────┐
                                  │  5. Mark as Sent        │
                                  │  • Add to memory set    │
                                  │  • Save to file         │
                                  │  • Log success          │
                                  └───────────┬─────────────┘
                                              │
                                              ▼
                                  ┌─────────────────────────┐
                                  │  Wait 1 second          │
                                  │  (Rate limiting)        │
                                  └───────────┬─────────────┘
                                              │
                    ┌─────────────────────────┴───────┐
                    │  More tokens to process?        │
                    └──────┬──────────────────────┬───┘
                    YES    │                      │ NO
                           │                      │
                ┌──────────▼───────┐              │
                │  Process Next    │              │
                │  Token           │              │
                └──────────────────┘              │
                                                  │
                        ┌─────────────────────────┘
                        │
                        ▼
            ┌──────────────────────────┐
            │  Wait 60 seconds         │
            │  (CHECK_INTERVAL)        │
            └────────────┬─────────────┘
                         │
                         │
            ┌────────────▼─────────────┐
            │  LOOP CONTINUES...       │
            │  (Until SIGINT/SIGTERM)  │
            └──────────────────────────┘
```

## Component Responsibilities

### 1. **config.ts** - Configuration Management
- Loads environment variables from `.env`
- Validates required configuration (bot token, chat ID)
- Provides defaults for optional settings (check interval)

### 2. **logger.ts** - Logging System
- Timestamps all log messages
- Supports info, warn, and error levels
- Outputs to console for easy monitoring

### 3. **types.ts** - Type Definitions
- TypeScript interfaces for DexScreener API responses
- Token pair data structure
- Logger interface

### 4. **dexscreener.service.ts** - DexScreener API Client
- Fetches new Solana token pairs
- Filters for recently created pairs (last 5 minutes)
- Handles API errors and rate limiting
- Returns structured token data

### 5. **telegram.service.ts** - Telegram Integration
- Sends formatted messages to Telegram
- Creates rich HTML-formatted notifications
- Handles Telegram API errors
- Tests bot connection on startup

### 6. **token-tracker.ts** - Duplicate Prevention
- Maintains in-memory set of sent tokens
- Persists to `sent-tokens.json` file
- Loads previous state on startup
- Prevents duplicate notifications

### 7. **index.ts** - Main Application
- Orchestrates all services
- Implements the monitoring loop
- Handles graceful shutdown
- Manages error recovery

## Data Flow

```
DexScreener API
      ↓
  [Raw Pairs]
      ↓
 Filter & Sort
      ↓
[Recent Solana Pairs]
      ↓
 Check Tracker
      ↓
  [New Tokens]
      ↓
Format Message
      ↓
 Telegram API
      ↓
[User's Group]
```

## Error Handling Strategy

1. **API Failures**: Log error, continue to next interval
2. **Telegram Errors**: Log error, skip token, continue
3. **Configuration Errors**: Throw error, exit process
4. **Uncaught Exceptions**: Log error, stop bot gracefully
5. **Unhandled Rejections**: Log warning, continue running

## Persistence

- **sent-tokens.json**: Stores array of sent token addresses
- Loaded on startup to prevent re-sending
- Updated after each successful send
- Survives bot restarts

## Rate Limiting

- **DexScreener**: 60-second polling interval
- **Telegram**: 1-second delay between messages
- Respects both API rate limits

## Security Considerations

- ✓ Environment variables for sensitive data
- ✓ No hardcoded credentials
- ✓ .env excluded from git
- ✓ Input validation for configuration
- ✓ HTML escaping for user-generated content
- ✓ No SQL injection risk (no database)
- ✓ No shell command injection (no exec)
